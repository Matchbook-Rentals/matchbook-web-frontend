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
    setCurrentSearch: React.Dispatch<React.SetStateAction<TripAndMatches | null>>;
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    fetchListings: () => Promise<void>;
    setLookup: React.Dispatch<React.SetStateAction<SearchContextType['state']['lookup']>>;
  };
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
};

interface SearchContextProviderProps {
  children: ReactNode;
  activeSearches: TripAndMatches[];
}

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

  const updateLookup = useCallback(() => {
    if (currentSearch) {
      setLookup({
        favIds: new Set(currentSearch.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
        dislikedIds: new Set(currentSearch.dislikes.map(dislike => dislike.listingId)),
        requestedIds: new Set(currentSearch.housingRequests.map(request => request.listingId))
      });
    }
  }, [currentSearch]);

  useEffect(() => {
    updateLookup();
  }, [currentSearch, updateLookup]);

  const showListings = useMemo(() => listings.filter((listing) => !lookup.favIds.has(listing.id)), [listings, lookup.favIds]);

  const likedListings = useMemo(() => {
    return listings
      .filter((listing) => !lookup.requestedIds.has(listing.id))
      .filter((listing) => lookup.favIds.has(listing.id))
  }, [lookup.favIds, lookup.requestedIds, listings]);

  const dislikedListings = useMemo(() => {
    return listings
      .filter((listing) => lookup.dislikedIds.has(listing.id))
  }, [lookup.dislikedIds, listings]);

  const requestedListings = useMemo(() => {
    return listings
      .filter((listing) => lookup.requestedIds.has(listing.id))
  }, [lookup.requestedIds, listings]);

  const fetchListings = async () => {
    if (currentSearch) {
      setIsLoading(true);
      try {
        const results = await pullListingsFromDb(currentSearch.latitude, currentSearch.longitude, 100);
        setListings(results);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchListings();
  }, [currentSearch]);

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
      setCurrentSearch,
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