'use client';

import { createContext } from 'react';
import { ListingAndImages, TripAndMatches, ApplicationWithArrays } from '@/types';
import { FilterOptions } from './trip-context-provider';

/**
 * TripStateContext contains only the immutable state object for the trip.
 * Components should subscribe to this context only if they need to re-render
 * when trip state changes.
 */
export interface TripState {
  trip: TripAndMatches;
  listings: ListingAndImages[];
  showListings: ListingAndImages[]; 
  viewedListings: {
    listing: ListingAndImages;
    action: 'favorite' | 'dislike';
    actionId: string;
  }[];
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
}

const TripStateContext = createContext<TripState | undefined>(undefined);

export default TripStateContext;