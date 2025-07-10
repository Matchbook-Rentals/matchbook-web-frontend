'use client';
//Imports
import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { subDays, addDays, differenceInDays, isValid } from 'date-fns';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { optimisticDislikeDb, optimisticRemoveDislikeDb } from '@/app/actions/dislikes';
import { optimisticApplyDb, optimisticRemoveApplyDb } from '@/app/actions/housing-requests';
import { updateTripFilters } from '@/app/actions/trips';
import { CategoryType, getBooleanFilters, getFiltersByCategory } from '@/constants/filters';
import { useActionPopup } from '@/hooks/use-action-popup'
import ActionPopup from '@/app/app/old-search/(components)/action-popup'
import { logger } from '@/lib/logger';
import TripStateContext, { TripState } from './trip-state-context';
import TripActionsContext, { TripActions } from './trip-actions-context';

// Re-export the original TripContext for backward compatibility
import { TripContext, useTripContext } from './trip-context-provider';
export { TripContext, useTripContext };

export interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

export interface FilterOptions {
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
  basics: string[]; 
  luxury: string[];
  laundry: string[];
}

export interface ListingWithAvailability extends ListingAndImages {
  availableStart?: Date;
  availableEnd?: Date;
  isActuallyAvailable?: boolean;
}

interface TripContextProviderProps {
  children: ReactNode;
  tripData: TripAndMatches;
  listingData: ListingAndImages[];
  hasApplicationData?: boolean;
  application?: ApplicationWithArrays | null;
}

