'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { GuestTripContext } from '@/contexts/guest-trip-context-provider';
import { GuestSession, GuestSessionService } from '@/utils/guest-session';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { FilterOptions, matchesFilters } from '@/lib/listing-filters';
import { getListingsByBounds, type MapBounds } from '@/app/actions/listings';
import SearchFiltersModal from './search-filters-modal';
import GuestSearchListingsGrid from '@/app/guest/rent/searches/components/guest-search-listings-grid';
import GuestSearchMap from '@/app/guest/rent/searches/components/guest-search-map';
import GuestSearchMapMobile from '@/app/guest/rent/searches/components/guest-search-map-mobile';
import { GuestAuthModal } from '@/components/guest-auth-modal';
import SearchResultsNavbar from '@/components/newnew/search-results-navbar';
import { useListingsGridLayout } from '@/hooks/useListingsGridLayout';
import { calculateRent } from '@/lib/calculate-rent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTrip } from '@/app/actions/trips';
import { createGuestTrip } from '@/app/actions/guest-trips';
import { optimisticFavorite, optimisticRemoveFavorite } from '@/app/actions/favorites';
import { optimisticDislikeDb, optimisticRemoveDislikeDb } from '@/app/actions/dislikes';
import { guestOptimisticFavorite, guestOptimisticRemoveFavorite, guestOptimisticDislike, guestOptimisticRemoveDislike, pullGuestFavoritesFromDb } from '@/app/actions/guest-favorites';
import type { TripData } from './page';

interface UserObject {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses?: { emailAddress: string }[];
  publicMetadata?: Record<string, any>;
}

interface SearchPageClientProps {
  listings: ListingAndImages[];
  center: { lat: number; lng: number };
  locationString: string;
  isSignedIn: boolean;
  userId: string | null;
  user: UserObject | null;
  tripId?: string;
  sessionId?: string;
  tripData?: TripData | null;
  hasLocationParams: boolean;
}

export function buildSearchUrl(params: {
  lat?: number;
  lng?: number;
  tripId?: string;
  sessionId?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.tripId) {
    sp.set('tripId', params.tripId);
  } else if (params.sessionId) {
    sp.set('sessionId', params.sessionId);
  } else {
    if (params.lat != null) sp.set('lat', String(params.lat));
    if (params.lng != null) sp.set('lng', String(params.lng));
  }
  return `/search?${sp.toString()}`;
}

// Human-readable labels for filter values displayed as active badges
const FILTER_VALUE_LABELS: Record<string, string> = {
  singleFamily: 'Single Family', apartment: 'Apartment', townhouse: 'Town House', privateRoom: 'Private Room',
  utilitiesIncluded: 'Utilities Included', utilitiesNotIncluded: 'Utilities Not Included',
  petsAllowed: 'Pets Welcome', petsNotAllowed: 'No Pets',
  washerInUnit: 'In Unit', washerInComplex: 'In Complex',
  airConditioner: 'Air Conditioning', heater: 'Heating', wifi: 'Wifi', dedicatedWorkspace: 'Workspace',
  kitchenEssentials: 'Kitchen Essentials', garbageDisposal: 'Garbage Disposal', dishwasher: 'Dishwasher',
  fridge: 'Refrigerator', oven: 'Oven/Stove',
  sauna: 'Sauna', gym: 'Gym', sunroom: 'Sun Room', balcony: 'Balcony', pool: 'Pool', hotTub: 'Hot Tub',
  fireplace: 'Fire Place',
  fencedInYard: 'Fenced Yard', gatedEntry: 'Gated Entry', wheelchairAccess: 'Wheelchair',
  keylessEntry: 'Keyless Entry', carbonMonoxide: 'CO Detector', smokeDetector: 'Smoke Detector', security: 'Security System',
  offStreetParking: 'Parking', evCharging: 'EV Charging', garageParking: 'Garage',
  mountainView: 'Mountain View', cityView: 'City View', waterfront: 'Waterfront', waterView: 'Water View',
};

