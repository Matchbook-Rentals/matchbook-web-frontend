import React, { useState, Dispatch, SetStateAction, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';
import SearchMapMobile from '../(components)/search-map-mobile';
import { ListingAndImages } from '@/types';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapViewIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useListingsSnapshot } from '@/hooks/useListingsSnapshot';
import { calculateRent } from '@/lib/calculate-rent';

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

// Add this function to determine zoom level based on radius
const getZoomLevel = (radius: number | undefined): number => {
  if (!radius) return 7; // Default zoom if radius is undefined

  if (radius >= 100) return 6;
  if (radius >= 65) return 7;
  if (radius >= 40) return 8;
  if (radius >= 20) return 9;
  return 9; // Default for anything less than 20
};

const MapView: React.FC<MapViewProps> = ({ setIsFilterOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useTripContext();
  const { showListings, likedListings, trip } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

  // Use the new snapshot hook for stable listings data
  const listingsSnapshot = useListingsSnapshot();
  const listings = listingsSnapshot.listings;
  
  // Keep track of original shown listings to prevent them from disappearing when liked
  const [originalShowListings, setOriginalShowListings] = useState<ListingAndImages[]>([]);
  
  // Update the original listings only when showListings changes due to filter changes, not likes
  useEffect(() => {
    setOriginalShowListings(showListings);
  }, [trip?.searchRadius, trip?.minPrice, trip?.maxPrice]); // Only dependencies that indicate filter changes
  
  // Initialize originalShowListings on first load
  useEffect(() => {
    if (originalShowListings.length === 0 && showListings.length > 0) {
      setOriginalShowListings(showListings);
    }
  }, [showListings, originalShowListings.length]);
  
  // Use the listings snapshot directly without overriding functions
  const enhancedSnapshot = listingsSnapshot;

  // New state to control the mobile slide-map overlay
  const [isSlideMapOpen, setIsSlideMapOpen] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  
  // State to control map fullscreen view
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New state for zoom level based on trip.searchRadius
  const [zoomLevel, setZoomLevel] = useState(getZoomLevel(trip?.searchRadius || 50));

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

  useEffect(() => {
    setZoomLevel(getZoomLevel(trip?.searchRadius || 50));
  }, [trip?.searchRadius]);

  // Combine current showListings with any original listings that were liked
  // This prevents liked listings from disappearing from the map
  const displayListings = useMemo(() => {
    // Start with current showListings
    const result = [...showListings];
    
    // Add back any original listings that were liked but now missing from showListings
    originalShowListings.forEach(originalListing => {
      // Check if this original listing is now liked
      if (enhancedSnapshot.isLiked(originalListing.id)) {
        // Check if it's missing from current showListings
        if (!showListings.some(listing => listing.id === originalListing.id)) {
          result.push(originalListing);
        }
      }
    });
    
    return result;
  }, [showListings, originalShowListings, enhancedSnapshot]);

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
    return displayListings.map((listing) => {
      // Add isLiked and isDisliked properties based on the enhanced snapshot state
      const isLiked = favoriteIdsArray.includes(listing.id);
      const isDisliked = dislikedIdsArray.includes(listing.id);
      
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
  }, [displayListings, favoriteIdsArray, dislikedIdsArray, getListingStatus, trip, enhancedSnapshot]);

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
      <div ref={containerRef} className="flex flex-col md:flex-row justify-center mx-auto w-full sm:px-2">
        {/* Grid container - hide when fullscreen */}
        {!isFullscreen && (
          <div className="w-full md:w-3/5 md:pr-4">
            {displayListings.length > 0 ? (
              // Pass calculatedHeight to the height prop
              <SearchListingsGrid 
                listings={displayListings} 
                height={calculatedHeight.toString()} 
                customSnapshot={enhancedSnapshot} 
              />
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
                <p className="font-montserrat-regular text-2xl mb-5">You&apos;re out of listings!</p>
                <p>
                  You can {numFavorites > 0 ? 'look at your favorites' : ''}
                  {numFavorites > 0 && numFilteredOut > 0 ? ' or ' : ''}
                  {numFilteredOut > 0 ? 'alter your filters' : ''} to see more.
                </p>

                {(numFavorites > 0 || numFilteredOut > 0) && (
                  <p className="mt-3">
                    {numFavorites > 0 && `You have ${numFavorites} listings in your favorites`}
                    {numFavorites > 0 && numFilteredOut > 0 && ' & '}
                    {numFilteredOut > 0 && `${numFilteredOut} listings filtered out`}
                    .
                  </p>
                )}

                <div className="flex justify-center gap-x-2 mt-2">
                  {numFilteredOut > 0 && (
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="px-3 py-1 bg-background text-[#404040] rounded-md hover:bg-gray-100 border-2"
                    >
                      Adjust Filters
                    </button>
                  )}
                  {numFavorites > 0 && (
                    <button
                      onClick={() => handleTabChange()}
                      className="px-4 py-1 bg-[#4F4F4F] text-background rounded-md hover:bg-[#404040]"
                    >
                      View Favorites
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile-only Map button */}
        <Button
          onClick={() => setIsSlideMapOpen(true)}
          className="fixed md:hidden text-sm gap-x-2 px-5 font-light max-w-[300px] text-[16px] bottom-[13vh] left-1/2 transform -translate-x-1/2 rounded-full bg-charcoalBrand text-background z-50"
        >
          <MapViewIcon stroke="white" className='scale-90 ' strokeWidth={1.0} />
          Map
        </Button>

        {/* Map container for Desktop - adjust width based on fullscreen state */}
        <div className={`w-full hidden md:block ${isFullscreen ? 'md:w-full' : 'md:w-2/5'} mt-4 md:mt-0`}>
          <SearchMap
            center={[mapCenter.lng, mapCenter.lat]}
            zoom={zoomLevel}
            height={`${calculatedHeight}px`}
            markers={markers}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            onCenterChanged={(lng, lat) => {
              // Update the current map center but don't re-center the map
              setCurrentMapCenter({ lat, lng });
            }}
          />
        </div>
      </div>

      {/* Mobile Slide-Up Map Overlay */}
      <AnimatePresence>
        {isSlideMapOpen && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full bg-white z-50 md:hidden"
            variants={slideUpVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <SearchMapMobile
              center={[mapCenter.lng, mapCenter.lat]}
              zoom={zoomLevel}
              height="100vh"
              markers={markers}
              onClose={() => setIsSlideMapOpen(false)}
              onCenterChanged={(lng, lat) => {
                // Update the current map center but don't re-center the map
                setCurrentMapCenter({ lat, lng });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapView;
