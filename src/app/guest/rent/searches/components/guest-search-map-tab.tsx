'use client'

import React, { useState, Dispatch, SetStateAction, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGuestTripContext } from '@/contexts/guest-trip-context-provider';
import GuestSearchListingsGrid from './guest-search-listings-grid';
import GuestSearchMap from './guest-search-map';
import GuestSearchMapMobile from './guest-search-map-mobile';
import GuestSelectedListingDetails from './guest-selected-listing-details';
import { ListingAndImages } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateRent } from '@/lib/calculate-rent';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { X } from 'lucide-react';
import { GuestFilterDisplay } from './guest-filter-display';
import GuestFilterOptionsDialog from './guest-filter-options-dialog';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
  listing: ListingAndImages;
}

interface GuestMapViewProps {
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

const slideUpVariants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: { type: "tween", duration: 0.8, ease: "easeInOut" }
  },
  exit: {
    y: "100%",
    transition: { type: "tween", duration: 0.6, ease: "easeInOut" }
  }
};

// Marker style configuration
const MARKER_STYLES = {
  SIMPLE_MARKER_THRESHOLD: 30,
  FULLSCREEN_SIMPLE_MARKER_THRESHOLD: 60,

  MARKER_COLORS: {
    DEFAULT: {
      primary: '#0B6E6E',
      secondary: '#FFFFFF'
    },
    HOVER: {
      primary: '#fb8c00',
      secondary: '#FFFFFF'
    },
    LIKED: {
      primary: '#000000',
      secondary: '#5c9ac5'
    },
    DISLIKED: {
      primary: '#FFFFFF',
      secondary: '#404040'
    }
  },

  PRICE_BUBBLE_COLORS: {
    DEFAULT: {
      background: '#FFFFFF',
      text: '#1f2937',
      border: 'grey'
    },
    HOVER: {
      background: '#0B6E6E',
      text: '#FFFFFF',
      border: '#0B6E6E'
    },
    DISLIKED: {
      background: '#1f2937',
      text: '#FFFFFF',
      border: '#FFFFFF'
    }
  },

  HEART_ICON: {
    color: '#FF6B6B',
    simpleMarkerTransform: 'translate(20, 4)',
    simpleMarkerScale: 'scale(1.5)',
    priceBubblePosition: {
      top: '-8px',
      right: '-8px'
    },
    size: '12px',
    withBackground: true,
    backgroundCircle: {
      radius: '6',
      fill: 'white',
      stroke: '#404040',
      strokeWidth: '0.5'
    }
  },

  Z_INDEX: {
    HOVER: '10',
    SELECTED: '5',
    LIKED: '3',
    DEFAULT: '1',
    DISLIKED: '0'
  }
};

// Get zoom level based on radius
const getZoomLevel = (radius: number | undefined): number => {
  if (!radius) return 6;

  if (radius >= 100) return 6;
  if (radius >= 30) return 7;
  if (radius >= 20) return 8;
  if (radius >= 10) return 9;
  return 8;
};

