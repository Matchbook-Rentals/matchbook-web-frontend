import React, { useState, Dispatch, SetStateAction, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';
import SearchMapMobile from '../(components)/search-map-mobile';
import SelectedListingDetails from '../(components)/selected-listing-details';
import { ListingAndImages } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapViewIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';
import { calculateRent } from '@/lib/calculate-rent';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { X } from 'lucide-react';
import { FilterDisplay } from '../(components)/filter-display';
import FilterOptionsDialog from './filter-options-dialog';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
  listing: ListingAndImages;
}

interface MapViewProps {
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
  // Threshold for switching to simple markers when there are too many listings
  SIMPLE_MARKER_THRESHOLD: 30,
  // Threshold for fullscreen mode (should be 2x the regular threshold)
  FULLSCREEN_SIMPLE_MARKER_THRESHOLD: 60,
  
  // Simple marker color configuration (for >30 listings)
  MARKER_COLORS: {
    DEFAULT: {
      primary: '#404040',   // Charcoal outer circle
      secondary: '#FFFFFF'  // White inner circle
    },
    HOVER: {
      primary: '#4caf50',   // Pink outer circle
      secondary: '#FFFFFF'  // White inner circle
    },
    LIKED: {
      primary: '#000000',   // Black outer circle
      secondary: '#5c9ac5'  // Blue inner circle
    },
    DISLIKED: {
      primary: '#FFFFFF',   // White outer circle
      secondary: '#404040'  // Charcoal inner circle
    }
  },
  
  // Price bubble marker color configuration (for ≤30 listings)
  PRICE_BUBBLE_COLORS: {
    DEFAULT: {
      background: '#FFFFFF',
      text: '#404040',
      border: '#404040'
    },
    HOVER: {
      background: '#4caf50',
      text: '#FFFFFF',
      border: '#4caf50'
    },
    DISLIKED: {
      background: '#404040',
      text: '#FFFFFF',
      border: '#FFFFFF'
    }
  },
  
  // Heart icon configuration
  HEART_ICON: {
    color: '#FF6B6B',
    simpleMarkerTransform: 'translate(20, 4)',
    simpleMarkerScale: 'scale(1.5)',
    priceBubblePosition: {
      top: '-8px',
      right: '-8px'
    },
    size: '12px',
    withBackground: true, // Whether to show white background circle
    backgroundCircle: {
      radius: '6',
      fill: 'white',
      stroke: '#404040',
      strokeWidth: '0.5'
    }
  },
  
  // Z-index configuration for marker layering
  Z_INDEX: {
    HOVER: '10',        // Highest priority - currently hovered markers
    SELECTED: '5',      // Selected marker in fullscreen mode
    LIKED: '3',         // Liked/favorited markers
    DEFAULT: '1',       // Default markers
    DISLIKED: '0'       // Lowest priority - disliked markers
  }
};

// Add this function to determine zoom level based on radius
const getZoomLevel = (radius: number | undefined): number => {
  if (!radius) return 6; // Default zoom if radius is undefined

  if (radius >= 100) return 5;
  if (radius >= 65) return 6;
  if (radius >= 40) return 7;
  if (radius >= 20) return 8;
  return 8; // Default for anything less than 20
};

