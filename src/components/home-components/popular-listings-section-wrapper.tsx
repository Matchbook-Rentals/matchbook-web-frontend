'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ListingAndImages } from '@/types';
import PopularListingsSection, { ListingSection } from './popular-listings-section';
import {
  getListingsByLocation,
  getListingsNearLocation,
} from '@/app/actions/listings';
import { createGuestSession } from '@/app/actions/guest-session-db';
import { guestOptimisticFavorite, guestOptimisticRemoveFavorite, pullGuestFavoritesFromDb } from '@/app/actions/guest-favorites';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { createTrip } from '@/app/actions/trips';
import { GuestSessionService } from '@/utils/guest-session';
import { GuestAuthModal } from '@/components/guest-auth-modal';
import { HomepageUserState } from '@/app/actions/homepage-user-state';

interface UserTripLocation {
  city: string | null;
  state: string | null;
  locationString: string | null;
  latitude?: number;
  longitude?: number;
  searchRadius?: number | null;
}

interface PopularArea {
  city: string;
  state: string;
  count: number;
  avgLat: number;
  avgLng: number;
}

interface PopularListingsSectionWrapperProps {
  isSignedIn: boolean;
  userTripLocation: UserTripLocation | null;
  popularAreas: PopularArea[];
  userState?: HomepageUserState | null;
  recentTripId?: string | null;
}

const LISTINGS_PER_ROW = 12;

