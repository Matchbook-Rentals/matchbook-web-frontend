'use client';
//Imports
import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { optimisticDislikeDb, optimisticRemoveDislikeDb } from '@/app/actions/dislikes';
import { optimisticApplyDb, optimisticRemoveApplyDb } from '@/app/actions/housing-requests';
import { optimisticMaybe as optimisticMaybeDb, optimisticRemoveMaybe as optimisticRemoveMaybeDb } from '@/app/actions/maybes';

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

interface FilterOptions {
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: string;
  beds: string;
  baths: string;
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
      maybeIds: Set<string>;
    };
    maybedListings: ListingAndImages[];
    filters: FilterOptions;
  };
  actions: {
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    setTrip: React.Dispatch<React.SetStateAction<TripAndMatches[]>>;
    setLookup: React.Dispatch<React.SetStateAction<TripContextType['state']['lookup']>>;
    setHasApplication: React.Dispatch<React.SetStateAction<boolean>>;
    optimisticLike: (listingId: string) => Promise<void>;
    optimisticDislike: (listingId: string) => Promise<void>;
    optimisticRemoveLike: (listingId: string) => Promise<void>;
    optimisticRemoveDislike: (listingId: string) => Promise<void>;
    optimisticApply: (listing: ListingAndImages) => Promise<void>;
    optimisticRemoveApply: (listingId: string) => Promise<void>;
    optimisticMaybe: (listingId: string) => Promise<void>;
    optimisticRemoveMaybe: (listingId: string) => Promise<void>;
    updateFilter: (key: keyof FilterOptions, value: any) => void;
    updateFilters: (newFilters: FilterOptions) => void;
  };
}

