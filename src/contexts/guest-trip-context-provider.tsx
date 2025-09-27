'use client';

import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { ListingAndImages } from '@/types';
import { GuestSession, GuestSessionService } from '@/utils/guest-session';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { matchesFilters, FilterOptions } from '@/lib/listing-filters';
import {
  guestOptimisticFavorite,
  guestOptimisticRemoveFavorite,
  guestOptimisticDislike,
  guestOptimisticRemoveDislike,
  pullGuestFavoritesFromDb
} from '@/app/actions/guest-favorites';
import GuestAuthModal from '@/components/guest-auth-modal';

interface ListingWithAvailability extends ListingAndImages {
  availableStart?: Date;
  availableEnd?: Date;
  isActuallyAvailable?: boolean;
}

interface ViewedListing {
  listing: ListingAndImages;
  action: 'favorite' | 'dislike';
  actionId: string;
}

interface GuestTripContextType {
  state: {
    session: GuestSession | null;
    listings: ListingAndImages[];
    allListings: ListingWithAvailability[];
    swipeListings: ListingWithAvailability[];
    showListings: ListingWithAvailability[];
    swipeShowListings: ListingWithAvailability[];
    viewedListings: ViewedListing[];
    likedListings: ListingAndImages[];
    dislikedListings: ListingAndImages[];
    requestedListings: ListingAndImages[];
    matchedListings: ListingAndImages[];
    isLoading: boolean;
    lookup: {
      favIds: Set<string>;
      dislikedIds: Set<string>;
      requestedIds: Set<string>;
      matchIds: Set<string>;
    };
    filters: FilterOptions;
    filteredCount: number;
  };
  actions: {
    setViewedListings: React.Dispatch<React.SetStateAction<ViewedListing[]>>;
    setSession: React.Dispatch<React.SetStateAction<GuestSession | null>>;
    setLookup: React.Dispatch<React.SetStateAction<GuestTripContextType['state']['lookup']>>;
    showAuthPrompt: (action: 'like' | 'apply' | 'contact', listingId?: string) => void;
    updateFilter: (key: keyof FilterOptions, value: any) => void;
    updateFilters: (newFilters: FilterOptions) => void;
    optimisticLike: (listingId: string) => Promise<void>;
    optimisticDislike: (listingId: string) => Promise<void>;
    optimisticRemoveLike: (listingId: string) => Promise<void>;
    optimisticRemoveDislike: (listingId: string) => Promise<void>;
  };
}

interface GuestTripContextProviderProps {
  children: ReactNode;
  sessionId: string;
  sessionData: GuestSession; // Now passed from server
  listingData: ListingAndImages[]; // Required - real listing data from database
}

const GuestTripContext = createContext<GuestTripContextType | undefined>(undefined);

export const useGuestTripContext = () => {
  const context = useContext(GuestTripContext);
  if (!context) {
    throw new Error('useGuestTripContext must be used within a GuestTripContextProvider');
  }
  return context;
};

