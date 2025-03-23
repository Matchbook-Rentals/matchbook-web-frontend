'use client';
//Imports
import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { optimisticDislikeDb, optimisticRemoveDislikeDb } from '@/app/actions/dislikes';
import { optimisticApplyDb, optimisticRemoveApplyDb } from '@/app/actions/housing-requests';
import { updateTripFilters } from '@/app/actions/trips';
import { CategoryType, getBooleanFilters, getFiltersByCategory, tripFilters } from '@/constants/filters';
import { useActionPopup } from '@/hooks/use-action-popup'
import ActionPopup from '@/app/platform/searches/(components)/action-popup'

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

interface FilterOptions {
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number;
  minBeds: number | null;
  minBathrooms: number;
  furnished: boolean;
  unfurnished: boolean;
  utilities: string[];
  pets: string[];
  searchRadius: number;
  accessibility: string[];
  location: string[];
  parking: string[];
  kitchen: string[];
  climateControl: string[];
  luxury: string[];
  laundry: string[];
}

interface TripContextType {
  state: {
    trip: TripAndMatches;
    listings: ListingAndImages[];
    showListings: ListingAndImages[];
    viewedListings: ViewedListing[];
    likedListings: ListingAndImages[];
    dislikedListings: ListingAndImages[];
    requestedListings: ListingAndImages[];
    matchedListings: ListingAndImages[];
    isLoading: boolean;
    hasApplication: boolean;
    application: ApplicationWithArrays | null;
    lookup: {
      favIds: Set<string>;
      dislikedIds: Set<string>;
      requestedIds: Set<string>;
      matchIds: Set<string>;
    };
    filters: FilterOptions;
  };
  actions: {
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    setTrip: React.Dispatch<React.SetStateAction<TripAndMatches[]>>;
    setLookup: React.Dispatch<React.SetStateAction<TripContextType['state']['lookup']>>;
    setHasApplication: React.Dispatch<React.SetStateAction<boolean>>;
    optimisticLike: (listingId: string, withPopup: Boolean) => Promise<void>;
    optimisticDislike: (listingId: string) => Promise<void>;
    optimisticRemoveLike: (listingId: string) => Promise<void>;
    optimisticRemoveDislike: (listingId: string) => Promise<void>;
    optimisticApply: (listing: ListingAndImages) => Promise<void>;
    optimisticRemoveApply: (listingId: string) => Promise<void>;
    updateFilter: (key: keyof FilterOptions, value: any) => void;
    updateFilters: (newFilters: FilterOptions) => void;
  };
}

interface TripContextProviderProps {
  children: ReactNode;
  tripData: TripAndMatches;
  listingData: ListingAndImages[];
  hasApplicationData?: boolean;
  application?: ApplicationWithArrays | null;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripContextProvider');
  }
  return context;
};