const GuestMapView: React.FC<GuestMapViewProps> = ({ setIsFilterOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, actions } = useGuestTripContext();
  const { session, allListings, listings, viewedListings, lookup, showListings } = state;
  const { favIds, dislikedIds } = lookup;
  const { showAuthPrompt } = actions;

  // Create mock trip object from session for compatibility
  const mockTrip = useMemo(() => {
    if (!session) return null;
    return {
      latitude: session.searchParams.lat,
      longitude: session.searchParams.lng,
      searchRadius: 100,
      startDate: session.searchParams.startDate,
      endDate: session.searchParams.endDate,
    };
  }, [session]);

  // Get the visible listings store state
  const visibleListingIds = useVisibleListingsStore((state) => state.visibleListingIds);
  const setVisibleListingIds = useVisibleListingsStore((state) => state.setVisibleListingIds);

  // State management
  const [isSlideMapOpen, setIsSlideMapOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(getZoomLevel(100));
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Create a ref to pass the reset function to the map
  const mapResetRef = useRef<(() => void) | null>(null);

  // Height calculation state
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsDesktopView(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    const setHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newStartY = containerRect.top;
        const newViewportHeight = window.innerHeight;
        const filterDisplayHeight = isDesktopView ? 115 : 0;
        const newCalculatedHeight = newViewportHeight - newStartY - filterDisplayHeight;
        setStartY(newStartY);
        setViewportHeight(newViewportHeight);
        setCalculatedHeight(newCalculatedHeight);
        setCurrentComponentHeight(containerRef.current.offsetHeight);
        containerRef.current.style.minHeight = `${newCalculatedHeight}px`;
      }
    };

    setHeight();
    window.addEventListener('resize', setHeight);

    return () => {
      window.removeEventListener('resize', setHeight);
    };
  }, [isDesktopView]);

  // Handle map mounting/unmounting with delay
  useEffect(() => {
    if (isSlideMapOpen) {
      setShouldRenderMap(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRenderMap(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isSlideMapOpen]);

  // Use filtered listings for map view (includes liked/disliked that match filters)
  const displayListings = useMemo(() => {
    return showListings || [];
  }, [showListings]);

  // Keep track of the current map center
  const [currentMapCenter, setCurrentMapCenter] = useState({
    lat: mockTrip?.latitude || 0,
    lng: mockTrip?.longitude || 0
  });

  // Update center when session changes
  useEffect(() => {
    if (mockTrip?.latitude !== undefined && mockTrip?.longitude !== undefined) {
      const isNewLocation =
        Math.abs((currentMapCenter.lat || 0) - mockTrip.latitude) > 0.001 ||
        Math.abs((currentMapCenter.lng || 0) - mockTrip.longitude) > 0.001;

      if (isNewLocation) {
        setCurrentMapCenter({
          lat: mockTrip.latitude,
          lng: mockTrip.longitude
        });
      }
    }
  }, [mockTrip?.latitude, mockTrip?.longitude]);

  // Reset map center and zoom when user changes filter settings
  useEffect(() => {
    // Call the reset function if it exists
    if (mapResetRef.current && mockTrip?.latitude !== undefined && mockTrip?.longitude !== undefined) {
      mapResetRef.current();
    }
  }, [
    // Watch filter values that users can change
    state.filters?.minPrice,
    state.filters?.maxPrice,
    state.filters?.minBedrooms,
    state.filters?.minBeds,
    state.filters?.minBathrooms,
    state.filters?.furnished,
    state.filters?.unfurnished,
    state.filters?.searchRadius,
    // Watch array lengths to detect changes
    state.filters?.propertyTypes?.length,
    state.filters?.utilities?.length,
    state.filters?.pets?.length,
    state.filters?.accessibility?.length,
    state.filters?.location?.length,
    state.filters?.parking?.length,
    state.filters?.kitchen?.length,
    state.filters?.basics?.length,
    state.filters?.luxury?.length,
    state.filters?.laundry?.length
  ]);

  const getListingStatus = (listing: ListingAndImages) => {
    if (favIds.has(listing.id)) return 'liked';
    if (dislikedIds.has(listing.id)) return 'disliked';
    return 'white';
  };

  // Create markers from display listings
  const markers: MapMarker[] = useMemo(() => {
    return displayListings
      .filter(listing => {
        return typeof listing.latitude === 'number' &&
               typeof listing.longitude === 'number' &&
               !isNaN(listing.latitude) &&
               !isNaN(listing.longitude);
      })
      .map((listing) => {
        const originalPrice = listing.shortestLeasePrice || listing.price || 0;
        const calculatedPrice = mockTrip ? calculateRent({ listing, trip: mockTrip }) : (listing.price || originalPrice);

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
          color: getListingStatus(listing)
        };
      });
  }, [displayListings, mockTrip, favIds, dislikedIds]);

  const mapCenter = { lat: currentMapCenter.lat, lng: currentMapCenter.lng };

  const handleTabChange = () => {
    // For guests, show auth prompt when trying to view favorites
    showAuthPrompt('like');
  };

  // Helper functions
  const hasListings = () => displayListings.length > 0;
  const hasNoListingsAtAll = () => listings.length === 0;
  const isSingleListingSelected = () => visibleListingIds && visibleListingIds.length === 1 && clickedMarkerId !== null;
  const getSelectedListing = () => displayListings.find(listing => listing.id === visibleListingIds?.[0]);
  const formatHeight = () => typeof calculatedHeight === 'number' ? `${calculatedHeight}px` : calculatedHeight;

  // Rendering helper functions
  const renderSelectedListingDetails = () => {
    const selectedListing = getSelectedListing();
    if (!selectedListing) return null;

    return (
      <GuestSelectedListingDetails
        listing={selectedListing}
        customSnapshot={{
          // Real snapshot for guest likes/dislikes with database persistence
          isLiked: (id: string) => favIds.has(id),
          isDisliked: (id: string) => dislikedIds.has(id),
          isRequested: () => false,
          optimisticLike: actions.optimisticLike,
          optimisticDislike: actions.optimisticDislike,
          optimisticRemoveLike: actions.optimisticRemoveLike,
          optimisticRemoveDislike: actions.optimisticRemoveDislike,
        }}
        height={formatHeight()}
      />
    );
  };

  const renderListingsGrid = () => (
    <GuestSearchListingsGrid
      listings={displayListings}
      height={formatHeight()}
      customSnapshot={{
        // Real snapshot for guest likes/dislikes with database persistence
        isLiked: (id: string) => state.lookup.favIds.has(id),
        isDisliked: (id: string) => state.lookup.dislikedIds.has(id),
        isRequested: () => false, // Guests can't apply yet
        optimisticLike: actions.optimisticLike,
        optimisticDislike: actions.optimisticDislike,
        optimisticRemoveLike: actions.optimisticRemoveLike,
        optimisticRemoveDislike: actions.optimisticRemoveDislike,
      }}
      selectedListingId={clickedMarkerId}
    />
  );

  const renderNoListingsMessage = () => (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <img
        src="/search-flow/empty-states/empty-listings.png"
        alt="No listings available"
        className="w-32 h-32 mb-4 opacity-60"
      />
      <p className="text-gray-600 text-center">
        Sorry, we couldn&apos;t find any listings in {session?.searchParams.location || 'this area'} right now.
        <br />
        Please try different dates or a different location.
      </p>
      <div className="flex gap-3 mt-4">
        <BrandButton href="/sign-in">
          Sign In for More Options
        </BrandButton>
        <BrandButton variant="outline" href="/sign-up">
          Create Account
        </BrandButton>
      </div>
    </div>
  );

  const renderSelectedListingFilterDisplay = () => (
    <div className="w-full space-y-3 mb-4 hidden md:block">
      <div className="flex w-full items-center justify-start">
        <div className="text-sm text-gray-600">
          1 Result
        </div>
      </div>

      <div className="flex w-full items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 rounded-full border border-blue-300 text-blue-700 text-sm">
            <span className="font-medium text-blue-700 text-sm">
              Showing selected listing
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setVisibleListingIds(null);
            setClickedMarkerId(null);
          }}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
        >
          Clear filter
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderListingsContent = () => {
    if (!hasListings()) {
      return renderNoListingsMessage();
    }

    if (isSingleListingSelected()) {
      return renderSelectedListingDetails();
    }

    return renderListingsGrid();
  };

  // Don't render until we have session data
  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-900"></div>
      </div>
    );
  }

  return (
    <>
      <GuestFilterOptionsDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        className="hidden"
      />
      <div ref={containerRef} className="flex flex-col mx-auto w-full sm:px-2">
        {isSingleListingSelected() ?
          renderSelectedListingFilterDisplay() :
          <GuestFilterDisplay onOpenFilter={() => setIsFilterDialogOpen(true)} className="hidden md:block" />
        }
        <div className="flex flex-col md:flex-row justify-start md:justify-center">
          {/* Grid container - hide when fullscreen */}
          {!isFullscreen && (
            <div className="w-full md:w-3/5 md:pr-4">
              {renderListingsContent()}
            </div>
          )}

          {/* Mobile-only Map button */}
          {isClient && !isDesktopView && (
            <Button
              onClick={() => setIsSlideMapOpen(true)}
              className="fixed w-16 h-16 p-0 rounded-full bg-secondaryBrand text-background z-50 flex items-center justify-center overflow-visible"
              style={{
                bottom: '4dvh',
                right: '1rem'
              }}
            >
              <Map className="w-8 h-8" strokeWidth={2} style={{ width: '32px', height: '32px' }} />
            </Button>
          )}

          {/* Map container for Desktop */}
          {isClient && isDesktopView && (
            <div className={`w-full ${isFullscreen ? 'md:w-full' : 'md:w-2/5'} mt-4 md:mt-0`}>
              <GuestSearchMap
                center={[mockTrip?.longitude || mapCenter.lng, mockTrip?.latitude || mapCenter.lat]}
                zoom={zoomLevel}
                height={typeof calculatedHeight === 'number' ? `${calculatedHeight}px` : calculatedHeight}
                markers={markers}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                markerStyles={MARKER_STYLES}
                selectedMarkerId={clickedMarkerId}
                onCenterChanged={(lng, lat) => {
                  setCurrentMapCenter({ lat, lng });
                }}
                onClickedMarkerChange={setClickedMarkerId}
                onResetRequest={(resetFn) => {
                  mapResetRef.current = resetFn;
                }}
                customSnapshot={{
                  // Real snapshot for guest likes/dislikes with database persistence
                  isLiked: (id: string) => favIds.has(id),
                  isDisliked: (id: string) => dislikedIds.has(id),
                  isRequested: () => false,
                  optimisticLike: actions.optimisticLike,
                  optimisticDislike: actions.optimisticDislike,
                  optimisticRemoveLike: actions.optimisticRemoveLike,
                  optimisticRemoveDislike: actions.optimisticRemoveDislike,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Up Map Overlay */}
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
                center={[mockTrip?.longitude || mapCenter.lng, mockTrip?.latitude || mapCenter.lat]}
                zoom={zoomLevel}
                height="100vh"
                markers={markers}
                markerStyles={MARKER_STYLES}
                onClose={() => setIsSlideMapOpen(false)}
                onCenterChanged={(lng, lat) => {
                  setCurrentMapCenter({ lat, lng });
                }}
                customSnapshot={{
                  // Real snapshot for guest likes/dislikes with database persistence
                  isLiked: (id: string) => favIds.has(id),
                  isDisliked: (id: string) => dislikedIds.has(id),
                  isRequested: () => false,
                  optimisticLike: actions.optimisticLike,
                  optimisticDislike: actions.optimisticDislike,
                  optimisticRemoveLike: actions.optimisticRemoveLike,
                  optimisticRemoveDislike: actions.optimisticRemoveDislike,
                  favoriteIds: favIds,
                  dislikedIds: dislikedIds,
                  requestedIds: new Set(),
                  matchIds: new Set(),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default GuestMapView;