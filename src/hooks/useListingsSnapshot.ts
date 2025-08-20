'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ListingAndImages } from '@/types';
import { useTripContext } from '@/contexts/trip-context-provider';
// We'll use the main context instead of the snapshot hooks

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
 * Gets a snapshot of listings data and provides methods to interact with them
 * without causing re-renders to components like the map.
 * 
 * This hook maintains local state for likes/dislikes while still communicating
 * with the global trip context.
 */
export function useListingsSnapshot(): UseListingsSnapshotResult {
  // Get the trip context
  const { state, actions } = useTripContext();
  
  // Get initial data from trip context
  const initialListings = state.listings;
  const initialFavorites = state.lookup.favIds;
  const initialDislikes = state.lookup.dislikedIds;
  const initialRequested = state.lookup.requestedIds;
  const initialMatches = state.lookup.matchIds;

  // Create local state for tracking likes/dislikes without causing re-renders in parent
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavorites));
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set(initialDislikes));
  const [requestedIds] = useState<Set<string>>(new Set(initialRequested));
  const [matchIds] = useState<Set<string>>(new Set(initialMatches));

  // Sync local state with context state changes (e.g., when database data loads)
  useEffect(() => {
    setFavoriteIds(new Set(state.lookup.favIds));
  }, [state.lookup.favIds]);

  useEffect(() => {
    setDislikedIds(new Set(state.lookup.dislikedIds));
  }, [state.lookup.dislikedIds]);

  // Get actions from context
  const { 
    optimisticLike: contextLike, 
    optimisticDislike: contextDislike,
    optimisticRemoveLike: contextRemoveLike,
    optimisticRemoveDislike: contextRemoveDislike
  } = actions;

  // Create optimistic action handlers that update local state
  const optimisticLike = useCallback(async (listingId: string) => {
    // Skip if already liked
    if (favoriteIds.has(listingId)) return;

    // Update local state first
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
    
    setDislikedIds(prev => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });

    // Then update global state
    await contextLike(listingId, false);
  }, [favoriteIds, contextLike]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    // Skip if already disliked
    if (dislikedIds.has(listingId)) return;

    // Update local state first
    setDislikedIds(prev => {
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
    
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });

    // Then update global state
    await contextDislike(listingId);
  }, [dislikedIds, contextDislike]);

  const optimisticRemoveLike = useCallback(async (listingId: string) => {
    // Skip if not liked
    if (!favoriteIds.has(listingId)) return;

    // Update local state first
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });

    // Then update global state
    await contextRemoveLike(listingId, false);
  }, [favoriteIds, contextRemoveLike]);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
    // Skip if not disliked
    if (!dislikedIds.has(listingId)) return;

    // Update local state first
    setDislikedIds(prev => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });

    // Then update global state
    await contextRemoveDislike(listingId);
  }, [dislikedIds, contextRemoveDislike]);

  // Helper functions to check listing states
  const isLiked = useCallback((listingId: string) => favoriteIds.has(listingId), [favoriteIds]);
  const isDisliked = useCallback((listingId: string) => dislikedIds.has(listingId), [dislikedIds]);
  const isRequested = useCallback((listingId: string) => requestedIds.has(listingId), [requestedIds]);

  return {
    listings: initialListings,
    favoriteIds,
    dislikedIds,
    requestedIds,
    matchIds,
    optimisticLike,
    optimisticDislike,
    optimisticRemoveLike,
    optimisticRemoveDislike,
    isLiked,
    isDisliked,
    isRequested
  };
}