export const GuestTripContextProvider: React.FC<GuestTripContextProviderProps> = ({
  children,
  sessionId,
  sessionData,
  listingData
}) => {
  const [session, setSession] = useState<GuestSession | null>(sessionData);
  const [listings, setListings] = useState<ListingAndImages[]>(listingData);
  const [viewedListings, setViewedListings] = useState<ViewedListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPromptContext, setAuthPromptContext] = useState<{
    action: 'like' | 'apply' | 'contact';
    listingId?: string;
  } | null>(null);

  const [lookup, setLookup] = useState<GuestTripContextType['state']['lookup']>({
    favIds: new Set(),
    dislikedIds: new Set(),
    requestedIds: new Set(),
    matchIds: new Set()
  });

  // Initialize filters from session data
  const [filters, setFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTER_OPTIONS,
    // Initialize immediately with server data
    moveInDate: sessionData.searchParams.startDate || new Date(),
    moveOutDate: sessionData.searchParams.endDate || new Date(),
    pets: sessionData.searchParams.guests.pets > 0 ? ['petsAllowed'] : [],
  });

  // Load favorites/dislikes from database on mount
  useEffect(() => {
    const loadGuestFavorites = async () => {
      // Load favorites and dislikes from database
      const favoritesResult = await pullGuestFavoritesFromDb(sessionId);
      if (favoritesResult.success) {
        setLookup(prev => ({
          ...prev,
          favIds: new Set(favoritesResult.favoriteIds),
          dislikedIds: new Set(favoritesResult.dislikeIds)
        }));
      }
    };

    loadGuestFavorites();
  }, [sessionId]);

  // Update session state when sessionData prop changes (if needed)
  useEffect(() => {
    setSession(sessionData);

    // Update filters when session data changes
    setFilters(prev => ({
      ...prev,
      moveInDate: sessionData.searchParams.startDate || new Date(),
      moveOutDate: sessionData.searchParams.endDate || new Date(),
      pets: sessionData.searchParams.guests.pets > 0 ? ['petsAllowed'] : [],
    }));
  }, [sessionData]);

  // All listings for map tab (includes liked/disliked)
  const allListings: ListingWithAvailability[] = useMemo(() => {
    return listings.map(listing => ({
      ...listing,
      isActuallyAvailable: true, // For guests, assume all are available
    }));
  }, [listings]);

  // Filter out liked and disliked listings for swipe/match tab to automatically advance
  const swipeListings: ListingWithAvailability[] = useMemo(() => {
    return listings
      .filter(listing => !lookup.favIds.has(listing.id) && !lookup.dislikedIds.has(listing.id))
      .map(listing => ({
        ...listing,
        isActuallyAvailable: true, // For guests, assume all are available
      }));
  }, [listings, lookup.favIds, lookup.dislikedIds]);

  // Filtered listings for map display (includes liked/disliked that match filters)
  const showListings: ListingWithAvailability[] = useMemo(() => {
    return allListings.filter(listing =>
      matchesFilters({
        ...listing,
        calculatedPrice: listing.price
      }, filters)
    );
  }, [allListings, filters]);

  // Filtered swipe listings (excludes liked/disliked AND applies filters)
  const swipeShowListings: ListingWithAvailability[] = useMemo(() => {
    return showListings.filter(listing =>
      !lookup.favIds.has(listing.id) && !lookup.dislikedIds.has(listing.id)
    );
  }, [showListings, lookup.favIds, lookup.dislikedIds]);

  // Derive liked/disliked listings from the loaded data
  const likedListings = useMemo(() => {
    return listings.filter(listing => lookup.favIds.has(listing.id));
  }, [listings, lookup.favIds]);

  const dislikedListings = useMemo(() => {
    return listings.filter(listing => lookup.dislikedIds.has(listing.id));
  }, [listings, lookup.dislikedIds]);

  // Empty arrays for guest context - no applications until auth
  const requestedListings = useMemo(() => [], []);
  const matchedListings = useMemo(() => [], []);

  const showAuthPrompt = useCallback((action: 'like' | 'apply' | 'contact', listingId?: string) => {
    setAuthPromptContext({ action, listingId });
    setShowAuthModal(true);

    // Store pending action in session
    if (listingId) {
      GuestSessionService.addPendingAction({
        type: action,
        listingId,
        timestamp: Date.now()
      });
    }
  }, []);

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Real optimistic actions that persist to database
  const optimisticLike = useCallback(async (listingId: string) => {
    if (!session) return;

    // Optimistically update UI
    setLookup(prev => ({
      ...prev,
      favIds: new Set([...prev.favIds, listingId]),
      dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
    }));

    try {
      const result = await guestOptimisticFavorite(sessionId, listingId);
      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          favIds: new Set([...prev.favIds].filter(id => id !== listingId))
        }));
      }
    } catch (error) {
      console.error('Error liking listing:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds].filter(id => id !== listingId))
      }));
    }
  }, [session, sessionId]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    if (!session) return;

    // Optimistically update UI
    setLookup(prev => ({
      ...prev,
      dislikedIds: new Set([...prev.dislikedIds, listingId]),
      favIds: new Set([...prev.favIds].filter(id => id !== listingId))
    }));

    try {
      const result = await guestOptimisticDislike(sessionId, listingId);
      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
        }));
      }
    } catch (error) {
      console.error('Error disliking listing:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
      }));
    }
  }, [session, sessionId]);

  const optimisticRemoveLike = useCallback(async (listingId: string) => {
    if (!session) return;

    // Optimistically update UI
    setLookup(prev => ({
      ...prev,
      favIds: new Set([...prev.favIds].filter(id => id !== listingId))
    }));

    try {
      const result = await guestOptimisticRemoveFavorite(sessionId, listingId);
      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          favIds: new Set([...prev.favIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Error removing like:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        favIds: new Set([...prev.favIds, listingId])
      }));
    }
  }, [session, sessionId]);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
    if (!session) return;

    // Optimistically update UI
    setLookup(prev => ({
      ...prev,
      dislikedIds: new Set([...prev.dislikedIds].filter(id => id !== listingId))
    }));

    try {
      const result = await guestOptimisticRemoveDislike(sessionId, listingId);
      if (!result.success) {
        // Rollback on failure
        setLookup(prev => ({
          ...prev,
          dislikedIds: new Set([...prev.dislikedIds, listingId])
        }));
      }
    } catch (error) {
      console.error('Error removing dislike:', error);
      // Rollback on error
      setLookup(prev => ({
        ...prev,
        dislikedIds: new Set([...prev.dislikedIds, listingId])
      }));
    }
  }, [session, sessionId]);

  const contextValue: GuestTripContextType = {
    state: {
      session,
      listings,
      allListings,
      swipeListings,
      showListings,
      swipeShowListings,
      viewedListings,
      likedListings,
      dislikedListings,
      requestedListings,
      matchedListings,
      isLoading,
      lookup,
      filters,
      filteredCount: allListings.length,
    },
    actions: {
      setViewedListings,
      setSession,
      setLookup,
      showAuthPrompt,
      updateFilter,
      updateFilters,
      optimisticLike,
      optimisticDislike,
      optimisticRemoveLike,
      optimisticRemoveDislike,
    }
  };

  return (
    <GuestTripContext.Provider value={contextValue}>
      {children}
      <GuestAuthModal
        isOpen={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
          if (!open) {
            setAuthPromptContext(null);
          }
        }}
      />
    </GuestTripContext.Provider>
  );
};