export const TripContextProviderNew: React.FC<TripContextProviderProps> = ({ 
  children, 
  listingData, 
  tripData, 
  application, 
  hasApplicationData 
}) => {
  const [listings, setListings] = useState(listingData);
  const [trip, setTrip] = useState(tripData);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(hasApplicationData);
  const [lookup, setLookup] = useState<TripState['lookup']>({
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
    basics: [
      ...getFiltersByCategory(CategoryType.CLIMATE_CONTROL)
        .filter(amen => tripData[amen.name])
        .map(amen => amen.name),
      ...(tripData.wifi ? ['wifi'] : []),
      ...(tripData.dedicatedWorkspace ? ['dedicatedWorkspace'] : [])
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

  // Available listings based on filters and availability
  const showListings = React.useMemo((): ListingWithAvailability[] => {
    // --- Calculate Core Dates, Duration, and Flexible Window ---
    const coreStartDate = trip?.startDate ? new Date(trip.startDate) : null;
    const coreEndDate = trip?.endDate ? new Date(trip.endDate) : null;
    let stayDurationDays = 0;
    let earliestValidStart: Date | null = null;
    let latestValidEnd: Date | null = null;

    if (coreStartDate && coreEndDate && isValid(coreStartDate) && isValid(coreEndDate) && coreEndDate >= coreStartDate) {
      // Calculate duration (add 1 for inclusive days)
      stayDurationDays = differenceInDays(coreEndDate, coreStartDate) + 1;
      earliestValidStart = subDays(coreStartDate, trip.flexibleStart || 0);
      latestValidEnd = addDays(coreEndDate, trip.flexibleEnd || 0);
    }
    // --- End Date Calculations ---

    // 1. Map listings to calculate availability and specific dates
    const processedListings = listings.map((listing): ListingWithAvailability => {
      let isActuallyAvailable = false;
      let availableStart: Date | undefined = undefined;
      let availableEnd: Date | undefined = undefined;

      // Initial check: Are core dates valid for calculation?
      if (coreStartDate && coreEndDate && earliestValidStart && latestValidEnd && stayDurationDays > 0) {

        // --- Perform the isAvailable check (determines if *any* placement is possible) ---
        isActuallyAvailable = !listing.unavailablePeriods?.some(period => {
          const periodStart = new Date(period.startDate);
          const periodEnd = new Date(period.endDate);
          if (!isValid(periodStart) || !isValid(periodEnd)) return false;
          const latestStartBeforePeriod = subDays(periodStart, stayDurationDays);
          const earliestStartAfterPeriod = addDays(periodEnd, 1);
          const endDateIfStartingAfter = addDays(earliestStartAfterPeriod, stayDurationDays - 1);
          const blockedBefore = latestStartBeforePeriod < earliestValidStart;
          const blockedAfter = endDateIfStartingAfter > latestValidEnd;
          return blockedBefore && blockedAfter;
        });
        // --- End isAvailable check ---

        // --- If available, find the earliest start and latest end ---
        if (isActuallyAvailable) {
          // Find Earliest Valid Start
          let currentCheckStart = earliestValidStart;
          // Calculate the latest possible date the stay could START and still fit
          const latestPossibleStartDate = subDays(latestValidEnd, stayDurationDays - 1);

          while (currentCheckStart <= latestPossibleStartDate) { // Check all potential start dates within the flexible window
            const currentCheckEnd = addDays(currentCheckStart, stayDurationDays - 1);

            // Check if the *entire interval* [currentCheckStart, currentCheckEnd] overlaps with *any* unavailability period
            const overlaps = listing.unavailablePeriods?.some(p => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);
              // Check if [currentCheckStart, currentCheckEnd] overlaps with [pStart, pEnd]
              return isValid(pStart) && isValid(pEnd) && currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
            });

            if (!overlaps) {
              // If NO overlap is found for this entire interval, this is the earliest valid start date.
              availableStart = currentCheckStart;
              break; // Found the earliest, exit the loop.
            }

            // If there WAS an overlap, we need to find the end of the blocking period
            // to determine the *next* potential start date to check.
            const blockingPeriod = listing.unavailablePeriods?.find(p => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);
              // Find the specific period that caused the overlap for this interval
              return isValid(pStart) && isValid(pEnd) && currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
            });

            // Jump the next check to the day *after* the blocking period ends.
            // This is the earliest the stay could possibly start now.
            currentCheckStart = blockingPeriod ? addDays(new Date(blockingPeriod.endDate), 1) : addDays(currentCheckStart, 1); // Fallback: increment day-by-day if find fails (should be rare)
          }

          // Find Latest Valid End
          let currentCheckEnd = latestValidEnd;
          while (currentCheckEnd >= coreEndDate) { // Optimization: Check only down to core end
            const currentCheckStart = subDays(currentCheckEnd, stayDurationDays - 1);
            if (currentCheckStart < earliestValidStart) break; // Exceeds flexible start window

            const overlaps = listing.unavailablePeriods?.some(p => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);
              // Check if [currentCheckStart, currentCheckEnd] overlaps with [pStart, pEnd]
              return isValid(pStart) && isValid(pEnd) && currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
            });

            if (!overlaps) {
              availableEnd = currentCheckEnd; // Found the latest
              break;
            }

            // If overlap, find the start of the blocking period to jump back
             const blockingPeriod = listing.unavailablePeriods?.find(p => {
               const pStart = new Date(p.startDate);
               const pEnd = new Date(p.endDate);
               return isValid(pStart) && isValid(pEnd) && currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
            });
            currentCheckEnd = blockingPeriod ? subDays(new Date(blockingPeriod.startDate), 1) : subDays(currentCheckEnd, 1); // Jump or decrement
          }
        }
        // --- End earliest/latest calculation ---
      } // End check for valid core dates

      return {
        ...listing,
        isActuallyAvailable, // Store the result of the availability check
        availableStart,
        availableEnd
      };
    }); // End listings.map

    // 2. Filter the processed listings based on availability and other criteria
    return processedListings.filter(listing => {
      // Check if the listing is not favorited, disliked, or requested
      const isNotFavorited = !lookup.favIds.has(listing.id);
      const isNotDisliked = !lookup.dislikedIds.has(listing.id);
      const isNotRequested = !lookup.requestedIds.has(listing.id);

      // --- Keep all other filters the same ---
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
        (filters.utilities.includes('utilitiesIncluded') && listing.utilitiesIncluded) ||
        (filters.utilities.includes('utilitiesNotIncluded') && !listing.utilitiesIncluded);

      // Pets filter
      const matchesPets =
        filters.pets.length === 0 || filters.pets.length === 2 ||
        (filters.pets.includes('petsAllowed') && listing.petsAllowed) ||
        (filters.pets.includes('petsNotAllowed') && !listing.petsAllowed);

      // Amenity filters
      const matchesAccessibility = filters.accessibility?.length === 0 ||
        filters.accessibility?.every(amenity => listing[amenity]);

      const matchesLocation = filters.location?.length === 0 ||
        filters.location?.every(feature => listing[feature]);

      const matchesParking = filters.parking?.length === 0 ||
        filters.parking?.every(option => listing[option]);

      const matchesKitchen = filters.kitchen?.length === 0 ||
        filters.kitchen?.every(appliance => listing[appliance]);

      // Updated to check 'basics' array
      const matchesBasics = filters.basics?.length === 0 ||
        filters.basics?.every(basic => listing[basic]);

      const matchesLuxury = filters.luxury?.length === 0 ||
        filters.luxury?.every(amenity => listing[amenity]);

      // For laundry, we check for (inComplex, inUnit, notAvailable)
      const matchesLaundry = filters.laundry?.length === 0 || filters.laundry?.length === 3 ||
        filters.laundry?.some(option => listing[option]);

      // Determine availability based on successful calculation of start/end dates
      const isAvailable = listing.isActuallyAvailable;

      // Return true if the listing meets all criteria
      return isNotFavorited &&
        isNotDisliked &&
        isNotRequested &&
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
        matchesBasics &&
        matchesLuxury &&
        matchesLaundry &&
        isAvailable;
    });
  }, [listings, lookup, trip, filters]);

  // Memoized filtered lists
  const likedListings = React.useMemo(() =>
    listings
      .filter(listing => lookup.favIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.favIds, getRank]
  );

  const dislikedListings = React.useMemo(() =>
    listings
      .filter(listing => lookup.dislikedIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.dislikedIds, getRank]
  );

  const requestedListings = React.useMemo(() =>
    listings
      .filter(listing => lookup.requestedIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.requestedIds, getRank]
  );

  const matchedListings = React.useMemo(() =>
    listings
      .filter(listing => lookup.matchIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
    [listings, lookup.matchIds, getRank]
  );

  // ACTION METHODS - All wrapped in useCallback to maintain stable references
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
      logger.error('Failed to remove like', error);
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
      logger.error('Failed to like listing', error);
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
      logger.error('Failed to dislike listing', error);
    }
  }, [trip, lookup, triggerPopup]);

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
      logger.error('Failed to remove dislike', error);
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
      logger.error('Failed to apply', error);
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

    // Initialize all boolean filters defined in constants/filters.ts to false
    const allBooleanFilterNames = getBooleanFilters().map(f => f.name);
    allBooleanFilterNames.forEach(name => {
      dbFilters[name] = false;
    });

    // Set true for filters selected in the newFilters object
    // Handle array filters (propertyTypes, utilities, pets, accessibility, location, parking, kitchen, basics, luxury, laundry)
    Object.keys(newFilters).forEach(key => {
      const filterValue = newFilters[key as keyof FilterOptions];
      if (Array.isArray(filterValue)) {
        filterValue.forEach(selectedValue => {
          // Ensure the selectedValue corresponds to a known boolean filter
          if (allBooleanFilterNames.includes(selectedValue)) {
            dbFilters[selectedValue] = true;
          }
        });
      } else if (typeof filterValue === 'boolean' && allBooleanFilterNames.includes(key)) {
        // Handle direct boolean filters like furnished, unfurnished
        // Note: utilitiesIncluded, petsAllowed etc. are handled via their arrays now
        dbFilters[key] = filterValue;
      }
    });

    // Special handling for filters that might not be directly in arrays but are boolean
    // Example: furnished/unfurnished are handled directly
    dbFilters.furnished = newFilters.furnished;
    dbFilters.unfurnished = newFilters.unfurnished;

    console.log("Updating trip filters with:", dbFilters); // Debug log
    await updateTripFilters(trip.id, dbFilters);
  }, [trip.id]);

  // Create stable state object
  const state: TripState = {
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
  };

  // Create stable actions object
  const actions: TripActions = {
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
  };

  // Return the nested providers for separation of concerns
  return (
    <TripActionsContext.Provider value={actions}>
      <TripStateContext.Provider value={state}>
        <ActionPopup
          action={currentAction}
          isVisible={showActionPopup}
        />
        {children}
      </TripStateContext.Provider>
    </TripActionsContext.Provider>
  );
};

export default TripContextProviderNew;