export default function PopularListingsSectionWrapper({
  isSignedIn,
  userTripLocation,
  popularAreas,
  userState,
  recentTripId: initialRecentTripId,
}: PopularListingsSectionWrapperProps) {
  const [sections, setSections] = useState<ListingSection[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [guestFavoriteIds, setGuestFavoriteIds] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const authFavoriteIdsRef = useRef<Set<string>>(
    new Set(userState?.favoritedListingIds ?? [])
  );
  const [recentTripId, setRecentTripId] = useState<string | null>(initialRecentTripId ?? null);

  // Guest favorites removed - users must sign in to like listings

  // Guest favorites are no longer supported - users must sign in to like listings
  const handleGuestFavorite = useCallback(async () => {
    // This function should never be called since we now enforce sign-in
    // But we keep it for type compatibility
    handleGuestApplyPrompt();
  }, []);

  // Handle authenticated user favorite toggle
  const handleAuthFavorite = useCallback(async (
    listingId: string,
    isFavorited: boolean,
    sectionTripId?: string,
    center?: { lat: number; lng: number },
    locationString?: string,
  ) => {
    if (!isSignedIn) return;

    // Determine which trip to use
    let tripId = sectionTripId || recentTripId;

    // If no existing trip, create one based on listing location
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

    // Update ref (no re-render — card manages its own UI state)
    if (isFavorited) {
      authFavoriteIdsRef.current.add(listingId);
    } else {
      authFavoriteIdsRef.current.delete(listingId);
    }

    // Persist to DB
    if (isFavorited) {
      await optimisticFavorite(tripId, listingId);
    } else {
      await optimisticRemoveFavorite(tripId, listingId);
    }
  }, [isSignedIn, recentTripId]);

  // Get browser geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setGeoPermissionDenied(true);
        },
        { timeout: 5000 }
      );
    } else {
      setGeoPermissionDenied(true);
    }
  }, []);

  const buildSections = useCallback(async () => {
    setIsLoading(true);
    const newSections: ListingSection[] = [];
    const usedLocations = new Set<string>();

    const makeLocationKey = (city: string | null, state: string | null) =>
      `${city?.toLowerCase() || ''}-${state?.toLowerCase() || ''}`;

    // Row 1: User's trip location OR generic popular
    if (isSignedIn && userTripLocation && (userTripLocation.city || userTripLocation.latitude)) {
      let listings: ListingAndImages[] = [];

      if (userTripLocation.city) {
        // Use city/state search
        listings = await getListingsByLocation(
          userTripLocation.city,
          userTripLocation.state,
          LISTINGS_PER_ROW
        );
      } else if (userTripLocation.latitude && userTripLocation.longitude) {
        // Fall back to lat/lng search
        listings = await getListingsNearLocation(
          userTripLocation.latitude,
          userTripLocation.longitude,
          LISTINGS_PER_ROW
        );
      }

      const displayName = userTripLocation.locationString || userTripLocation.city || 'your area';
      const tripCenter = userTripLocation.latitude && userTripLocation.longitude
        ? { lat: userTripLocation.latitude, lng: userTripLocation.longitude }
        : undefined;
      newSections.push({
        title: `Your recent search in ${displayName}`,
        listings,
        showBadges: true,
        center: tripCenter,
        locationString: displayName,
        city: userTripLocation.city || undefined,
        state: userTripLocation.state || undefined,
        sectionTripId: recentTripId || undefined,
      });
      usedLocations.add(makeLocationKey(userTripLocation.city, userTripLocation.state));
    } else if (popularAreas.length > 0) {
      const firstArea = popularAreas[0];
      const listings = await getListingsByLocation(firstArea.city, firstArea.state, LISTINGS_PER_ROW);
      newSections.push({
        title: `Explore monthly rentals in ${firstArea.city}`,
        listings,
        showBadges: false,
        center: { lat: firstArea.avgLat, lng: firstArea.avgLng },
        locationString: `${firstArea.city}, ${firstArea.state}`,
        city: firstArea.city,
        state: firstArea.state,
      });
      usedLocations.add(makeLocationKey(firstArea.city, firstArea.state));
    }

    // Row 2: Near me (uses geolocation) or fallback
    if (userLocation) {
      const listings = await getListingsNearLocation(
        userLocation.lat,
        userLocation.lng,
        LISTINGS_PER_ROW
      );
      if (listings.length > 0) {
        newSections.push({
          title: 'Monthly rentals near me',
          listings,
          center: userLocation,
          locationString: 'Near me',
          // No city/state for geolocation-based rows
        });
      } else {
        // No listings nearby, use a popular area
        const fallbackArea = popularAreas.find(
          (a) => !usedLocations.has(makeLocationKey(a.city, a.state))
        );
        if (fallbackArea) {
          const fallbackListings = await getListingsByLocation(
            fallbackArea.city,
            fallbackArea.state,
            LISTINGS_PER_ROW
          );
          newSections.push({
            title: 'Monthly rentals near you',
            listings: fallbackListings,
            center: { lat: fallbackArea.avgLat, lng: fallbackArea.avgLng },
            locationString: `${fallbackArea.city}, ${fallbackArea.state}`,
            city: fallbackArea.city,
            state: fallbackArea.state,
          });
          usedLocations.add(makeLocationKey(fallbackArea.city, fallbackArea.state));
        }
      }
    } else if (geoPermissionDenied) {
      // Geolocation denied - use a popular area as fallback
      const fallbackArea = popularAreas.find(
        (a) => !usedLocations.has(makeLocationKey(a.city, a.state))
      );
      if (fallbackArea) {
        const listings = await getListingsByLocation(
          fallbackArea.city,
          fallbackArea.state,
          LISTINGS_PER_ROW
        );
        newSections.push({
          title: 'Monthly rentals near you',
          listings,
          center: { lat: fallbackArea.avgLat, lng: fallbackArea.avgLng },
          locationString: `${fallbackArea.city}, ${fallbackArea.state}`,
          city: fallbackArea.city,
          state: fallbackArea.state,
        });
        usedLocations.add(makeLocationKey(fallbackArea.city, fallbackArea.state));
      }
    }

    // Rows 3-4: Popular areas (skip used locations)
    for (const area of popularAreas) {
      if (newSections.length >= 4) break;
      const key = makeLocationKey(area.city, area.state);
      if (usedLocations.has(key)) continue;

      const listings = await getListingsByLocation(area.city, area.state, LISTINGS_PER_ROW);
      newSections.push({
        title: `Explore monthly rentals in ${area.city}`,
        listings,
        center: { lat: area.avgLat, lng: area.avgLng },
        locationString: `${area.city}, ${area.state}`,
        city: area.city,
        state: area.state,
      });
      usedLocations.add(key);
    }

    // Initial sort: matched first, then liked, then others (using RSC-provided state)
    if (userState) {
      for (const section of newSections) {
        section.listings.sort((a, b) => {
          const priorityA = userState.matchedListings?.some(m => m.listingId === a.id) ? 0 :
                            userState.favoritedListingIds?.includes(a.id) ? 1 : 2;
          const priorityB = userState.matchedListings?.some(m => m.listingId === b.id) ? 0 :
                            userState.favoritedListingIds?.includes(b.id) ? 1 : 2;
          return priorityA - priorityB;
        });
      }
    }

    setSections(newSections);
    setIsLoading(false);
  }, [isSignedIn, userTripLocation, userLocation, geoPermissionDenied, popularAreas, recentTripId]);

  // Build sections when dependencies change
  useEffect(() => {
    // Wait for geolocation to resolve (success or denied) before building
    const geoResolved = userLocation !== null || geoPermissionDenied;
    if (geoResolved) {
      buildSections();
    }
  }, [buildSections, userLocation, geoPermissionDenied]);

  // Show loading state while building sections
  if (isLoading && sections.length === 0) {
    return (
      <div className="py-8 w-[calc(100%-30px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] lg:w-[79.17%] max-w-[1520px] mx-auto">
        <div className="animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-10">
              {/* Header with title and navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-200 rounded w-56" />
                  <div className="w-6 h-6 bg-gray-200 rounded-full" />
                </div>
                {/* Scroll buttons - hidden on mobile */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-9 h-9 bg-gray-100 rounded-full" />
                  <div className="w-9 h-9 bg-gray-100 rounded-full" />
                </div>
              </div>
              {/* Responsive card grid - matches HomepageListingCard widths exactly */}
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div 
                    key={j} 
                    className="flex-shrink-0 w-[calc(50%-12px)] sm:w-[calc(33.333%-16px)] md:w-[calc(25%-18px)] lg:w-[calc(20%-19.2px)]"
                  >
                    {/* Image skeleton */}
                    <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
                    {/* Card content skeleton */}
                    <div className="pt-3 flex flex-col gap-0.5">
                      {/* Title */}
                      <div className="h-4 bg-gray-200 rounded w-[85%]" />
                      {/* Details line */}
                      <div className="h-3 bg-gray-200 rounded w-[70%]" />
                      {/* Price and rating row */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="h-3 bg-gray-200 rounded w-[40%]" />
                        <div className="h-3 bg-gray-200 rounded w-[25%]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleGuestApplyPrompt = () => setShowAuthModal(true);

  return (
    <>
      <PopularListingsSection
        sections={sections}
        guestFavoriteIds={isSignedIn ? undefined : new Set()} // Empty set for guests
        onFavorite={isSignedIn ? handleAuthFavorite : handleGuestFavorite}
        onSignInPrompt={isSignedIn ? undefined : handleGuestApplyPrompt}
        authUserState={isSignedIn ? {
          ...userState,
          favoritedListingIds: Array.from(authFavoriteIdsRef.current),
        } : undefined}
        isSignedIn={isSignedIn}
      />
      <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
