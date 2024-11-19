'use client';
//Imports
import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { calculateRent } from '@/lib/calculate-rent';
import { optimisticFavorite } from '@/app/actions/favorites';
import { optimisticDislike } from '@/app/actions/dislikes';

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
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
      matchIds: Set<string>; // Add this line
    };
  };
  actions: {
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    setTrip: React.Dispatch<React.SetStateAction<TripAndMatches[]>>;
    setLookup: React.Dispatch<React.SetStateAction<TripContextType['state']['lookup']>>;
    setHasApplication: React.Dispatch<React.SetStateAction<boolean>>;
    optimisticLike: (listingId: string) => Promise<void>;
    optimisticDislike: (listingId: string) => Promise<void>;
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
    matchIds: new Set() // Add this line
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
      matchIds: new Set(trip?.matches.map(match => match.listingId)) // Add this line
    });
  }, [trip]);

  const getRank = useCallback((listingId: string) => lookup.favIds.has(listingId) ? 0 : Infinity, [lookup.favIds]);

  // This code filters and memoizes the listings to be shown
  const showListings = useMemo(() =>
    listings.filter(listing => {
      //Check if the listing is not favorited, disliked, or requested
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

      // Return true if the listing meets all criteria
      return isNotFavorited && isNotDisliked && isNotRequested && isAvailable;
    }),
    [listings, lookup, trip]
  );

  const likedListings = useMemo(() =>
    listings
      .filter(listing => !lookup.requestedIds.has(listing.id))
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

  const optimisticLike = useCallback(async (listingId: string) => {
    try {
      // Optimistically update UI
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds, listingId])
      }));

      // Perform backend operation
      const result = await optimisticFavorite(trip.id, listingId, trip);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => {
          const newFavIds = new Set(prev.favIds);
          newFavIds.delete(listingId);
          return { ...prev, favIds: newFavIds };
        });
      }
    } catch (error) {
      console.error('Failed to like listing:', error);
    }
  }, [trip]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    try {
      // Optimistically update UI
      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds, listingId])
      }));

      // Perform backend operation
      const result = await optimisticDislike(trip.id, listingId, trip);

      if (!result.success) {
        // Rollback on failure
        setLookup(prev => {
          const newDislikedIds = new Set(prev.dislikedIds);
          newDislikedIds.delete(listingId);
          return { ...prev, dislikedIds: newDislikedIds };
        });
      }
    } catch (error) {
      console.error('Failed to dislike listing:', error);
    }
  }, [trip]);

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
      matchedListings // Add this line
    },
    actions: {
      setViewedListings,
      setTrip,
      setLookup,
      setHasApplication,
      optimisticLike,
      optimisticDislike,
    }
  };

  return (
    <TripContext.Provider value={contextValue}>
      {children}
    </TripContext.Provider>
  );
};
