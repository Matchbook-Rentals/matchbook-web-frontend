'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { getListingsByBounds, MapBounds } from '@/app/actions/listings';
import { ListingAndImages } from '@/types';
import AnimatedSearchHeader from './animated-search-header';
import SearchMap from '@/app/app/rent/old-search/(components)/search-map';
import HomepageListingCard from '@/components/home-components/homepage-listing-card';
import { Loader2 } from 'lucide-react';

// US bounding box for geolocation check
const US_BOUNDS = {
  north: 49.384,
  south: 24.396,
  west: -125.0,
  east: -66.934,
};

const SALT_LAKE_CITY = {
  lat: 40.7608,
  lng: -111.8910,
};

// Calculate approximate bounds from center and zoom level
// At zoom 12, the visible area is roughly 0.1 degrees lat/lng
const calculateBoundsFromCenter = (
  lat: number,
  lng: number,
  zoom: number = 12
): MapBounds => {
  // Approximate degrees per tile at given zoom level
  // Higher zoom = smaller area visible
  const degreesPerTile = 360 / Math.pow(2, zoom);
  const visibleTiles = 4; // Approximate tiles visible in viewport
  const offset = (degreesPerTile * visibleTiles) / 2;

  return {
    north: lat + offset,
    south: lat - offset,
    east: lng + offset,
    west: lng - offset,
  };
};

// Marker styles matching existing search-map-tab
const MARKER_STYLES = {
  SIMPLE_MARKER_THRESHOLD: 30,
  FULLSCREEN_SIMPLE_MARKER_THRESHOLD: 60,
  MARKER_COLORS: {
    DEFAULT: { primary: '#0B6E6E', secondary: '#FFFFFF' },
    HOVER: { primary: '#fb8c00', secondary: '#FFFFFF' },
    LIKED: { primary: '#000000', secondary: '#5c9ac5' },
    DISLIKED: { primary: '#FFFFFF', secondary: '#404040' },
  },
  PRICE_BUBBLE_COLORS: {
    DEFAULT: { background: '#FFFFFF', text: '#1f2937', border: 'grey' },
    HOVER: { background: '#0B6E6E', text: '#FFFFFF', border: '#0B6E6E' },
    DISLIKED: { background: '#1f2937', text: '#FFFFFF', border: '#FFFFFF' },
  },
  HEART_ICON: {
    color: '#FF6B6B',
    simpleMarkerTransform: 'translate(20, 4)',
    simpleMarkerScale: 'scale(1.5)',
    priceBubblePosition: { top: '-8px', right: '-8px' },
    size: '12px',
    withBackground: true,
    backgroundCircle: {
      radius: '6',
      fill: 'white',
      stroke: '#404040',
      strokeWidth: '0.5',
    },
  },
  Z_INDEX: {
    HOVER: '10',
    SELECTED: '5',
    LIKED: '3',
    DEFAULT: '1',
    DISLIKED: '0',
  },
};

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface TripsPageClientProps {
  userId: string | null;
  user: UserObject | null;
  isSignedIn: boolean;
  defaultCenter: { lat: number; lng: number };
}

const isInUS = (lat: number, lng: number): boolean => {
  return (
    lat >= US_BOUNDS.south &&
    lat <= US_BOUNDS.north &&
    lng >= US_BOUNDS.west &&
    lng <= US_BOUNDS.east
  );
};

export default function TripsPageClient({
  userId,
  user,
  isSignedIn,
  defaultCenter,
}: TripsPageClientProps) {
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [listings, setListings] = useState<ListingAndImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Track scroll position for header animation
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 100);
  });

  // Debounced fetch listings based on center
  const fetchListingsForCenter = useDebouncedCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const bounds = calculateBoundsFromCenter(lat, lng, 12);
      const results = await getListingsByBounds(bounds);
      setListings(results);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  // Get user's geolocation on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (isInUS(latitude, longitude)) {
            setMapCenter({ lat: latitude, lng: longitude });
            fetchListingsForCenter(latitude, longitude);
          } else {
            setMapCenter(SALT_LAKE_CITY);
            fetchListingsForCenter(SALT_LAKE_CITY.lat, SALT_LAKE_CITY.lng);
          }
          setInitialLoadDone(true);
        },
        () => {
          // Geolocation denied or error - use Salt Lake City
          setMapCenter(SALT_LAKE_CITY);
          fetchListingsForCenter(SALT_LAKE_CITY.lat, SALT_LAKE_CITY.lng);
          setInitialLoadDone(true);
        },
        { timeout: 5000 }
      );
    } else {
      // No geolocation support - use Salt Lake City
      fetchListingsForCenter(SALT_LAKE_CITY.lat, SALT_LAKE_CITY.lng);
      setInitialLoadDone(true);
    }
  }, []);

  // Handle map center change (when user pans)
  const handleCenterChanged = (lng: number, lat: number) => {
    setMapCenter({ lat, lng });
    if (initialLoadDone) {
      fetchListingsForCenter(lat, lng);
    }
  };

  // Convert listings to map markers
  const markers = listings
    .filter(listing =>
      typeof listing.latitude === 'number' &&
      typeof listing.longitude === 'number'
    )
    .map(listing => ({
      lat: listing.latitude!,
      lng: listing.longitude!,
      title: listing.title || '',
      listing: listing,
      color: 'white',
    }));

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <AnimatedSearchHeader
        userId={userId}
        user={user}
        isSignedIn={isSignedIn}
        isScrolled={isScrolled}
      />

      {/* Main content area */}
      <div className="flex h-[calc(100vh-80px)] pt-[80px]">
        {/* Listings sidebar */}
        <div className="w-3/5 overflow-y-auto p-4 border-r">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isLoading ? 'Searching...' : `${listings.length} rentals found`}
            </h2>
          </div>

          {isLoading && listings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primaryBrand" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p>No listings found in this area.</p>
              <p className="text-sm mt-2">Try panning the map to a different location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <HomepageListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map container */}
        <div className="w-2/5 h-full sticky top-[80px]">
          <SearchMap
            center={[mapCenter.lng, mapCenter.lat]}
            zoom={12}
            height="100%"
            markers={markers}
            markerStyles={MARKER_STYLES}
            onCenterChanged={handleCenterChanged}
          />
        </div>
      </div>
    </div>
  );
}
