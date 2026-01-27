'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListingAndImages } from '@/types';
import PopularListingsSection, { ListingSection } from './popular-listings-section';
import {
  getListingsByLocation,
  getListingsNearLocation,
} from '@/app/actions/listings';
import { createGuestSession } from '@/app/actions/guest-session-db';
import { guestOptimisticFavorite, guestOptimisticRemoveFavorite, pullGuestFavoritesFromDb } from '@/app/actions/guest-favorites';
import { GuestSessionService } from '@/utils/guest-session';

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
}

const LISTINGS_PER_ROW = 12;

export default function PopularListingsSectionWrapper({
  isSignedIn,
  userTripLocation,
  popularAreas,
}: PopularListingsSectionWrapperProps) {
  const [sections, setSections] = useState<ListingSection[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoPermissionDenied, setGeoPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [guestFavoriteIds, setGuestFavoriteIds] = useState<Set<string>>(new Set());

  // Load guest favorites on mount (only for unauthenticated users)
  useEffect(() => {
    if (isSignedIn) return;
    const sessionId = GuestSessionService.getSessionIdFromCookie();
    if (!sessionId) return;
    setGuestSessionId(sessionId);
    pullGuestFavoritesFromDb(sessionId).then((result) => {
      if (result.success) {
        setGuestFavoriteIds(new Set(result.favoriteIds));
      }
    });
  }, [isSignedIn]);

  // Handle guest favorite toggle
  const handleGuestFavorite = useCallback(async (
    listingId: string,
    isFavorited: boolean,
    center?: { lat: number; lng: number },
    locationString?: string,
  ) => {
    if (isSignedIn) return;

    let sessionId = guestSessionId;

    // Lazy session creation on first like
    if (!sessionId && isFavorited && center) {
      const result = await createGuestSession({
        locationString: locationString || 'Unknown',
        latitude: center.lat,
        longitude: center.lng,
      });
      if (!result.success || !result.sessionId) return;
      sessionId = result.sessionId;
      setGuestSessionId(sessionId);
      // Store in cookie/localStorage for persistence
      GuestSessionService.storeSession(
        GuestSessionService.createGuestSessionData({
          locationString: locationString || 'Unknown',
          latitude: center.lat,
          longitude: center.lng,
        }, sessionId)
      );
    }

    if (!sessionId) return;

    // Optimistic UI update
    setGuestFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorited) {
        next.add(listingId);
      } else {
        next.delete(listingId);
      }
      return next;
    });

    // Persist to DB
    if (isFavorited) {
      await guestOptimisticFavorite(sessionId, listingId);
    } else {
      await guestOptimisticRemoveFavorite(sessionId, listingId);
    }
  }, [isSignedIn, guestSessionId]);

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

    setSections(newSections);
    setIsLoading(false);
  }, [isSignedIn, userTripLocation, userLocation, geoPermissionDenied, popularAreas]);

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
      <div className="py-8 w-[calc(100%-30px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] lg:w-[98%] max-w-[1520px] mx-auto">
        <div className="animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 bg-gray-200 rounded w-56" />
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
              </div>
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                  <div key={j} className="flex-shrink-0 w-[169px]">
                    <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
                    <div className="pt-3 flex flex-col gap-1">
                      <div className="h-4 bg-gray-200 rounded w-[85%]" />
                      <div className="h-3 bg-gray-200 rounded w-[70%]" />
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

  return (
    <PopularListingsSection
      sections={sections}
      guestFavoriteIds={isSignedIn ? undefined : guestFavoriteIds}
      onFavorite={isSignedIn ? undefined : handleGuestFavorite}
    />
  );
}
