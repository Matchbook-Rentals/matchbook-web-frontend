'use client';

import { useContext, useMemo } from 'react';
import TripStateContext, { TripState } from '@/contexts/trip-state-context';

/**
 * Gets a one-time snapshot of the trip state, without subscribing to updates.
 * This is useful for heavy components like the map that don't need to re-render
 * when trip state changes.
 * 
 * @param selector Function to select a portion of the trip state
 * @returns The selected state value, memoized to not change on re-renders
 */
export function useTripSnapshot<T>(selector: (state: TripState) => T): T {
  const state = useContext(TripStateContext);
  
  if (!state) {
    throw new Error('useTripSnapshot must be used within a TripContextProvider');
  }
  
  // The selector is only run once during component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(state), []);
}