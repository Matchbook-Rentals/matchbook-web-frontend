'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect } from 'react';
import { ListingAndImages, TripAndMatches } from '@/types';
import { pullListingsFromDb } from '@/app/actions/listings';

interface SearchContextType {
  state: {
    activeSearches: TripAndMatches[];
    currentSearch: TripAndMatches | null;
    listings: ListingAndImages[];
    showListings: ListingAndImages[];
    viewedListings: ListingAndImages[];
    likedListings: ListingAndImages[];
    dislikedListings: ListingAndImages[];
    requestedListings: ListingAndImages[];
  };
  actions: {
    setCurrentSearch: React.Dispatch<React.SetStateAction<TripAndMatches | null>>;
    setViewedListings: React.Dispatch<React.SetStateAction<ListingAndImages[]>>;
  };
  lookup: {
    favIds: Set<string>;
    dislikedIds: Set<string>;
    requestedIds: Set<string>;
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
  const [viewedListings, setViewedListings] = useState<ListingAndImages[]>([]);

  const lookup = useMemo(() => ({
    favIds: new Set(currentSearch?.favorites.map(favorite => favorite.listingId).filter((id): id is string => id !== null)),
    dislikedIds: new Set(currentSearch?.dislikes.map(dislike => dislike.listingId)),
    requestedIds: new Set(currentSearch?.housingRequests.map(request => request.listingId))
  }), [currentSearch]);


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

  useEffect(() => {
    const updateListings = async () => {
      if (currentSearch) {
        const results = await pullListingsFromDb(currentSearch.latitude, currentSearch.longitude, 100);
        setListings(results);
      }
    };

    updateListings();
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
      viewedListings
    },
    actions: {
      setCurrentSearch,
      setViewedListings
    },
    lookup
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};