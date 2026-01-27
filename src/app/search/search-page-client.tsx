'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ListingAndImages } from '@/types';
import { GuestTripContext } from '@/contexts/guest-trip-context-provider';
import { GuestSession } from '@/utils/guest-session';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { FilterOptions, matchesFilters } from '@/lib/listing-filters';
import GuestSearchListingsGrid from '@/app/guest/rent/searches/components/guest-search-listings-grid';
import GuestSearchMap from '@/app/guest/rent/searches/components/guest-search-map';
import GuestSearchMapMobile from '@/app/guest/rent/searches/components/guest-search-map-mobile';
import { GuestAuthModal } from '@/components/guest-auth-modal';
import { useListingsGridLayout } from '@/hooks/useListingsGridLayout';
import { calculateRent } from '@/lib/calculate-rent';
import { Button } from '@/components/ui/button';
import { Map, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchPageClientProps {
  listings: ListingAndImages[];
  center: { lat: number; lng: number };
  locationString: string;
  isSignedIn: boolean;
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
  if (!radius) return 6;
  if (radius >= 100) return 6;
  if (radius >= 30) return 7;
  if (radius >= 20) return 8;
  if (radius >= 10) return 9;
  return 8;
};

export default function SearchPageClient({ listings, center, locationString, isSignedIn }: SearchPageClientProps) {
  const router = useRouter();

  // Local state for favorites/dislikes (visual-only, no DB persistence)
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Map/layout state
  const [isSlideMapOpen, setIsSlideMapOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [zoomLevel] = useState(getZoomLevel(100));
  const [currentMapCenter, setCurrentMapCenter] = useState(center);

  const containerRef = useRef<HTMLDivElement>(null);
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  const mapResetRef = useRef<(() => void) | null>(null);
  const [calculatedHeight, setCalculatedHeight] = useState(0);

  const { columnCount, listingsWidth, shouldShowSideBySide, gridGap, isCalculated } =
    useListingsGridLayout(layoutContainerRef, { minMapWidth: 300 });

  // Client-side setup
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
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Mobile map mount/unmount
  useEffect(() => {
    if (isSlideMapOpen) {
      setShouldRenderMap(true);
    } else {
      const timer = setTimeout(() => setShouldRenderMap(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [isSlideMapOpen]);

  // Optimistic actions (local state only)
  const optimisticLike = useCallback(async (listingId: string) => {
    setFavIds(prev => new Set([...Array.from(prev), listingId]));
    setDislikedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
  }, []);

  const optimisticDislike = useCallback(async (listingId: string) => {
    setDislikedIds(prev => new Set([...Array.from(prev), listingId]));
    setFavIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
  }, []);

  const optimisticRemoveLike = useCallback(async (listingId: string) => {
    setFavIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
  }, []);

  const optimisticRemoveDislike = useCallback(async (listingId: string) => {
    setDislikedIds(prev => { const next = new Set(prev); next.delete(listingId); return next; });
  }, []);

  const showAuthPrompt = useCallback(() => {
    if (isSignedIn) return;
    setShowAuthModal(true);
  }, [isSignedIn]);

  // Build the GuestTripContext shim
  const shimSession: GuestSession = useMemo(() => ({
    id: 'search-page',
    searchParams: {
      location: locationString,
      lat: center.lat,
      lng: center.lng,
      guests: { adults: 1, children: 0, pets: 0 },
    },
    pendingActions: [],
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  }), [center, locationString]);

  const allListings = useMemo(() =>
    listings.map(l => ({ ...l, isActuallyAvailable: true })),
    [listings]
  );

  const showListings = useMemo(() =>
    allListings.filter(l => matchesFilters({ ...l, calculatedPrice: l.price }, filters, false, null)),
    [allListings, filters]
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
      isLoading: false,
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
  }), [shimSession, listings, allListings, showListings, likedListings, dislikedListings, favIds, dislikedIds, filters, showAuthPrompt, optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike]);

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
    latitude: center.lat,
    longitude: center.lng,
    searchRadius: 100,
    startDate: undefined,
    endDate: undefined,
  }), [center]);

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
        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-medium text-gray-800">
            Monthly rentals in {locationString}
          </h1>
          <span className="text-sm text-gray-500">
            {showListings.length} listing{showListings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Main content */}
        <div ref={containerRef} className="flex flex-col flex-1 mx-auto w-full sm:px-2">
          <div ref={layoutContainerRef} className="flex flex-col md:flex-row justify-start md:justify-center flex-1">
            {/* Grid */}
            {!isFullscreen && (
              <div
                className="w-full pr-4"
                style={isDesktopView && isCalculated && shouldShowSideBySide
                  ? { width: `${listingsWidth}px`, flexShrink: 0 }
                  : undefined
                }
              >
                <GuestSearchListingsGrid
                  listings={showListings}
                  height={formatHeight()}
                  customSnapshot={customSnapshot}
                  selectedListingId={clickedMarkerId}
                  columnCount={isDesktopView ? columnCount : undefined}
                  gridGap={gridGap}
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
                className="mt-0"
                style={isFullscreen ? { width: '100%' } : { flexGrow: 1, minWidth: 0 }}
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
                  onClickedMarkerChange={setClickedMarkerId}
                  onResetRequest={(resetFn) => { mapResetRef.current = resetFn; }}
                  customSnapshot={customSnapshot}
                />
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
                  customSnapshot={{
                    ...customSnapshot,
                    favoriteIds: favIds,
                    dislikedIds,
                    requestedIds: new Set<string>(),
                    matchIds: new Set<string>(),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <GuestAuthModal
        isOpen={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </GuestTripContext.Provider>
  );
}
