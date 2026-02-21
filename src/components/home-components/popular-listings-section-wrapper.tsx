'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ListingAndImages } from '@/types';
import PopularListingsSection, { ListingSection } from './popular-listings-section';
import {
  getListingsByLocation,
  getListingsNearLocation,
} from '@/app/actions/listings';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { createTrip } from '@/app/actions/trips';
import { GuestAuthModal } from '@/components/guest-auth-modal';
import { HomepageUserState } from '@/app/actions/homepage-user-state';
import { IpLocation } from '@/lib/ip-geolocation';
import { HomepageListingsProvider } from '@/contexts/homepage-listings-context';

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
  ipLocation?: IpLocation | null;
}

const LISTINGS_PER_ROW = 12;

export default function PopularListingsSectionWrapper({
  isSignedIn,
  userTripLocation,
  popularAreas,
  userState,
  recentTripId: initialRecentTripId,
  ipLocation,
}: PopularListingsSectionWrapperProps) {
  const [sections, setSections] = useState<ListingSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Stable key derived from the primitive values that actually drive fetch logic.
  // Object/array props from the server component get new references every render,
  // but their *content* doesn't change — serializing to a string prevents double-fetches.
  const sectionsFetchKey = useMemo(() => JSON.stringify({
    isSignedIn,
    utl: userTripLocation ? {
      city: userTripLocation.city,
      state: userTripLocation.state,
      lat: userTripLocation.latitude,
      lng: userTripLocation.longitude,
      loc: userTripLocation.locationString,
    } : null,
    ip: ipLocation ? { lat: ipLocation.lat, lng: ipLocation.lng } : null,
    areas: popularAreas.map(a => `${a.city}-${a.state}`),
    tripId: recentTripId,
  }), [isSignedIn, userTripLocation, ipLocation, popularAreas, recentTripId]);

  // Build sections on mount and when the fetch inputs actually change
  useEffect(() => {
    let cancelled = false;

    async function buildSections() {
      setIsLoading(true);
      const newSections: ListingSection[] = [];
      const usedLocations = new Set<string>();

      const userLocation = ipLocation ? { lat: ipLocation.lat, lng: ipLocation.lng } : null;

      const makeLocationKey = (city: string | null, state: string | null) =>
        `${city?.toLowerCase() || ''}-${state?.toLowerCase() || ''}`;

      // --- Determine Row 1 source synchronously and mark it used ---
      const hasUserTrip = isSignedIn && userTripLocation && (userTripLocation.city || userTripLocation.latitude);
      if (hasUserTrip) {
        usedLocations.add(makeLocationKey(userTripLocation!.city, userTripLocation!.state));
      } else if (popularAreas.length > 0) {
        usedLocations.add(makeLocationKey(popularAreas[0].city, popularAreas[0].state));
      }

      // --- Pre-select candidate popular areas for rows 2-4 ---
      const candidateAreas = popularAreas.filter(
        (a) => !usedLocations.has(makeLocationKey(a.city, a.state))
      ).slice(0, 3);

      // --- Fire all fetches in parallel ---
      const row1Fetch = (): Promise<ListingAndImages[]> => {
        if (hasUserTrip) {
          if (userTripLocation!.city) {
            return getListingsByLocation(userTripLocation!.city, userTripLocation!.state, LISTINGS_PER_ROW);
          }
          if (userTripLocation!.latitude && userTripLocation!.longitude) {
            return getListingsNearLocation(userTripLocation!.latitude, userTripLocation!.longitude, LISTINGS_PER_ROW);
          }
        } else if (popularAreas.length > 0) {
          return getListingsByLocation(popularAreas[0].city, popularAreas[0].state, LISTINGS_PER_ROW);
        }
        return Promise.resolve([]);
      };

      const [row1Listings, nearMeListings, ...candidateListings] = await Promise.all([
        row1Fetch(),
        userLocation
          ? getListingsNearLocation(userLocation.lat, userLocation.lng, LISTINGS_PER_ROW)
          : Promise.resolve(null),
        ...candidateAreas.map(area =>
          getListingsByLocation(area.city, area.state, LISTINGS_PER_ROW)
        ),
      ]);

      if (cancelled) return;

      // --- Assemble Row 1 ---
      if (hasUserTrip) {
        const displayName = userTripLocation!.locationString || userTripLocation!.city || 'your area';
        const tripCenter = userTripLocation!.latitude && userTripLocation!.longitude
          ? { lat: userTripLocation!.latitude, lng: userTripLocation!.longitude }
          : undefined;
        newSections.push({
          title: `Your recent search in ${displayName}`,
          listings: row1Listings,
          showBadges: true,
          center: tripCenter,
          locationString: displayName,
          city: userTripLocation!.city || undefined,
          state: userTripLocation!.state || undefined,
          sectionTripId: recentTripId || undefined,
        });
      } else if (popularAreas.length > 0) {
        const firstArea = popularAreas[0];
        newSections.push({
          title: `Explore monthly rentals in ${firstArea.city}`,
          listings: row1Listings,
          showBadges: false,
          center: { lat: firstArea.avgLat, lng: firstArea.avgLng },
          locationString: `${firstArea.city}, ${firstArea.state}`,
          city: firstArea.city,
          state: firstArea.state,
        });
      }

      // --- Assemble Row 2 ---
      let candidateStartIndex = 0;
      if (userLocation && nearMeListings && nearMeListings.length > 0) {
        newSections.push({
          title: 'Monthly rentals near me',
          listings: nearMeListings,
          center: userLocation,
          locationString: 'Near me',
        });
      } else if (candidateAreas.length > 0) {
        const fallbackArea = candidateAreas[0];
        newSections.push({
          title: `Explore monthly rentals in ${fallbackArea.city}`,
          listings: candidateListings[0],
          center: { lat: fallbackArea.avgLat, lng: fallbackArea.avgLng },
          locationString: `${fallbackArea.city}, ${fallbackArea.state}`,
          city: fallbackArea.city,
          state: fallbackArea.state,
        });
        usedLocations.add(makeLocationKey(fallbackArea.city, fallbackArea.state));
        candidateStartIndex = 1;
      }

      // --- Assemble Rows 3-4 from remaining candidates ---
      for (let i = candidateStartIndex; i < candidateAreas.length && newSections.length < 4; i++) {
        const area = candidateAreas[i];
        newSections.push({
          title: `Explore monthly rentals in ${area.city}`,
          listings: candidateListings[i],
          center: { lat: area.avgLat, lng: area.avgLng },
          locationString: `${area.city}, ${area.state}`,
          city: area.city,
          state: area.state,
        });
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
    }

    buildSections();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsFetchKey]);

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
              {/* Responsive card grid - matches Embla carousel structure */}
              <div className="flex gap-6 overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div 
                    key={j} 
                    className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
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
        <PopularListingsSection sections={sections} />
      </HomepageListingsProvider>
      <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
