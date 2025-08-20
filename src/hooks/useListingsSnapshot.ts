'use client';

import { useCallback } from 'react';
import { ListingAndImages } from '@/types';
import { useTripContext } from '@/contexts/trip-context-provider';

interface UseListingsSnapshotResult {
  listings: ListingAndImages[];
  favoriteIds: Set<string>;
  dislikedIds: Set<string>;
  requestedIds: Set<string>;
  matchIds: Set<string>;
  optimisticLike: (listingId: string) => Promise<void>;
  optimisticDislike: (listingId: string) => Promise<void>;
  optimisticRemoveLike: (listingId: string) => Promise<void>;
  optimisticRemoveDislike: (listingId: string) => Promise<void>;
  isLiked: (listingId: string) => boolean;
  isDisliked: (listingId: string) => boolean;
  isRequested: (listingId: string) => boolean;
}

/**
 * Gets listings data and provides methods to interact with them.
 * 
 * This hook directly uses the trip context as the single source of truth
 * for likes/dislikes/requests, eliminating state synchronization issues.
 */
export function useListingsSnapshot(): UseListingsSnapshotResult {
  // Get the trip context
  const { state, actions } = useTripContext();

  // Get actions from context
  const { 
    optimisticLike, 
    optimisticDislike,
    optimisticRemoveLike,
    optimisticRemoveDislike
  } = actions;

  // Helper functions to check listing states using context data directly
  const isLiked = useCallback((listingId: string) => state.lookup.favIds.has(listingId), [state.lookup.favIds]);
  const isDisliked = useCallback((listingId: string) => state.lookup.dislikedIds.has(listingId), [state.lookup.dislikedIds]);
  const isRequested = useCallback((listingId: string) => state.lookup.requestedIds.has(listingId), [state.lookup.requestedIds]);

  return {
    listings: state.listings,
    favoriteIds: state.lookup.favIds,
    dislikedIds: state.lookup.dislikedIds,
    requestedIds: state.lookup.requestedIds,
    matchIds: state.lookup.matchIds,
    optimisticLike,
    optimisticDislike,
    optimisticRemoveLike,
    optimisticRemoveDislike,
    isLiked,
    isDisliked,
    isRequested
  };
}