const MapView: React.FC<MapViewProps> = ({ setIsFilterOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useTripContext();
  const { showListings, likedListings, trip, filters, lookup } = state; // Destructure filters & lookup
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState<string | number>('calc(100vh - 80px)');
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

  // Use the new snapshot hook for stable listings data
  const listingsSnapshot = useListingsSnapshot();
  const listings = listingsSnapshot.listings;
  
  // Get the visible listings store state
  const visibleListingIds = useVisibleListingsStore((state) => state.visibleListingIds);
  const setVisibleListingIds = useVisibleListingsStore((state) => state.setVisibleListingIds);
  
  // Remove the complex original listings tracking - no longer needed
  
  // Use the listings snapshot directly without overriding functions
  const enhancedSnapshot = listingsSnapshot;

  // New state to control the mobile slide-map overlay
  const [isSlideMapOpen, setIsSlideMapOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  
  // State to control map fullscreen view
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isClient, setIsClient] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);
  // State to track clicked marker ID
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);

  // New state for zoom level based on trip.searchRadius
  const [zoomLevel, setZoomLevel] = useState(getZoomLevel(trip?.searchRadius || 50));

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsDesktopView(window.innerWidth >= 768); // Tailwind's 'md' breakpoint
    };

    checkScreenSize(); // Initial check
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
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
        const newCalculatedHeight = newViewportHeight - newStartY;
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
  }, []);

  // Handle map mounting/unmounting with delay
  useEffect(() => {
    if (isSlideMapOpen) {
      setShouldRenderMap(true);
    } else {
      // Delay unmounting for 300ms (matching the slide transition)
      const timer = setTimeout(() => {
        setShouldRenderMap(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [isSlideMapOpen]);

  // Combine liked listings at the top with remaining showListings
  const displayListings = useMemo(() => {
    // Create a Set of liked listing IDs for efficient lookup
    const likedIds = new Set(likedListings.map(l => l.id));
    
    // Filter showListings to exclude already liked ones to avoid duplicates
    const nonLikedShowListings = showListings.filter(listing => !likedIds.has(listing.id));
    
    // Return liked listings first, then the rest
    return [...likedListings, ...nonLikedShowListings];
  }, [showListings, likedListings]);

  // Effect to set initial map center and zoom ONLY when trip location changes
  // This prevents the map from jumping back when user pans/zooms
  useEffect(() => {
    // Only update center if this is truly a location change (not just a filter change)
    if (trip?.latitude !== undefined && trip?.longitude !== undefined) {
      // Check if this is actually a different location than what we already have
      const isNewLocation = 
        Math.abs((currentMapCenter.lat || 0) - trip.latitude) > 0.001 || 
        Math.abs((currentMapCenter.lng || 0) - trip.longitude) > 0.001;
      
      if (isNewLocation) {
        setCurrentMapCenter({ 
          lat: trip.latitude, 
          lng: trip.longitude 
        });
      }
    } else if (currentMapCenter.lat === 0 && currentMapCenter.lng === 0) {
      // Only set fallback if we don't have any center yet
      setCurrentMapCenter({ lat: 0, lng: 0 }); 
    }

  }, [trip?.latitude, trip?.longitude]); // Removed filters and displayListings from dependencies
  
  // Separate effect for zoom level updates based on search radius
  useEffect(() => {
    if (trip?.searchRadius !== undefined) {
      setZoomLevel(getZoomLevel(trip.searchRadius));
    }
  }, [trip?.searchRadius]);
  
  // Create a ref to pass the reset function to the map
  const mapResetRef = useRef<(() => void) | null>(null);
  
  // Reset map center and zoom when user changes filter settings
  useEffect(() => {
    // Call the reset function if it exists
    if (mapResetRef.current && trip?.latitude !== undefined && trip?.longitude !== undefined) {
      mapResetRef.current();
    }
  }, [
    // Only watch actual filter values that users can change
    filters?.minPrice,
    filters?.maxPrice,
    filters?.minBedrooms,
    filters?.minBeds,
    filters?.minBathrooms,
    filters?.furnished,
    filters?.unfurnished,
    filters?.searchRadius,
    // Watch array lengths to detect changes (not the arrays themselves to avoid reference issues)
    filters?.propertyTypes?.length,
    filters?.utilities?.length,
    filters?.pets?.length,
    filters?.accessibility?.length,
    filters?.location?.length,
    filters?.parking?.length,
    filters?.kitchen?.length,
    filters?.basics?.length,
    filters?.luxury?.length,
    filters?.laundry?.length
  ]);

  const getListingStatus = (listing: ListingAndImages) => {
    if (listingsSnapshot.isRequested(listing.id)) {
      return '#5c9ac5'; // Use the specific blue color
    }
    if (listingsSnapshot.isDisliked(listing.id)) {
      return 'black';
    }
    if (listingsSnapshot.isLiked(listing.id)) {
      return '#5c9ac5'; // Blue with white text for liked listings
    }
    return 'white'; // Default is white with charcoal border and text
  };

  const listingsWithStatus = listings.map((listing) => ({
    ...listing,
    status: getListingStatus(listing)
  }));

  // Calculate center once and don't change it unnecessarily
  const [initialCenter] = useState({ 
    lat: trip?.latitude || 0,
    lng: trip?.longitude || 0
  });
  
  // Keep track of the current map center separate from the initial center
  const [currentMapCenter, setCurrentMapCenter] = useState(initialCenter);
  
  // Extract just the IDs we need for marker generation to avoid unnecessary rebuilds
  const favoriteIdsArray = useMemo(() => Array.from(enhancedSnapshot.favoriteIds), [enhancedSnapshot.favoriteIds]);
  const dislikedIdsArray = useMemo(() => Array.from(enhancedSnapshot.dislikedIds), [enhancedSnapshot.dislikedIds]);
  
  // Create markers from the display listings - using useMemo to only rebuild when needed
  const markers: MapMarker[] = useMemo(() => {
    // Use favIds and dislikedIds from TripContext lookup as primary
    const contextFavIds = lookup.favIds;
    const contextDislikedIds = lookup.dislikedIds;

    return displayListings.map((listing) => {
      // Prioritize context's favIds, then snapshot's favoriteIds
      const isLikedByContext = contextFavIds.has(listing.id);
      const isLikedBySnapshot = favoriteIdsArray.includes(listing.id); // favoriteIdsArray is from listingsSnapshot.favoriteIds
      const isLiked = isLikedByContext || isLikedBySnapshot;
      
      // Prioritize context's dislikedIds, then snapshot's dislikedIds
      // Ensure a disliked listing isn't also marked as liked
      const isDislikedByContext = contextDislikedIds.has(listing.id);
      const isDislikedBySnapshot = dislikedIdsArray.includes(listing.id); // dislikedIdsArray is from listingsSnapshot.dislikedIds
      const isDisliked = (isDislikedByContext || isDislikedBySnapshot) && !isLiked;
      
      // Ensure price data persists - preserve both original price and calculated price
      const originalPrice = listing.shortestLeasePrice || listing.price || 0;
      const calculatedPrice = trip ? calculateRent({ listing, trip }) : (listing.price || originalPrice);
      
      
      return {
        title: listing.title,
        lat: listing.latitude,
        lng: listing.longitude,
        listing: {
          ...listing,
          price: listing.price || calculatedPrice, // Preserve current price or use calculated
          calculatedPrice, // Always ensure calculatedPrice is available
          isLiked,
          isDisliked,
          customSnapshot: enhancedSnapshot // Attach the enhanced snapshot to each marker
        },
        color: getListingStatus(listing)
      };
    });
  }, [displayListings, lookup, favoriteIdsArray, dislikedIdsArray, getListingStatus, trip, enhancedSnapshot]);

  // Use the current map center for the map, fallback to initial center
  const mapCenter = { lat: currentMapCenter.lat, lng: currentMapCenter.lng };

  const handleTabChange = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'favorites');
    const url = `${pathname}?${params.toString()}`;
    router.push(url);
  };

  // Calculate the number of liked and filtered out listings
  const numFavorites = likedListings.length;
  const numFilteredOut = listings.length - likedListings.length;

  return (
    <>
      <FilterOptionsDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        className="md:hidden"
      />
      <div ref={containerRef} className="flex flex-col mx-auto w-full sm:px-2">
        <FilterDisplay onOpenFilter={() => setIsFilterDialogOpen(true)} className="hidden md:block" />
        <div className="flex flex-col md:flex-row justify-start md:justify-center">
          {/* Grid container - hide when fullscreen */}
          {!isFullscreen && (
            <div className="w-full md:w-3/5 md:pr-4">
              {/* Show indicator when filtering to a single listing */}
            {visibleListingIds && visibleListingIds.length === 1 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  Showing selected listing only
                </span>
                <button
                  onClick={() => {
                    setVisibleListingIds(null);
                    // Also clear the clicked marker to remove the highlight
                    setClickedMarkerId(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                >
                  Clear filter
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {displayListings.length > 0 ? (
              // Check if we have exactly 1 selected listing and use SelectedListingDetails instead
              visibleListingIds && visibleListingIds.length === 1 ? (
                (() => {
                  const selectedListing = displayListings.find(listing => listing.id === visibleListingIds[0]);
                  return selectedListing ? (
                    <SelectedListingDetails
                      listing={selectedListing}
                      customSnapshot={enhancedSnapshot}
                      height={`${calculatedHeight-80}px`}
                    />
                  ) : null;
                })()
              ) : (
                // Pass calculatedHeight to the height prop
                <SearchListingsGrid
                  listings={displayListings}
                  height={`${calculatedHeight-80}px`}
                  customSnapshot={enhancedSnapshot}
                />
              )
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <p className="text-gray-600 text-center">
                  Sorry, we couldn&apos;t find any listings in this area right now.
                  <br />
                  Please check again later or try different dates.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <p 
                  className="font-montserrat-regular text-2xl mb-5 cursor-pointer hover:text-blue-600"
                  onClick={() => {
                    console.log('=== DEBUG: No more listings to show ===');
                    console.log('Total listings from backend:', listings.length);
                    console.log('Display listings (after filtering):', displayListings.length);
                    console.log('Show listings (from context):', showListings.length);
                    console.log('Liked listings:', likedListings.length);
                    console.log('Filtered out count:', numFilteredOut);
                    
                    console.log('\n--- Trip Details ---');
                    console.table({
                      'Trip Start Date': trip?.startDate ? new Date(trip.startDate).toDateString() : 'Not set',
                      'Trip End Date': trip?.endDate ? new Date(trip.endDate).toDateString() : 'Not set',
                      'Flexible Start Days': trip?.flexibleStart || 0,
                      'Flexible End Days': trip?.flexibleEnd || 0,
                      'Stay Duration (days)': trip?.startDate && trip?.endDate ? 
                        Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 'Unknown'
                    });
                    
                    // Log individual listings and why they might be filtered
                    console.log('\n--- All listings from backend ---');
                    listings.forEach((listing, index) => {
                      const isInShowListings = showListings.some(sl => sl.id === listing.id);
                      const isLiked = lookup.favIds.has(listing.id);
                      const isDisliked = lookup.dislikedIds.has(listing.id);
                      const isRequested = lookup.requestedIds.has(listing.id);
                      
                      console.log(`${index + 1}. ${listing.title} (${listing.id})`);
                      console.log(`   - In showListings: ${isInShowListings}`);
                      console.log(`   - Liked: ${isLiked}`);
                      console.log(`   - Disliked: ${isDisliked}`);
                      console.log(`   - Requested: ${isRequested}`);
                      console.log(`   - Available: ${listing.isActuallyAvailable !== false}`);
                      console.log(`   - Approval Status: ${listing.approvalStatus}`);
                      console.log(`   - Marked Active: ${listing.markedActiveByUser}`);
                      console.log(`   - Latitude: ${listing.latitude}`);
                      console.log(`   - Longitude: ${listing.longitude}`);
                      console.log(`   - Category: ${listing.category}`);
                      console.log(`   - Furnished: ${listing.furnished}`);
                      console.log(`   - Bedrooms: ${listing.bedrooms?.length || 0}`);
                      console.log(`   - Bathroom Count: ${listing.bathroomCount}`);
                      console.log(`   - Distance: ${listing.distance}`);
                      console.log(`   - Price: ${listing.price}`);
                      console.log(`   - Calculated Price: ${listing.calculatedPrice}`);
                      
                      // Enhanced unavailable periods logging
                      console.log(`\n   📅 Unavailable Periods for "${listing.title}":`);
                      if (listing.unavailablePeriods && listing.unavailablePeriods.length > 0) {
                        console.table(listing.unavailablePeriods.map((period, idx) => ({
                          'Period #': idx + 1,
                          'Start Date': new Date(period.startDate).toDateString(),
                          'End Date': new Date(period.endDate).toDateString(),
                          'Reason': period.reason || 'Not specified'
                        })));
                      } else {
                        console.log('   ✅ No unavailable periods');
                      }
                      
                      console.log('   - Full listing object:', listing);
                      console.log('');
                    });
                    
                    console.log('\n--- Current filters ---');
                    console.log(filters);
                    console.log('=== END DEBUG ===');
                  }}
                >
                  No more listings to show!
                </p>
                <p>
                  {numFilteredOut > 0 ? 'Try adjusting your filters to see more listings.' : 'Check back later for new listings.'}
                </p>

                {numFilteredOut > 0 && (
                  <p className="mt-3">
                    {`${numFilteredOut} listings are currently filtered out.`}
                  </p>
                )}

                <div className="flex justify-center gap-x-2 mt-2">
                  {numFilteredOut > 0 && (
                    <button
                      onClick={() => setIsFilterDialogOpen(true)}
                      className="px-3 py-1 bg-background text-[#404040] rounded-md hover:bg-gray-100 border-2"
                    >
                      Adjust Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile-only Map button */}
        {isClient && !isDesktopView && (
          <Button
            onClick={() => setIsSlideMapOpen(true)}
            className="fixed text-sm gap-x-2 px-5 font-light max-w-[300px] text-[16px] bottom-[13vh] left-1/2 transform -translate-x-1/2 rounded-full bg-charcoalBrand text-background z-50"
          >
            <MapViewIcon stroke="white" className='scale-90 ' strokeWidth={1.0} />
            Map
          </Button>
        )}

          {/* Map container for Desktop - adjust width based on fullscreen state */}
          {isClient && isDesktopView && (
            <div className={`w-full ${isFullscreen ? 'md:w-full' : 'md:w-2/5'} mt-4 md:mt-0`}>
            <SearchMap
              center={[trip?.longitude || mapCenter.lng, trip?.latitude || mapCenter.lat]}
            zoom={zoomLevel}
            height={typeof calculatedHeight === 'number' ? `${calculatedHeight}px` : calculatedHeight}
            markers={markers}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            markerStyles={MARKER_STYLES}
            selectedMarkerId={clickedMarkerId}
            onCenterChanged={(lng, lat) => {
              // Update the current map center but don't re-center the map
              setCurrentMapCenter({ lat, lng });
            }}
            onClickedMarkerChange={setClickedMarkerId}
            onResetRequest={(resetFn) => {
              mapResetRef.current = resetFn;
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
            <SearchMapMobile
              center={[trip?.longitude || mapCenter.lng, trip?.latitude || mapCenter.lat]}
              zoom={zoomLevel}
              height="100vh"
              markers={markers}
              markerStyles={MARKER_STYLES}
              onClose={() => setIsSlideMapOpen(false)}
              onCenterChanged={(lng, lat) => {
                // Update the current map center but don't re-center the map
                setCurrentMapCenter({ lat, lng });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </>
  );
};

export default MapView;
