'use client';
//Imports
import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { subDays, addDays, differenceInDays, isValid } from 'date-fns'; // <-- Import date functions
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { optimisticDislikeDb, optimisticRemoveDislikeDb } from '@/app/actions/dislikes';
import { optimisticApplyDb, optimisticRemoveApplyDb } from '@/app/actions/housing-requests';
import { updateTripFilters } from '@/app/actions/trips';
import { CategoryType, getBooleanFilters } from '@/constants/filters';
import { FilterOptions, initializeFiltersFromTrip, convertFiltersToDbFormat } from '@/lib/listing-filters';
import { useFilteredListings } from '@/hooks/useFilteredListings';
import { logger } from '@/lib/logger';

interface ListingWithAvailability extends ListingAndImages {
  availableStart?: Date;
  availableEnd?: Date;
  isActuallyAvailable?: boolean; // Helper flag from calculation
}

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

// FilterOptions now imported from lib/listing-filters.ts

interface TripContextType {
  state: {
    trip: TripAndMatches;
    listings: ListingAndImages[];
    showListings: ListingWithAvailability[]; // <-- Update this type
    viewedListings: ViewedListing[];
    likedListings: ListingAndImages[]; // Keep these as base type for now, or update if needed
    dislikedListings: ListingAndImages[];
    requestedListings: ListingAndImages[];
    matchedListings: ListingAndImages[];
    isLoading: boolean;
    application: ApplicationWithArrays | null;
    lookup: {
      favIds: Set<string>;
      dislikedIds: Set<string>;
      requestedIds: Set<string>;
      matchIds: Set<string>;
    };
    filters: FilterOptions;
    filteredCount: number;
  };
  actions: {
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    setTrip: React.Dispatch<React.SetStateAction<TripAndMatches[]>>;
    setLookup: React.Dispatch<React.SetStateAction<TripContextType['state']['lookup']>>;
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

export const TripContextProvider: React.FC<TripContextProviderProps> = ({ children, listingData, tripData, application }) => {
  const [listings, setListings] = useState(listingData);
  const [trip, setTrip] = useState(tripData);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lookup, setLookup] = useState<TripContextType['state']['lookup']>({
    favIds: new Set(),
    dislikedIds: new Set(),
    requestedIds: new Set(),
    matchIds: new Set()
  });
  
  // Track operations in progress to prevent duplicates
  const [processingOperations, setProcessingOperations] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>(
    initializeFiltersFromTrip(tripData)
  );


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

  // Use the centralized filtering hook
  const filteredResults = useFilteredListings({
    listings,
    filters,
    trip,
    lookup
  });

  useEffect(() => {
    setLookup({
      favIds: new Set(trip?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
      dislikedIds: new Set(trip?.dislikes.map(dislike => dislike.listingId)),
      requestedIds: new Set(trip?.housingRequests.map(request => request.listingId)),
      matchIds: new Set(trip?.matches.map(match => match.listingId))
    });
  }, [trip]);

  const getRank = useCallback((listingId: string) => lookup.favIds.has(listingId) ? 0 : Infinity, [lookup.favIds]);

  // Extract filtered results from the hook
  const {
    showListings,
    likedListings: hookLikedListings,
    dislikedListings: hookDislikedListings,
    requestedListings: hookRequestedListings,
    displayListings: hookDisplayListings,
    filteredCount
  } = filteredResults;

  // Use hook results for liked listings
  const likedListings = hookLikedListings;

  // Use hook results for other listing types
  const dislikedListings = hookDislikedListings;
  const requestedListings = hookRequestedListings;

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
  }, [trip, lookup, optimisticRemoveApply]);

  const optimisticLike = useCallback(async (listingId: string, withPopup = false) => {
    try {
      // Check if already liked or operation in progress
      if (lookup.favIds.has(listingId) || processingOperations.has(`like-${listingId}`)) {
        return;
      }

      // Mark operation as in progress
      setProcessingOperations(prev => new Set([...prev, `like-${listingId}`]));

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
      // Rollback optimistic update on error
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds].filter(id => id !== listingId))
      }));
    } finally {
      // Always remove operation from processing set
      setProcessingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(`like-${listingId}`);
        return newSet;
      });
    }
  }, [trip, lookup, processingOperations]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    try {
      // Check if already disliked or operation in progress
      if (lookup.dislikedIds.has(listingId) || processingOperations.has(`dislike-${listingId}`)) {
        return;
      }

      // Mark operation as in progress
      setProcessingOperations(prev => new Set([...prev, `dislike-${listingId}`]));

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
      // Rollback optimistic update on error
      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
      }));
    } finally {
      // Always remove operation from processing set
      setProcessingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(`dislike-${listingId}`);
        return newSet;
      });
    }
  }, [trip, lookup, processingOperations]);

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

      // Prevent users from applying to their own listings
      if (trip?.userId && listing.userId === trip.userId) {
        logger.error('Cannot apply to own listing');
        return;
      }

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

    // Use the new utility to convert filters to database format
    const allBooleanFilterNames = getBooleanFilters().map(f => f.name);
    const dbFilters = convertFiltersToDbFormat(newFilters, allBooleanFilterNames);

    console.log("Updating trip filters with:", dbFilters); // Debug log
    await updateTripFilters(trip.id, dbFilters);
  }, [trip.id]);

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
      application,
      matchedListings,
      filters,
      filteredCount,
    },
    actions: {
      setViewedListings,
      setTrip,
      setLookup,
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
      {children}
    </TripContext.Provider>
  );
};