interface TripContextProviderProps {
  children: ReactNode;
  tripData: TripAndMatches
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
    matchIds: new Set(),
    maybeIds: new Set()
  });
  const [filters, setFilters] = useState<FilterOptions>({
    propertyTypes: [],
    minPrice: null,
    maxPrice: null,
    bedrooms: '',
    beds: '',
    baths: '',
    furnished: false,
    unfurnished: false,
    utilities: [] as ('included' | 'notIncluded')[],
    pets: [],
    searchRadius: 0,
    accessibility: [],
    location: [],
    parking: [],
    kitchen: [],
    climateControl: [],
    luxury: [],
    laundry: [],
  });

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
  }

  useEffect(() => {
    const sortedListings = sortListingsByUScore(listingData);
    setListings(sortedListings);
  }, [])

  useEffect(() => {
    setLookup({
      favIds: new Set(trip?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
      dislikedIds: new Set(trip?.dislikes.map(dislike => dislike.listingId)),
      requestedIds: new Set(trip?.housingRequests.map(request => request.listingId)),
      matchIds: new Set(trip?.matches.map(match => match.listingId)),
      maybeIds: new Set(trip?.maybes.map(maybe => maybe.listingId))
    });
  }, [trip]);

  const getRank = useCallback((listingId: string) => lookup.favIds.has(listingId) ? 0 : Infinity, [lookup.favIds]);

  // This code filters and memoizes the listings to be shown
  const showListings = useMemo(() =>
    listings.filter(listing => {
      //Check if the listing is not favorited, disliked, requested, or maybed
      const isNotFavorited = !lookup.favIds.has(listing.id);
      const isNotDisliked = !lookup.dislikedIds.has(listing.id);
      const isNotRequested = !lookup.requestedIds.has(listing.id);
      const isNotMaybed = !lookup.maybeIds.has(listing.id);

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

      // Room filters
      const matchesBedrooms = !filters.bedrooms || listing.bedrooms === filters.bedrooms;
      const matchesBeds = !filters.beds || listing.beds === filters.beds;
      const matchesBaths = !filters.baths || listing.baths === filters.baths;

      // Furniture filter
      const matchesFurniture =
        (!filters.furnished && !filters.unfurnished) ||
        (filters.furnished && listing.furnished) ||
        (filters.unfurnished && !listing.furnished);

      // Utilities filter
      const matchesUtilities =
        filters.utilities.length === 0 || filters.utilities.length === 2 ||
        (filters.utilities.includes('included') && listing.utilitiesIncluded === true) ||
        (filters.utilities.includes('notIncluded') && listing.utilitiesIncluded === false);

      // Amenity filters
      const matchesAccessibility = filters.accessibility?.length === 0 ||
        filters.accessibility?.every(amenity => listing.amenities?.includes(amenity));

      const matchesLocation = filters.location?.length === 0 ||
        filters.location?.every(feature => listing.amenities?.includes(feature));

      const matchesParking = filters.parking?.length === 0 ||
        filters.parking?.every(option => listing.amenities?.includes(option));

      const matchesKitchen = filters.kitchen?.length === 0 ||
        filters.kitchen?.every(appliance => listing.amenities?.includes(appliance));

      const matchesClimateControl = filters.climateControl?.length === 0 ||
        filters.climateControl?.every(control => listing.amenities?.includes(control));

      const matchesLuxury = filters.luxury?.length === 0 ||
        filters.luxury?.every(amenity => listing.amenities?.includes(amenity));

      const matchesLaundry = filters.laundry?.length === 0 ||
        filters.laundry?.every(option => listing.amenities?.includes(option));

      // Return true if the listing meets all criteria
      return isNotFavorited &&
        isNotDisliked &&
        isNotRequested &&
        isNotMaybed &&
        isAvailable &&
        matchesPropertyType &&
        matchesPrice &&
        matchesBedrooms &&
        matchesBeds &&
        matchesBaths &&
        matchesFurniture &&
        matchesUtilities &&
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
      //.filter(listing => !lookup.requestedIds.has(listing.id))
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

  const maybedListings = useMemo(() =>
    listings
      .filter(listing => lookup.maybeIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.maybeIds, getRank]
  );

  const optimisticRemoveApply = useCallback(async (listingId: string) => {
    console.log(listingId)
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

  const optimisticRemoveLike = useCallback(async (listingId: string) => {
    try {
      // Skip if not liked
      if (!lookup.favIds.has(listingId)) return;

      let isRequested = lookup.requestedIds.has(listingId);

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
  }, [trip, lookup, optimisticRemoveApply]);

  const optimisticLike = useCallback(async (listingId: string) => {
    try {
      if (lookup.favIds.has(listingId)) {
        return { success: true };
      }

      // Store initial states
      const wasDisliked = lookup.dislikedIds.has(listingId);
      const wasMaybed = lookup.maybeIds.has(listingId);

      // Optimistically update UI
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds, listingId]),
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId)),
        maybeIds: new Set([...prev.maybeIds].filter(id => id !== listingId))
      }));

      // Handle existing states
      if (wasDisliked) {
        await optimisticRemoveDislikeDb(trip.id, listingId);
      }
      if (wasMaybed) {
        await optimisticRemoveMaybeDb(trip.id, listingId);
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
          maybeIds: wasMaybed
            ? new Set([...prev.maybeIds, listingId])
            : prev.maybeIds
        }));
      }
    } catch (error) {
      console.error('Failed to like listing:', error);
    }
  }, [trip, lookup]);

  const optimisticDislike = useCallback(async (listingId: string) => {
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
  }, [trip, lookup]);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
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
  }, [trip, lookup]);

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
      // Rollback on erroir
      setLookup(prev => ({
        ...prev,
        requestedIds: new Set([...prev.requestedIds].filter(id => id !== listing.id))
      }));
    }
  }, [trip, lookup]);

  const optimisticMaybe = useCallback(async (listingId: string) => {
    try {
      if (lookup.maybeIds.has(listingId)) {
        return { success: true };
      }

      // Check if the listing is liked or disliked
      const wasLiked = lookup.favIds.has(listingId);
      const wasDisliked = lookup.dislikedIds.has(listingId);

      // Update UI immediately
      setLookup(prev => ({
        ...prev,
        maybeIds: new Set([...prev.maybeIds, listingId]),
        favIds: new Set([...prev.favIds].filter(id => id !== listingId)),
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
      }));

      // Then handle backend operations
      if (wasLiked) {
        await optimisticRemoveFavorite(trip.id, listingId);
      }
      if (wasDisliked) {
        await optimisticRemoveDislikeDb(trip.id, listingId);
      }

      const result = await optimisticMaybeDb(trip.id, listingId);

      if (!result.success) {
        // Rollback logic remains the same
        setLookup(prev => ({
          ...prev,
          maybeIds: new Set([...prev.maybeIds].filter(id => id !== listingId)),
          favIds: wasLiked
            ? new Set([...prev.favIds, listingId])
            : prev.favIds,
          dislikedIds: wasDisliked
            ? new Set([...prev.dislikedIds, listingId])
            : prev.dislikedIds
        }));
      }
    } catch (error) {
      // Error handling remains the same
      console.error('Failed to maybe listing:', error);
      setLookup(prev => ({
        ...prev,
        maybeIds: new Set([...prev.maybeIds].filter(id => id !== listingId)),
        favIds: wasLiked
          ? new Set([...prev.favIds, listingId])
          : prev.favIds,
        dislikedIds: wasDisliked
          ? new Set([...prev.dislikedIds, listingId])
          : prev.dislikedIds
      }));
    }
  }, [trip, lookup]);

  const optimisticRemoveMaybe = useCallback(async (listingId: string) => {
    try {
      // Skip if not maybed
      if (!lookup.maybeIds.has(listingId)) return;

      let isRequested = lookup.requestedIds.has(listingId);

      // If there's an application, remove it first
      if (isRequested) {
        await optimisticRemoveApply(listingId);
      }

      // Then remove from maybes
      setLookup(prev => ({
        ...prev,
        maybeIds: new Set([...prev.maybeIds].filter(id => id !== listingId))
      }));

      const result = await optimisticRemoveMaybeDb(trip.id, listingId);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          maybeIds: new Set([...prev.maybeIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Failed to remove maybe:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        maybeIds: new Set([...prev.maybeIds, listingId])
      }));
    }
  }, [trip, lookup, optimisticRemoveApply]);

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
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
      maybedListings,
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
      optimisticMaybe,
      optimisticRemoveMaybe,
      updateFilter,
      updateFilters,
    }
  };

  return (
    <TripContext.Provider value={contextValue}>
      {children}
    </TripContext.Provider>
  );
};