export const TripContextProvider: React.FC<TripContextProviderProps> = ({ children, listingData, tripData, application, hasApplicationData }) => {
  const [listings, setListings] = useState(listingData);
  const [trip, setTrip] = useState(tripData);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(hasApplicationData);
  const [lookup, setLookup] = useState<TripContextType['state']['lookup']>({
    favIds: new Set(),
    dislikedIds: new Set(),
    requestedIds: new Set(),
    matchIds: new Set()
  });
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: tripData.minPrice || null,
    maxPrice: tripData.maxPrice || null,
    minBeds: tripData.minBeds || 0,
    minBedrooms: tripData.minBedrooms || 0,
    minBathrooms: tripData.minBathrooms || 0,
    furnished: tripData.furnished || false,
    unfurnished: tripData.unfurnished || false,
    propertyTypes: [
      ...getFiltersByCategory(CategoryType.PROPERTY_TYPE)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    utilities: [
      ...(tripData.utilitiesIncluded ? ['utilitiesIncluded'] : []),
      ...(tripData.utilitiesNotIncluded ? ['utilitiesNotIncluded'] : [])
    ] as ('utilitiesIncluded' | 'utilitiesNotIncluded')[],
    pets: [
      ...(tripData.petsAllowed ? ['petsAllowed'] : []),
      ...(tripData.petsNotAllowed ? ['petsNotAllowed'] : [])
    ] as ('petsAllowed' | 'petsNotAllowed')[],
    searchRadius: tripData.searchRadius || 50,
    accessibility: [
      ...getFiltersByCategory(CategoryType.ACCESSIBILITY)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    location: [
      ...getFiltersByCategory(CategoryType.LOCATION)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    parking: [
      ...getFiltersByCategory(CategoryType.PARKING)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    kitchen: [
      ...getFiltersByCategory(CategoryType.KITCHEN)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    climateControl: [
      ...getFiltersByCategory(CategoryType.CLIMATE_CONTROL)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    luxury: [
      ...getFiltersByCategory(CategoryType.LUXURY)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
    laundry: [
      ...getFiltersByCategory(CategoryType.LAUNDRY)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name)
    ],
  });

  const { showActionPopup, currentAction, triggerPopup } = useActionPopup();

  // Calculate U-Score for a listing
  const calculateUScore = (
    listing: ListingAndImages & { calculatedPrice: number },
    lowestPrice: number,
    highestPrice: number,
    highestDistance: number,
    highestSquareFootage: number,
    highestRoomCount: number,
    highestBathroomCount: number
  ): number => {
    const priceScore = ((highestPrice - listing.calculatedPrice) / (highestPrice - lowestPrice)) * 10;
    const distanceScore = (1 - (listing.distance || 0) / highestDistance) * 9;
    const squareFootageScore = ((listing.squareFootage || 0) / highestSquareFootage) * 8;
    const roomCountScore = ((listing.roomCount || 0) / highestRoomCount) * 6;
    const bathroomCountScore = ((listing.bathroomCount || 0) / highestBathroomCount) * 7;

    return priceScore + distanceScore + squareFootageScore + roomCountScore + bathroomCountScore;
  };

  const sortListingsByUScore = (listings: ListingAndImages[]) => {
    // Pre-calculate prices for all listings
    const listingsWithPrices = listings.map(listing => {
      const calculatedPrice = calculateRent({ listing, trip });
      return {
        ...listing,
        calculatedPrice,
      };
    });

    let lowestPrice = Infinity;
    let highestPrice = 0;
    let highestDistance = 0;
    let highestSquareFootage = 0;
    let highestRoomCount = 0;
    let highestBathroomCount = 0;

    listingsWithPrices.forEach(listing => {
      if (listing.calculatedPrice < lowestPrice) {
        lowestPrice = listing.calculatedPrice;
      }
      if (listing.calculatedPrice > highestPrice) {
        highestPrice = listing.calculatedPrice;
      }
      if (listing.distance && listing.distance > highestDistance) {
        highestDistance = listing.distance;
      }
      if (listing.squareFootage && listing.squareFootage > highestSquareFootage) {
        highestSquareFootage = listing.squareFootage;
      }
      if (listing.roomCount && listing.roomCount > highestRoomCount) {
        highestRoomCount = listing.roomCount;
      }
      if (listing.bathroomCount && listing.bathroomCount > highestBathroomCount) {
        highestBathroomCount = listing.bathroomCount;
      }
    });

    const updatedListings = listingsWithPrices.map(listing => {
      const uScore = calculateUScore(
        listing,
        lowestPrice,
        highestPrice,
        highestDistance,
        highestSquareFootage,
        highestRoomCount,
        highestBathroomCount
      );
      return { ...listing, price: listing.calculatedPrice, uScore };
    });

    const sortedListings = updatedListings.sort((a, b) => b.uScore - a.uScore);

    return sortedListings;
  };

  useEffect(() => {
    const sortedListings = sortListingsByUScore(listingData);
    setListings(sortedListings);
  }, []);

  useEffect(() => {
    setLookup({
      favIds: new Set(trip?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
      dislikedIds: new Set(trip?.dislikes.map(dislike => dislike.listingId)),
      requestedIds: new Set(trip?.housingRequests.map(request => request.listingId)),
      matchIds: new Set(trip?.matches.map(match => match.listingId))
    });
  }, [trip]);

  const getRank = useCallback((listingId: string) => lookup.favIds.has(listingId) ? 0 : Infinity, [lookup.favIds]);

  // This code filters and memoizes the listings to be shown
  const showListings = useMemo(() =>
    listings.filter(listing => {
      // Check if the listing is not favorited, disliked, or requested
      const isNotFavorited = !lookup.favIds.has(listing.id);
      const isNotDisliked = !lookup.dislikedIds.has(listing.id);
      const isNotRequested = !lookup.requestedIds.has(listing.id);

      // Check if the listing is available during the trip period
      const isAvailable = !listing.unavailablePeriods?.some(period => {
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        const searchStart = new Date(trip?.startDate || '');
        const searchEnd = new Date(trip?.endDate || '');

        // Check for any overlap between the unavailable period and the trip dates
        return (
          (searchStart >= periodStart && searchStart <= periodEnd) ||
          (searchEnd >= periodStart && searchEnd <= periodEnd) ||
          (searchStart <= periodStart && searchEnd >= periodEnd)
        );
      });

      // Property type filter
      const matchesPropertyType = filters.propertyTypes.length === 0 ||
        filters.propertyTypes.includes(listing.category);

      // Price filter - only apply if min or max price is set
      const price = listing.calculatedPrice || 0;
      const matchesPrice = (filters.minPrice === null || price >= filters.minPrice) &&
        (filters.maxPrice === null || price <= filters.maxPrice);

      const matchesRadius = filters.searchRadius === 0 || (listing.distance || 100) < filters.searchRadius;

      // Room filters
      const matchesBedrooms = !filters.minBedrooms || (listing.bedrooms?.length || 0) >= filters.minBedrooms;
      const matchesBaths = !filters.minBathrooms || listing.bathroomCount >= filters.minBathrooms;

      // Furniture filter
      const matchesFurniture =
        (!filters.furnished && !filters.unfurnished) ||
        (filters.furnished && listing.furnished) ||
        (filters.unfurnished && !listing.furnished);

      // Utilities filter
      const matchesUtilities =
        filters.utilities.length === 0 || filters.utilities.length === 2 ||
        (filters.utilities.includes('included') && listing.utilitiesIncluded) ||
        (filters.utilities.includes('notIncluded') && !listing.utilitiesIncluded);

      // Pets filter
      const matchesPets =
        filters.pets.length === 0 || filters.pets.length === 2 ||
        (filters.pets.includes('allowed') && listing.petsAllowed) ||
        (filters.pets.includes('notAllowed') && !listing.petsAllowed);

      // Amenity filters
      const matchesAccessibility = filters.accessibility?.length === 0 ||
        filters.accessibility?.every(amenity => listing[amenity]);

      const matchesLocation = filters.location?.length === 0 ||
        filters.location?.every(feature => listing[feature]);

      const matchesParking = filters.parking?.length === 0 ||
        filters.parking?.every(option => listing[option]);

      const matchesKitchen = filters.kitchen?.length === 0 ||
        filters.kitchen?.every(appliance => listing[appliance]);

      const matchesClimateControl = filters.climateControl?.length === 0 ||
        filters.climateControl?.every(control => listing[control]);

      const matchesLuxury = filters.luxury?.length === 0 ||
        filters.luxury?.every(amenity => listing[amenity]);

      // For laundry, we check for (inComplex, inUnit, notAvailable)
      const matchesLaundry = filters.laundry?.length === 0 || filters.laundry?.length === 3 ||
        filters.laundry?.some(option => listing[option]);

      // Return true if the listing meets all criteria
      return isNotFavorited &&
        isNotDisliked &&
        isNotRequested &&
        isAvailable &&
        matchesPropertyType &&
        matchesPrice &&
        matchesRadius &&
        matchesBedrooms &&
        matchesBaths &&
        matchesFurniture &&
        matchesUtilities &&
        matchesPets &&
        matchesAccessibility &&
        matchesLocation &&
        matchesParking &&
        matchesKitchen &&
        matchesClimateControl &&
        matchesLuxury &&
        matchesLaundry;
    }),
    [listings, lookup, trip, filters]
  );

  const likedListings = useMemo(() =>
    listings
      .filter(listing => lookup.favIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.favIds, lookup.requestedIds, getRank]
  );

  const dislikedListings = useMemo(() =>
    listings
      .filter(listing => lookup.dislikedIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.dislikedIds, getRank]
  );

  const requestedListings = useMemo(() =>
    listings
      .filter(listing => lookup.requestedIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.requestedIds, getRank]
  );

  const matchedListings = useMemo(() =>
    listings
      .filter(listing => lookup.matchIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.matchIds, getRank]
  );

  const optimisticRemoveApply = useCallback(async (listingId: string) => {
    console.log(listingId);
    try {
      // Skip if not requested
      if (!lookup.requestedIds.has(listingId)) return;

      // Optimistically update the UI
      setLookup(prev => ({
        ...prev,
        requestedIds: new Set([...prev.requestedIds].filter(id => id !== listingId))
      }));

      const result = await optimisticRemoveApplyDb(trip.id, listingId);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          requestedIds: new Set([...prev.requestedIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Failed to remove application:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        requestedIds: new Set([...prev.requestedIds, listingId])
      }));
    }
  }, [trip, lookup]);

  const optimisticRemoveLike = useCallback(async (listingId: string, withPopup = false) => {
    if (withPopup) {
      triggerPopup('back');
    }
    try {
      // Skip if not liked
      if (!lookup.favIds.has(listingId)) return;

      const isRequested = lookup.requestedIds.has(listingId);

      // If there's an application, remove it first
      if (isRequested) {
        await optimisticRemoveApply(listingId);
      }

      // Then remove from favorites
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds].filter(id => id !== listingId)),
      }));

      const result = await optimisticRemoveFavorite(trip.id, listingId);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          favIds: new Set([...prev.favIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Failed to remove like:', error);
    }
  }, [trip, lookup, optimisticRemoveApply, triggerPopup]);

  const optimisticLike = useCallback(async (listingId: string, withPopup = false) => {
    if (withPopup) {
      triggerPopup('like');
    }
    try {
      if (lookup.favIds.has(listingId)) {
        return;
      }

      // Store initial state
      const wasDisliked = lookup.dislikedIds.has(listingId);

      // Optimistically update UI
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds, listingId]),
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
      }));

      // Handle existing states
      if (wasDisliked) {
        await optimisticRemoveDislikeDb(trip.id, listingId);
      }

      const result = await optimisticFavorite(trip.id, listingId);

      if (!result.success) {
        // Rollback to previous state
        setLookup(prev => ({
          ...prev,
          favIds: new Set([...prev.favIds].filter(id => id !== listingId)),
          dislikedIds: wasDisliked
            ? new Set([...prev.dislikedIds, listingId])
            : prev.dislikedIds,
        }));
      }
    } catch (error) {
      console.error('Failed to like listing:', error);
    }
  }, [trip, lookup, triggerPopup]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    triggerPopup('dislike');
    try {
      if (lookup.dislikedIds.has(listingId)) return;

      // Store the initial favorite state before any changes
      const wasFavorited = lookup.favIds.has(listingId);

      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds, listingId]),
        favIds: new Set([...prev.favIds].filter(id => id !== listingId))
      }));

      // If the listing was favorited, remove the favorite first
      if (wasFavorited) {
        await optimisticRemoveFavorite(trip.id, listingId);
      }

      const result = await optimisticDislikeDb(trip.id, listingId);

      if (!result.success) {
        // Rollback to the exact previous state
        setLookup(prev => ({
          ...prev,
          dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId)),
          favIds: wasFavorited
            ? new Set([...prev.favIds, listingId])
            : prev.favIds
        }));
      }
    } catch (error) {
      console.error('Failed to dislike listing:', error);
    }
  }, [trip, lookup, triggerPopup]);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
    triggerPopup('back');
    try {
      // Skip if not disliked
      if (!lookup.dislikedIds.has(listingId)) return;

      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
      }));

      const result = await optimisticRemoveDislikeDb(trip.id, listingId);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          dislikedIds: new Set([...prev.dislikedIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Failed to remove dislike:', error);
    }
  }, [trip, lookup, triggerPopup]);

  const optimisticApply = useCallback(async (listing: ListingAndImages) => {
    try {
      if (lookup.requestedIds.has(listing.id)) return;

      // Optimistically update the UI
      setLookup(prev => ({
        ...prev,
        requestedIds: new Set([...prev.requestedIds, listing.id])
      }));

      const result = await optimisticApplyDb(trip.id, listing);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          requestedIds: new Set([...prev.requestedIds].filter(id => id !== listing.id))
        }));
      }
    } catch (error) {
      console.error('Failed to apply:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        requestedIds: new Set([...prev.requestedIds].filter(id => id !== listing.id))
      }));
    }
  }, [trip, lookup]);

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback(async (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setTrip(prevTrip => ({ ...prevTrip, searchRadius: newFilters.searchRadius }));
    const dbFilters = {
      maxPrice: newFilters.maxPrice,
      minPrice: newFilters.minPrice,
      minBedrooms: newFilters.minBedrooms,
      minBathrooms: newFilters.minBathrooms,
      searchRadius: newFilters.searchRadius,
    };

    // Initialize all boolean filters to false first
    const boolFilters = getBooleanFilters();
    boolFilters.forEach(filter => {
      dbFilters[filter.name] = !!newFilters[filter.name];
    });

    // Then set true for the ones that are selected in any array
    for (const [key, value] of Object.entries(newFilters)) {
      if (Array.isArray(value)) {
        // For each selected value in the array
        value.forEach(selectedValue => {
          // Find the matching filter and set it to true
          const matchingFilter = boolFilters.find(filter => filter.name === selectedValue);
          if (matchingFilter) {
            dbFilters[matchingFilter.name] = true;
          }
        });
      }
    }

    await updateTripFilters(trip.id, dbFilters);
  }, []);

  const contextValue: TripContextType = {
    state: {
      trip,
      listings,
      showListings,
      likedListings,
      dislikedListings,
      requestedListings,
      viewedListings,
      isLoading,
      lookup,
      hasApplication,
      application,
      matchedListings,
      filters,
    },
    actions: {
      setViewedListings,
      setTrip,
      setLookup,
      setHasApplication,
      optimisticLike,
      optimisticDislike,
      optimisticRemoveLike,
      optimisticRemoveDislike,
      optimisticApply,
      optimisticRemoveApply,
      updateFilter,
      updateFilters,
    }
  };

  return (
    <TripContext.Provider value={contextValue}>
      <ActionPopup
        action={currentAction}
        isVisible={showActionPopup}
      />
      {children}
    </TripContext.Provider>
  );
};
