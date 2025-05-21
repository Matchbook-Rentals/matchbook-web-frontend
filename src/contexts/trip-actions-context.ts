'use client';

import { createContext } from 'react';
import { ListingAndImages } from '@/types';
import { FilterOptions } from './trip-context-provider';

/**
 * TripActionsContext contains only the action methods for modifying trip state.
 * The methods are wrapped in useCallback to ensure stable references, so components
 * consuming only actions won't re-render when the trip state changes.
 */
export interface TripActions {
  setViewedListings: React.Dispatch<React.SetStateAction<{
    listing: ListingAndImages;
    action: 'favorite' | 'dislike';
    actionId: string;
  }[]>>;
  setTrip: React.Dispatch<React.SetStateAction<any>>;
  setLookup: React.Dispatch<React.SetStateAction<{
    favIds: Set<string>;
    dislikedIds: Set<string>;
    requestedIds: Set<string>;
    matchIds: Set<string>;
  }>>;
  setHasApplication: React.Dispatch<React.SetStateAction<boolean>>;
  optimisticLike: (listingId: string, withPopup?: boolean) => Promise<void>;
  optimisticDislike: (listingId: string) => Promise<void>;
  optimisticRemoveLike: (listingId: string, withPopup?: boolean) => Promise<void>;
  optimisticRemoveDislike: (listingId: string) => Promise<void>;
  optimisticApply: (listing: ListingAndImages) => Promise<void>;
  optimisticRemoveApply: (listingId: string) => Promise<void>;
  updateFilter: (key: keyof FilterOptions, value: any) => void;
  updateFilters: (newFilters: FilterOptions) => void;
}

const TripActionsContext = createContext<TripActions | undefined>(undefined);

export default TripActionsContext;