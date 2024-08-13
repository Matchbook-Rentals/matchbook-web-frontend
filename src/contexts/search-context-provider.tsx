'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { pullListingsFromDb } from '@/app/actions/listings';

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

interface SearchContextType {
  state: {
    activeSearches: TripAndMatches[];
    currentSearch: TripAndMatches | null;
    listings: ListingAndImages[];
    showListings: ListingAndImages[];
    viewedListings: ViewedListing[];
    likedListings: ListingAndImages[];
    dislikedListings: ListingAndImages[];
    requestedListings: ListingAndImages[];
    isLoading: boolean;
    hasApplication: boolean;
    application: ApplicationWithArrays | null;
    lookup: {
      favIds: Set<string>;
      dislikedIds: Set<string>;
      requestedIds: Set<string>;
    };
  };
  actions: {
    setCurrentSearch: (search: TripAndMatches | null) => void;
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    fetchListings: (lat: number, lng: number, radius: number) => Promise<void>;
    setLookup: React.Dispatch<React.SetStateAction<SearchContextType['state']['lookup']>>;
    setHasApplication: React.Dispatch<React.SetStateAction<boolean>>;
  };
}

interface SearchContextProviderProps {
  children: ReactNode;
  activeSearches: TripAndMatches[];
  hasApplicationData: boolean;
  application: ApplicationWithArrays | null;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
};

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({ children, activeSearches, hasApplicationData, application }) => {
  const [currentSearch, setCurrentSearch] = useState<TripAndMatches | null>(null);
  const [listings, setListings] = useState<ListingAndImages[]>([]);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplication, setHasApplication] = useState(hasApplicationData);
  const [lookup, setLookup] = useState<SearchContextType['state']['lookup']>({
    favIds: new Set(),
    dislikedIds: new Set(),
    requestedIds: new Set()
  });
  const getListingPrice = (listing: ListingAndImages) => {
    const endDate = currentSearch?.endDate;
    const startDate = currentSearch?.startDate;
    if (!endDate || !startDate) return listing.shortestLeasePrice;

    const tripLengthInMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    const shortestLeaseLength = listing.shortestLeaseLength;
    const shortestLeasePrice = listing.shortestLeasePrice;
    const longestLeaseLength = listing.longestLeaseLength;
    const longestLeasePrice = listing.longestLeasePrice;

    // If the trip length is shorter than or equal to the shortest lease, return the shortest lease price
    if (tripLengthInMonths <= shortestLeaseLength) return shortestLeasePrice;

    // If the trip length is longer than or equal to the longest lease, return the longest lease price
    if (tripLengthInMonths >= longestLeaseLength) return longestLeasePrice;

    // Calculate the price difference and lease length difference
    const priceDifference = longestLeasePrice - shortestLeasePrice;
    const leaseLengthDifference = longestLeaseLength - shortestLeaseLength;

    // Calculate the price change per month (can be positive or negative)
    const priceChangePerMonth = priceDifference / leaseLengthDifference;

    // Calculate the number of months beyond the shortest lease
    const monthsBeyondShortest = tripLengthInMonths - shortestLeaseLength;

    // Calculate the total price change
    const totalPriceChange = priceChangePerMonth * monthsBeyondShortest;

    // Calculate the final price
    const finalPrice = shortestLeasePrice + totalPriceChange;

    return Math.round(finalPrice);
  }

  const calculateUScore = (listing: ListingAndImages & { calculatedPrice: number }, lowestPrice: number, highestPrice: number, highestDistance: number, highestSquareFootage: number, highestRoomCount: number, highestBathroomCount: number) => {
    const priceScore = ((highestPrice - listing.calculatedPrice) / (highestPrice - lowestPrice)) * 10;
    const distanceScore = (1 - (listing.distance || 0) / highestDistance) * 9;
    const squareFootageScore = ((listing.squareFootage || 0) / highestSquareFootage) * 8;
    const roomCountScore = ((listing.roomCount || 0) / highestRoomCount) * 6;
    const bathroomCountScore = ((listing.bathroomCount || 0) / highestBathroomCount) * 7;
    return priceScore + distanceScore + squareFootageScore + roomCountScore + bathroomCountScore;
  }



  const sortListingsByUScore = (listings: ListingAndImages[]) => {
    // Pre-calculate prices for all listings
    const listingsWithPrices = listings.map(listing => ({
      ...listing,
      calculatedPrice: getListingPrice(listing)
    }));

    let lowestPrice = Infinity;
    let highestPrice = 0;
    let highestDistance = 0;
    let highestSquareFootage = 0;
    let highestRoomCount = 0;
    let highestBathroomCount = 0;

    listingsWithPrices.forEach(listing => {
      if (listing.calculatedPrice < lowestPrice) {
        lowestPrice = listing.calculatedPrice;
        console.log('lowestPrice', lowestPrice);
      }
      if (listing.calculatedPrice > highestPrice) {
        highestPrice = listing.calculatedPrice;
        console.log('highestPrice', highestPrice);
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
    console.log(' final lowestPrice', lowestPrice);
    console.log(' final highestPrice', highestPrice);

    const updatedListings = listingsWithPrices.map(listing => {
      const uScore = calculateUScore(listing, lowestPrice, highestPrice, highestDistance, highestSquareFootage, highestRoomCount, highestBathroomCount);
      return { ...listing, price: listing.calculatedPrice, uScore };
    });

    return updatedListings.sort((a, b) => b.uScore - a.uScore);
  }

  const fetchListings = async (lat: number, lng: number, radius: number) => {
    setIsLoading(true);
    try {
      const results = await pullListingsFromDb(lat, lng, radius);
      if (results.length === 0) {
        console.log(currentSearch);
      }
      const sortedResults = sortListingsByUScore(results);

      setListings(sortedResults);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentSearch) {
      fetchListings(currentSearch.latitude, currentSearch.longitude, currentSearch.radius || 100);
    }
    setLookup({
      favIds: new Set(currentSearch?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
      dislikedIds: new Set(currentSearch?.dislikes.map(dislike => dislike.listingId)),
      requestedIds: new Set(currentSearch?.housingRequests.map(request => request.listingId))
    });
  }, [currentSearch]);


  const getRank = useCallback((listingId: string) => lookup.favIds.has(listingId) ? 0 : Infinity, [lookup.favIds]);

  const showListings = useMemo(() =>
    listings.filter(listing =>
      !lookup.favIds.has(listing.id) &&
      !lookup.dislikedIds.has(listing.id) &&
      !lookup.requestedIds.has(listing.id)
    ),
    [listings, lookup]
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

  const contextValue: SearchContextType = {
    state: {
      activeSearches,
      currentSearch,
      listings,
      showListings,
      likedListings,
      dislikedListings,
      requestedListings,
      viewedListings,
      isLoading,
      lookup,
      hasApplication,
      application
    },
    actions: {
      setCurrentSearch: (search: TripAndMatches | null) => {
        setCurrentSearch(search);
        setListings([]); // Clear listings when changing search
      },
      setViewedListings,
      fetchListings,
      setLookup,
      setHasApplication,
    }
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};