interface ActiveFilter {
  key: keyof FilterOptions;
  value: string;
  label: string;
}

const ARRAY_FILTER_KEYS: (keyof FilterOptions)[] = [
  'propertyTypes', 'utilities', 'pets', 'laundry',
  'basics', 'kitchen', 'luxury', 'accessibility', 'parking', 'location',
];

function getActiveFilters(filters: FilterOptions): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  for (const key of ARRAY_FILTER_KEYS) {
    const arr = filters[key];
    if (Array.isArray(arr)) {
      for (const value of arr as string[]) {
        active.push({ key, value, label: FILTER_VALUE_LABELS[value] || value });
      }
    }
  }
  if (filters.furnished) active.push({ key: 'furnished', value: 'furnished', label: 'Furnished' });
  if (filters.unfurnished) active.push({ key: 'unfurnished', value: 'unfurnished', label: 'Unfurnished' });
  if (filters.minPrice != null) active.push({ key: 'minPrice', value: String(filters.minPrice), label: `Min $${filters.minPrice}` });
  if (filters.maxPrice != null) active.push({ key: 'maxPrice', value: String(filters.maxPrice), label: `Max $${filters.maxPrice}` });
  if (filters.minBedrooms > 0) active.push({ key: 'minBedrooms', value: String(filters.minBedrooms), label: `${filters.minBedrooms}+ Beds` });
  if (filters.minBathrooms > 0) active.push({ key: 'minBathrooms', value: String(filters.minBathrooms), label: `${filters.minBathrooms}+ Baths` });
  return active;
}

function SearchFilterBar({ onFiltersClick, filters, onRemoveFilter, onSetAllFilters }: {
  onFiltersClick?: () => void;
  filters: FilterOptions;
  onRemoveFilter: (filter: ActiveFilter) => void;
  onSetAllFilters?: () => void;
}) {
  const activeFilters = getActiveFilters(filters);

  return (
    <div className="flex w-full min-h-[51px] items-center justify-between px-3 py-2 md:rounded-lg md:border md:border-solid md:border-[#e6e6e6] flex-shrink-0">
      <div className="hidden md:flex flex-wrap items-center gap-2 flex-1">
        {activeFilters.map((filter) => (
          <Badge
            key={`${filter.key}-${filter.value}`}
            variant="secondary"
            onClick={() => onRemoveFilter(filter)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-solid border-gray-900 bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-pointer flex-shrink-0"
          >
            <span className="font-['Poppins',Helvetica] font-medium text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
              {filter.label}
            </span>
            <XIcon className="w-4 h-4" />
          </Badge>
        ))}
      </div>

      {process.env.NODE_ENV === 'development' && (
        <Button
          variant="outline"
          className="hidden md:inline-flex h-8 items-center justify-center gap-1.5 p-2.5 rounded-lg border border-solid border-red-400 hover:bg-red-50 flex-shrink-0 ml-3"
          onClick={onSetAllFilters}
        >
          <span className="font-medium text-red-500 text-xs whitespace-nowrap">Test All</span>
        </Button>
      )}

      <Button
        variant="ghost"
        className="inline-flex h-8 items-center justify-center gap-1.5 p-2.5 rounded-lg md:border md:border-solid md:border-[#3c8787] md:hover:bg-[#3c8787]/10 flex-shrink-0 ml-auto md:ml-3"
        onClick={onFiltersClick}
      >
        <span className="hidden md:inline font-['Poppins',Helvetica] font-medium text-[#3c8787] text-sm tracking-[0] leading-[normal]">
          Filters
        </span>
        <img className="w-5 h-5" alt="Filters" src="/frame-4.svg" />
      </Button>
    </div>
  );
}

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
    backgroundCircle: { radius: '6', fill: 'white', stroke: '#404040', strokeWidth: '0.5' },
  },
  Z_INDEX: { HOVER: '10', SELECTED: '5', LIKED: '3', DEFAULT: '1', DISLIKED: '0' },
};

const slideUpVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'tween', duration: 0.8, ease: 'easeInOut' } },
  exit: { y: '100%', transition: { type: 'tween', duration: 0.6, ease: 'easeInOut' } },
};

const getZoomLevel = (radius: number | undefined): number => {
  if (!radius) return 8;
  if (radius >= 100) return 8;
  if (radius >= 30) return 9;
  if (radius >= 20) return 8;
  if (radius >= 10) return 9;
  return 8;
};

const PREFETCH_RADIUS_MILES = 25;
const BOUNDS_EPSILON = 0.001;

export default function SearchPageClient({
  listings: initialListings, center, locationString, isSignedIn, userId, user,
  tripId: initialTripId, sessionId: initialSessionId, tripData, hasLocationParams,
}: SearchPageClientProps) {
  const router = useRouter();

  const [listings, setListings] = useState<ListingAndImages[]>(initialListings);
  const [staleBounds, setStaleBounds] = useState<MapBounds | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<MapBounds | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Trip/session tracking
  const [currentTripId, setCurrentTripId] = useState<string | undefined>(initialTripId);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  const tripOrSessionRef = useRef<{ tripId?: string; sessionId?: string }>({
    tripId: initialTripId,
    sessionId: initialSessionId,
  });

  // Local state for favorites/dislikes
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Filters modal state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Map/layout state
  const [isSlideMapOpen, setIsSlideMapOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [zoomLevel] = useState(getZoomLevel(PREFETCH_RADIUS_MILES));
  const [currentMapCenter, setCurrentMapCenter] = useState(center);
  const lastFetchedBoundsRef = useRef<MapBounds | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  const mapResetRef = useRef<(() => void) | null>(null);
  const [calculatedHeight, setCalculatedHeight] = useState(0);

  const { columnCount, listingsWidth, shouldShowSideBySide, gridGap, isCalculated } =
    useListingsGridLayout(layoutContainerRef, { minMapWidth: 300 });

  useEffect(() => {
    setCurrentMapCenter(center);
  }, [center]);

  useEffect(() => {
    setListings(initialListings);
    lastFetchedBoundsRef.current = null;
    setStaleBounds(null);
    setVisibleBounds(null);
    setIsSearching(false);
  }, [initialListings]);

  // Load existing favorites/dislikes from DB on mount
  useEffect(() => {
    const loadExistingFavorites = async () => {
      if (initialSessionId) {
        const result = await pullGuestFavoritesFromDb(initialSessionId);
        if (result.success) {
          if (result.favoriteIds.length > 0) setFavIds(new Set(result.favoriteIds));
          if (result.dislikeIds.length > 0) setDislikedIds(new Set(result.dislikeIds));
        }
      }
    };
    loadExistingFavorites();
  }, [initialSessionId]);

  // Client-side setup + geolocation
  useEffect(() => {
    setIsClient(true);
    const updateLayout = () => {
      setIsDesktopView(window.innerWidth >= 768);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const filterDisplayHeight = window.innerWidth >= 768 ? 60 : 0;
        const height = window.innerHeight - rect.top - filterDisplayHeight;
        setCalculatedHeight(height);
        containerRef.current.style.minHeight = `${height}px`;
      }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);

    // Geolocation: if no location params were provided, try to detect user location
    if (!hasLocationParams && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = buildSearchUrl({ lat: latitude, lng: longitude });
          router.replace(url);
        },
        () => { /* geolocation denied or unavailable, keep Ogden default */ },
        { timeout: 5000 }
      );
    }

    return () => window.removeEventListener('resize', updateLayout);
  }, [hasLocationParams, router]);

  // Mobile map mount/unmount
  useEffect(() => {
    if (isSlideMapOpen) {
      setShouldRenderMap(true);
    } else {
      const timer = setTimeout(() => setShouldRenderMap(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [isSlideMapOpen]);

  // Lazily create a trip/session on first like/dislike
  const ensureTripOrSession = useCallback(async (): Promise<{ tripId?: string; sessionId?: string }> => {
    const current = tripOrSessionRef.current;
    if (current.tripId || current.sessionId) return current;

    const tripPayload = {
      locationString: locationString,
      latitude: currentMapCenter.lat,
      longitude: currentMapCenter.lng,
      startDate: tripData?.startDate ? new Date(tripData.startDate) : undefined,
      endDate: tripData?.endDate ? new Date(tripData.endDate) : undefined,
      numAdults: tripData?.numAdults ?? 1,
      numChildren: tripData?.numChildren ?? 0,
      numPets: tripData?.numPets ?? 0,
    };

    if (isSignedIn) {
      const response = await createTrip(tripPayload);
      if (response.success && response.trip) {
        const newId = response.trip.id;
        tripOrSessionRef.current = { tripId: newId };
        setCurrentTripId(newId);
        router.replace(buildSearchUrl({ tripId: newId }));
        return { tripId: newId };
      }
    } else {
      const response = await createGuestTrip(tripPayload);
      if (response.success && response.sessionId) {
        const newId = response.sessionId;
        const sessionData = GuestSessionService.createGuestSessionData(tripPayload, newId);
        GuestSessionService.storeSession(sessionData);
        tripOrSessionRef.current = { sessionId: newId };
        setCurrentSessionId(newId);
        router.replace(buildSearchUrl({ sessionId: newId }));
        return { sessionId: newId };
      }
    }
    return {};
  }, [isSignedIn, currentMapCenter, locationString, tripData, router]);

  // DB-persisting optimistic actions
  const optimisticLike = useCallback(async (listingId: string) => {
    setFavIds(prev => new Set([...Array.from(prev), listingId]));
    setDislikedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });

    const ids = await ensureTripOrSession();
    if (ids.tripId) {
      await optimisticFavorite(ids.tripId, listingId);
    } else if (ids.sessionId) {
      await guestOptimisticFavorite(ids.sessionId, listingId);
    }
  }, [ensureTripOrSession]);

  const optimisticDislike = useCallback(async (listingId: string) => {
    setDislikedIds(prev => new Set([...Array.from(prev), listingId]));
    setFavIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });

    const ids = await ensureTripOrSession();
    if (ids.tripId) {
      await optimisticDislikeDb(ids.tripId, listingId);
    } else if (ids.sessionId) {
      await guestOptimisticDislike(ids.sessionId, listingId);
    }
  }, [ensureTripOrSession]);

  const optimisticRemoveLike = useCallback(async (listingId: string) => {
    setFavIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });

    const current = tripOrSessionRef.current;
    if (current.tripId) {
      await optimisticRemoveFavorite(current.tripId, listingId);
    } else if (current.sessionId) {
      await guestOptimisticRemoveFavorite(current.sessionId, listingId);
    }
  }, []);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
    setDislikedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });

    const current = tripOrSessionRef.current;
    if (current.tripId) {
      await optimisticRemoveDislikeDb(current.tripId, listingId);
    } else if (current.sessionId) {
      await guestOptimisticRemoveDislike(current.sessionId, listingId);
    }
  }, []);

  const showAuthPrompt = useCallback(() => {
    if (isSignedIn) return;
    setShowAuthModal(true);
  }, [isSignedIn]);

  const boundsAreClose = useCallback((a: MapBounds, b: MapBounds) => {
    return (
      Math.abs(a.north - b.north) < BOUNDS_EPSILON &&
      Math.abs(a.south - b.south) < BOUNDS_EPSILON &&
      Math.abs(a.east - b.east) < BOUNDS_EPSILON &&
      Math.abs(a.west - b.west) < BOUNDS_EPSILON
    );
  }, []);

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    setVisibleBounds(bounds);
    if (!lastFetchedBoundsRef.current) {
      lastFetchedBoundsRef.current = bounds;
      return;
    }
    if (boundsAreClose(bounds, lastFetchedBoundsRef.current)) {
      setStaleBounds(null);
      return;
    }
    setStaleBounds(bounds);
  }, [boundsAreClose]);

  const searchThisArea = useCallback(async () => {
    const bounds = staleBounds;
    if (!bounds) return;
    setIsSearching(true);
    try {
      const results = await getListingsByBounds(bounds);
      setListings(results);
      lastFetchedBoundsRef.current = bounds;
      setStaleBounds(null);
    } catch (error) {
      console.error('Error fetching listings for bounds:', error);
    } finally {
      setIsSearching(false);
    }
  }, [staleBounds]);

  // Callback for navbar to communicate new trip/session IDs
  const handleSearchUpdate = useCallback((newTripId?: string, newSessionId?: string) => {
    if (newTripId) {
      tripOrSessionRef.current = { tripId: newTripId };
      setCurrentTripId(newTripId);
    }
    if (newSessionId) {
      tripOrSessionRef.current = { sessionId: newSessionId };
      setCurrentSessionId(newSessionId);
    }
  }, []);

  // Build the GuestTripContext shim
  const shimSession: GuestSession = useMemo(() => ({
    id: 'search-page',
    searchParams: {
      location: locationString,
      lat: currentMapCenter.lat,
      lng: currentMapCenter.lng,
      guests: { adults: 1, children: 0, pets: 0 },
    },
    pendingActions: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  }), [currentMapCenter, locationString]);

  const allListings = useMemo(() =>
    listings.map(l => ({ ...l, isActuallyAvailable: true })),
    [listings]
  );

  const isWithinBounds = (lat: number, lng: number, bounds: MapBounds) =>
    lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;

  const showListings = useMemo(() =>
    allListings
      .filter(l => !visibleBounds || isWithinBounds(l.latitude, l.longitude, visibleBounds))
      .filter(l => matchesFilters({ ...l, calculatedPrice: l.price }, filters, false, null)),
    [allListings, filters, visibleBounds]
  );

  const likedListings = useMemo(() => listings.filter(l => favIds.has(l.id)), [listings, favIds]);
  const dislikedListings = useMemo(() => listings.filter(l => dislikedIds.has(l.id)), [listings, dislikedIds]);

  const contextValue = useMemo(() => ({
    state: {
      session: shimSession,
      listings,
      allListings,
      swipeListings: allListings,
      showListings,
      swipeShowListings: showListings,
      viewedListings: [],
      likedListings,
      dislikedListings,
      requestedListings: [],
      matchedListings: [],
      isLoading: isSearching,
      lookup: { favIds, dislikedIds, requestedIds: new Set<string>(), matchIds: new Set<string>() },
      filters,
      filteredCount: allListings.length,
    },
    actions: {
      setViewedListings: () => {},
      setSession: () => {},
      setLookup: () => {},
      showAuthPrompt: () => showAuthPrompt(),
      updateFilter: (key: keyof FilterOptions, value: any) => setFilters(prev => ({ ...prev, [key]: value })),
      updateFilters: (newFilters: FilterOptions) => setFilters(newFilters),
      optimisticLike,
      optimisticDislike,
      optimisticRemoveLike,
      optimisticRemoveDislike,
    },
  }), [shimSession, listings, allListings, showListings, likedListings, dislikedListings, favIds, dislikedIds, filters, showAuthPrompt, optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike, isSearching]);

  // Custom snapshot for child components
  const customSnapshot = useMemo(() => ({
    isLiked: (id: string) => favIds.has(id),
    isDisliked: (id: string) => dislikedIds.has(id),
    isRequested: () => false,
    optimisticLike,
    optimisticDislike,
    optimisticRemoveLike,
    optimisticRemoveDislike,
  }), [favIds, dislikedIds, optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike]);

  // Map markers
  const mockTrip = useMemo(() => ({
    latitude: currentMapCenter.lat,
    longitude: currentMapCenter.lng,
    searchRadius: PREFETCH_RADIUS_MILES,
    startDate: undefined,
    endDate: undefined,
  }), [currentMapCenter]);

  const markers = useMemo(() =>
    showListings
      .filter(l => typeof l.latitude === 'number' && typeof l.longitude === 'number' && !isNaN(l.latitude) && !isNaN(l.longitude))
      .map(listing => {
        const calculatedPrice = calculateRent({ listing, trip: mockTrip } as any) || listing.price || 0;
        return {
          title: listing.title || '',
          lat: listing.latitude,
          lng: listing.longitude,
          listing: {
            ...listing,
            price: listing.price || calculatedPrice,
            calculatedPrice,
            isLiked: favIds.has(listing.id),
            isDisliked: dislikedIds.has(listing.id),
          },
          color: favIds.has(listing.id) ? 'liked' : dislikedIds.has(listing.id) ? 'disliked' : 'white',
        };
      }),
    [showListings, mockTrip, favIds, dislikedIds]
  );

  const formatHeight = () => `${Math.max(calculatedHeight, 500)}px`;

  return (
    <GuestTripContext.Provider value={contextValue}>
      <div className="flex flex-col h-screen">
        <SearchResultsNavbar
          userId={userId}
          user={user}
          isSignedIn={isSignedIn}
          locationString={locationString}
          tripId={currentTripId}
          sessionId={currentSessionId}
          currentCenter={currentMapCenter}
          tripData={tripData}
          onSearchUpdate={handleSearchUpdate}
        />

        {/* Main content */}
        <div ref={containerRef} className="flex flex-col flex-1 mx-auto w-full sm:px-2">
          <SearchFilterBar
            onFiltersClick={() => setIsFiltersOpen(true)}
            filters={filters}
            onRemoveFilter={(filter) => {
              setFilters(prev => {
                const arr = prev[filter.key];
                if (Array.isArray(arr)) {
                  return { ...prev, [filter.key]: (arr as string[]).filter(v => v !== filter.value) };
                }
                if (filter.key === 'furnished' || filter.key === 'unfurnished') {
                  return { ...prev, [filter.key]: false };
                }
                if (filter.key === 'minPrice' || filter.key === 'maxPrice') {
                  return { ...prev, [filter.key]: null };
                }
                if (filter.key === 'minBedrooms' || filter.key === 'minBathrooms') {
                  return { ...prev, [filter.key]: 0 };
                }
                return prev;
              });
            }}
            onSetAllFilters={() => setFilters({
              propertyTypes: ['singleFamily', 'apartment', 'townhouse', 'privateRoom'],
              minPrice: 500,
              maxPrice: 3000,
              minBedrooms: 2,
              minBeds: null,
              minBathrooms: 1,
              furnished: true,
              unfurnished: true,
              utilities: ['utilitiesIncluded', 'utilitiesNotIncluded'],
              pets: ['petsAllowed', 'petsNotAllowed'],
              searchRadius: 100,
              accessibility: ['wheelchairAccess', 'keylessEntry', 'carbonMonoxide', 'smokeDetector', 'security', 'fencedInYard', 'gatedEntry'],
              location: ['mountainView', 'cityView', 'waterfront', 'waterView'],
              parking: ['offStreetParking', 'evCharging', 'garageParking'],
              kitchen: ['kitchenEssentials', 'garbageDisposal', 'dishwasher', 'fridge', 'oven'],
              basics: ['airConditioner', 'heater', 'wifi', 'dedicatedWorkspace'],
              luxury: ['sauna', 'gym', 'sunroom', 'balcony', 'pool', 'hotTub', 'fireplace'],
              laundry: ['washerInUnit', 'washerInComplex'],
            })}
          />
          <div ref={layoutContainerRef} className="flex flex-col md:flex-row justify-start md:justify-center flex-1">
            {/* Grid */}
            {!isFullscreen && (
              <div className="w-full md:w-2/3 lg:w-1/2 pr-4 relative">

                <GuestSearchListingsGrid
                  listings={showListings}
                  height={formatHeight()}
                  customSnapshot={customSnapshot}
                  columnCount={isDesktopView ? 2 : undefined}
                  gridGap={16}
                  tripId={currentTripId}
                />
              </div>
            )}

            {/* Mobile map button */}
            {isClient && !isDesktopView && (
              <Button
                onClick={() => setIsSlideMapOpen(true)}
                className="fixed w-16 h-16 p-0 rounded-full bg-secondaryBrand text-background z-50 flex items-center justify-center overflow-visible"
                style={{ bottom: '4dvh', right: '1rem' }}
              >
                <Map className="w-8 h-8" strokeWidth={2} style={{ width: '32px', height: '32px' }} />
              </Button>
            )}

            {/* Desktop map */}
            {isClient && isDesktopView && (
              <div
                className={`relative ${isFullscreen ? 'w-full' : 'w-full md:w-1/3 lg:w-1/2'}`}
                style={{ minWidth: 0 }}
              >
                <GuestSearchMap
                  center={[center.lng, center.lat]}
                  zoom={zoomLevel}
                  height={formatHeight()}
                  markers={markers as any}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                  markerStyles={MARKER_STYLES}
                  selectedMarkerId={clickedMarkerId}
                  onCenterChanged={(lng, lat) => setCurrentMapCenter({ lat, lng })}
                  onBoundsChanged={handleBoundsChanged}
                  onClickedMarkerChange={setClickedMarkerId}
                  onResetRequest={(resetFn) => { mapResetRef.current = resetFn; }}
                  customSnapshot={customSnapshot}
                  tripId={currentTripId}
                />
                {(staleBounds || isSearching) && (
                  <Button
                    onClick={searchThisArea}
                    disabled={isSearching}
                    className="absolute left-1/2 top-3 z-20 -translate-x-1/2 bg-white/90 text-gray-900 border border-gray-200 shadow-sm px-5 py-2.5 rounded-full hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                  >
                    {isSearching ? 'Loading...' : 'Search this area'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile slide-up map */}
        {isClient && !isDesktopView && (
          <AnimatePresence>
            {isSlideMapOpen && (
              <motion.div
                className="fixed top-0 left-0 w-full h-full bg-white z-50"
                variants={slideUpVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <GuestSearchMapMobile
                  center={[center.lng, center.lat]}
                  zoom={zoomLevel}
                  height="100vh"
                  markers={markers as any}
                  markerStyles={MARKER_STYLES}
                  onClose={() => setIsSlideMapOpen(false)}
                  onCenterChanged={(lng, lat) => setCurrentMapCenter({ lat, lng })}
                  onBoundsChanged={handleBoundsChanged}
                  customSnapshot={{
                    ...customSnapshot,
                    favoriteIds: favIds,
                    dislikedIds,
                    requestedIds: new Set<string>(),
                    matchIds: new Set<string>(),
                  }}
                />
                {(staleBounds || isSearching) && (
                  <Button
                    onClick={searchThisArea}
                    disabled={isSearching}
                    className="absolute left-1/2 top-3 z-20 -translate-x-1/2 bg-white/90 text-gray-900 border border-gray-200 shadow-sm px-5 py-2.5 rounded-full hover:bg-gray-100 hover:text-gray-900 hover:shadow-md"
                  >
                    {isSearching ? 'Loading...' : 'Search this area'}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <GuestAuthModal
        isOpen={showAuthModal}
        onOpenChange={setShowAuthModal}
      />

      <SearchFiltersModal
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onApplyFilters={setFilters}
        listings={allListings}
        totalCount={allListings.length}
      />
    </GuestTripContext.Provider>
  );
}
