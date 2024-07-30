'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages, TripAndMatches } from '@/types';
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
  };
}

interface SearchContextProviderProps {
  children: ReactNode;
  activeSearches: TripAndMatches[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
};

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({ children, activeSearches }) => {
  const [currentSearch, setCurrentSearch] = useState<TripAndMatches | null>(null);
  const [listings, setListings] = useState<ListingAndImages[]>([]);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lookup, setLookup] = useState<SearchContextType['state']['lookup']>({
    favIds: new Set(),
    dislikedIds: new Set(),
    requestedIds: new Set()
  });


  const fetchListings = async (lat: number, lng: number, radius: number) => {
    setIsLoading(true);
    try {
      const results = await pullListingsFromDb(lat, lng, radius);
      setListings(results);
      setLookup({
        favIds: new Set(currentSearch?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
        dislikedIds: new Set(currentSearch?.dislikes.map(dislike => dislike.listingId)),
        requestedIds: new Set(currentSearch?.housingRequests.map(request => request.listingId))
      });
    } finally {
      setIsLoading(false);
    }
  };


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
      lookup
    },
    actions: {
      setCurrentSearch: (search: TripAndMatches | null) => {
        setCurrentSearch(search);
        setListings([]); // Clear listings when changing search
      },
      setViewedListings,
      fetchListings,
      setLookup
    }
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};