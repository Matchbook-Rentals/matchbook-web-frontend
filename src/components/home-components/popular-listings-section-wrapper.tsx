'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListingAndImages } from '@/types';
import PopularListingsSection, { ListingSection } from './popular-listings-section';
import {
  getListingsByLocation,
  getListingsNearLocation,
} from '@/app/actions/listings';

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
      newSections.push({
        title: `Your recent search in ${displayName}`,
        listings,
        showBadges: true,
      });
      usedLocations.add(makeLocationKey(userTripLocation.city, userTripLocation.state));
    } else if (popularAreas.length > 0) {
      const firstArea = popularAreas[0];
      const listings = await getListingsByLocation(firstArea.city, firstArea.state, LISTINGS_PER_ROW);
      newSections.push({
        title: 'Popular rentals',
        listings,
        showBadges: false,
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

  return <PopularListingsSection sections={sections} />;
}
