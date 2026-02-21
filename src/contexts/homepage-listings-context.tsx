'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { HomepageUserState } from '@/app/actions/homepage-user-state';

interface HomepageListingsState {
  isSignedIn: boolean;
  authUserState?: Partial<HomepageUserState>;
  guestFavoriteIds?: Set<string>;
}

interface HomepageListingsActions {
  onFavorite?: (listingId: string, isFavorited: boolean, sectionTripId?: string, center?: { lat: number; lng: number }, locationString?: string) => void;
  onSignInPrompt?: () => void;
}

interface HomepageListingsContextType {
  state: HomepageListingsState;
  actions: HomepageListingsActions;
}

const HomepageListingsContext = createContext<HomepageListingsContextType | null>(null);

interface HomepageListingsProviderProps {
  children: ReactNode;
  state: HomepageListingsState;
  actions: HomepageListingsActions;
}

export function HomepageListingsProvider({ children, state, actions }: HomepageListingsProviderProps) {
  return (
    <HomepageListingsContext.Provider value={{ state, actions }}>
      {children}
    </HomepageListingsContext.Provider>
  );
}

export function useHomepageListingsContext() {
  const context = useContext(HomepageListingsContext);
  if (!context) {
    throw new Error('useHomepageListingsContext must be used within a HomepageListingsProvider');
  }
  return context;
}
