'use client';

import { useState, useCallback, useRef } from 'react';
import PopularListingsSection, { ListingSection } from './popular-listings-section';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { createTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { GuestSessionService } from '@/utils/guest-session';
import { buildSearchUrl } from '@/app/search/search-page-client';
import { GuestAuthModal } from '@/components/guest-auth-modal';
import { HomepageUserState } from '@/app/actions/homepage-user-state';
import { HomepageListingsProvider } from '@/contexts/homepage-listings-context';

interface PopularListingsSectionWrapperProps {
  isSignedIn: boolean;
  sections: ListingSection[];
  userState?: HomepageUserState | null;
  recentTripId?: string | null;
}

export default function PopularListingsSectionWrapper({
  isSignedIn,
  sections,
  userState,
  recentTripId: initialRecentTripId,
}: PopularListingsSectionWrapperProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const authFavoriteIdsRef = useRef<Set<string>>(
    new Set(userState?.favoritedListingIds ?? [])
  );
  const [recentTripId, setRecentTripId] = useState<string | null>(initialRecentTripId ?? null);

  const handleGuestFavorite = useCallback(async () => {
    handleGuestApplyPrompt();
  }, []);

  const handleAuthFavorite = useCallback(async (
    listingId: string,
    isFavorited: boolean,
    sectionTripId?: string,
    center?: { lat: number; lng: number },
    locationString?: string,
  ) => {
    if (!isSignedIn) return;

    let tripId = sectionTripId || recentTripId;

    if (!tripId && isFavorited && center) {
      const result = await createTrip({
        locationString: locationString || 'Unknown',
        latitude: center.lat,
        longitude: center.lng,
      });
      if (!result.success || !result.trip) return;
      tripId = result.trip.id;
      setRecentTripId(tripId);
    }

    if (!tripId) return;

    if (isFavorited) {
      authFavoriteIdsRef.current.add(listingId);
    } else {
      authFavoriteIdsRef.current.delete(listingId);
    }

    if (isFavorited) {
      await optimisticFavorite(tripId, listingId);
    } else {
      await optimisticRemoveFavorite(tripId, listingId);
    }
  }, [isSignedIn, recentTripId]);

  const handleExplore = useCallback(async (section: ListingSection) => {
    if (!section.center) return;

    const tripData = {
      locationString: section.locationString || `${section.city}, ${section.state}` || 'Unknown',
      latitude: section.center.lat,
      longitude: section.center.lng,
    };

    try {
      if (isSignedIn) {
        const response = await createTrip(tripData);
        if (response.success && response.trip) {
          window.location.href = buildSearchUrl({ tripId: response.trip.id });
        }
      } else {
        const response = await createGuestTrip(tripData);
        if (response.success && response.sessionId) {
          const sessionData = GuestSessionService.createGuestSessionData(tripData, response.sessionId);
          GuestSessionService.storeSession(sessionData);
          window.location.href = buildSearchUrl({ sessionId: response.sessionId });
        }
      }
    } catch (error) {
      console.error('Failed to create trip for explore:', error);
    }
  }, [isSignedIn]);

  const handleGuestApplyPrompt = () => setShowAuthModal(true);

  return (
    <>
      <HomepageListingsProvider
        state={{
          isSignedIn,
          authUserState: isSignedIn ? {
            ...userState,
            favoritedListingIds: Array.from(authFavoriteIdsRef.current),
          } : undefined,
          guestFavoriteIds: isSignedIn ? undefined : new Set(),
        }}
        actions={{
          onFavorite: isSignedIn ? handleAuthFavorite : handleGuestFavorite,
          onSignInPrompt: isSignedIn ? undefined : handleGuestApplyPrompt,
        }}
      >
        <PopularListingsSection sections={sections} onExplore={handleExplore} />
      </HomepageListingsProvider>
      <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
