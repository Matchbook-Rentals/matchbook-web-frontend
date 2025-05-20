'use client';

import { useContext } from 'react';
import TripActionsContext from '@/contexts/trip-actions-context';

/**
 * Gets the trip action methods for modifying trip state.
 * Components using this hook won't re-render when trip state changes,
 * as they're only subscribing to the actions context.
 */
export function useTripActions() {
  const actions = useContext(TripActionsContext);
  
  if (!actions) {
    throw new Error('useTripActions must be used within a TripContextProvider');
  }
  
  return actions;
}