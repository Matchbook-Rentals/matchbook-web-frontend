import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useSearchParams } from 'next/navigation';
import DesktopListingCard from './desktop-map-click-card';
import ListingCard from './desktop-map-click-card';

// Import custom hooks
import { useMapUtilities } from './hooks/useMapUtilities';
import { useMapMarkerFactory } from './hooks/useMapMarkerFactory';
import { useMapMarkerStyles } from './hooks/useMapMarkerStyles';
import { useMapMarkerManager } from './hooks/useMapMarkerManager';

// Constants for debouncing and timing
const DEBOUNCE_DELAY = 100; // Debounce delay for map events (ms)
const STYLE_UPDATE_DELAY = 50; // Delay for style updates (ms)
const VISIBLE_MARKERS_UPDATE_DELAY = 300; // Delay for visible markers update (ms)
const FULLSCREEN_CHANGE_DELAY = 200; // Delay for fullscreen change handling (ms)
const MAP_FLY_DURATION = 500; // Duration for map fly animations (ms)

// Constants for map rendering
const DEFAULT_ZOOM = 12;

// Constants for retry logic
const RETRY_DELAYS = [200, 400, 600]; // Retry delays in ms

// Constants for coordinate comparison
const COORDINATE_TOLERANCE = 1; // Tolerance for coordinate comparison

// Constants for CSS styling
const STROKE_WIDTH = 1.5;



interface MarkerStyles {
  SIMPLE_MARKER_THRESHOLD: number;
  FULLSCREEN_SIMPLE_MARKER_THRESHOLD: number;
  MARKER_COLORS: {
    DEFAULT: { primary: string; secondary: string };
    HOVER: { primary: string; secondary: string };
    LIKED: { primary: string; secondary: string };
    DISLIKED: { primary: string; secondary: string };
  };
  PRICE_BUBBLE_COLORS: {
    DEFAULT: { background: string; text: string; border: string };
    HOVER: { background: string; text: string; border: string };
    DISLIKED: { background: string; text: string; border: string };
  };
  HEART_ICON: {
    color: string;
    simpleMarkerTransform: string;
    simpleMarkerScale: string;
    priceBubblePosition: { top: string; right: string };
    size: string;
    withBackground: boolean;
    backgroundCircle: {
      radius: string;
      fill: string;
      stroke: string;
      strokeWidth: string;
    };
  };
  Z_INDEX: {
    HOVER: string;
    SELECTED: string;
    LIKED: string;
    DEFAULT: string;
    DISLIKED: string;
  };
}

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
  markerStyles: MarkerStyles;
  selectedMarkerId?: string | null;
  onCenterChanged?: (lng: number, lat: number) => void;
  onClickedMarkerChange?: (markerId: string | null) => void;
  onResetRequest?: (resetFn: () => void) => void;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = DEFAULT_ZOOM,
  height = '526px',
  isFullscreen = false,
  setIsFullscreen = () => { },
  markerStyles,
  selectedMarkerId = null,
  onCenterChanged = () => { },
  onClickedMarkerChange = () => { },
  onResetRequest,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [clickedCluster, setClickedCluster] = useState<null>(null);
  const markersDataRef = useRef<MapMarker[]>(markers);
  const clickedMarkerIdRef = useRef<string | null>(null);
  const isFullscreenRef = useRef<boolean>(isFullscreen);
  const isExternalUpdate = useRef<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mapInitFailed, setMapInitFailed] = useState(false);

  const { hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const { state: { filters, trip: { searchRadius } } } = useTripContext();
  const queryParams = useSearchParams();

  // **Initialize Custom Hooks**
  const mapUtilities = useMapUtilities({ mapRef });
  const { calculateDistance, createStyleUpdateScheduler, createMarkerStyleVerifier } = mapUtilities;
  
  const styleScheduler = createStyleUpdateScheduler();
  const { scheduleStyleUpdate } = styleScheduler;
  
  const styleVerifier = createMarkerStyleVerifier();
  const { verifyAndFixMarkerStyles, verifyAllMarkerStyles } = styleVerifier;
  
  const markerFactory = useMapMarkerFactory({ mapRef, markerStyles, verifyAndFixMarkerStyles });
  const { createSimpleMarker, createPriceBubbleMarker } = markerFactory;

  // Keep refs in sync with state
  useEffect(() => {
    clickedMarkerIdRef.current = clickedMarkerId;
    // Only notify parent if this is not an external update
    if (!isExternalUpdate.current) {
      onClickedMarkerChange(clickedMarkerId);
    }
    isExternalUpdate.current = false; // Reset flag
  }, [clickedMarkerId, onClickedMarkerChange]);

  // Sync external selectedMarkerId prop with internal clickedMarkerId state
  useEffect(() => {
    if (selectedMarkerId !== clickedMarkerId) {
      isExternalUpdate.current = true; // Mark as external update
      setClickedMarkerId(selectedMarkerId);
    }
  }, [selectedMarkerId, clickedMarkerId]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  /** Update visible listings based on current map bounds */
  const updateVisibleMarkers = () => {
    if (!mapRef.current) return;

    // Don't update visible markers if we have a clicked marker in non-fullscreen mode
    if (!isFullscreenRef.current && clickedMarkerIdRef.current) {
      return;
    }

    const bounds = mapRef.current.getBounds();
    const visibleIds = markersDataRef.current
      .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
      .map(marker => marker.listing.id);
    
    // Always update visible listings - this ensures zoom/pan changes are reflected
    useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
  };

  /** Get visible markers within the current bounds */
  const getVisibleMarkers = (): MapMarker[] => {
    if (!mapRef.current) return markersDataRef.current;

    const bounds = mapRef.current.getBounds();
    return markersDataRef.current.filter(marker =>
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
  };

  // Initialize marker styles hook
  const markerStylesHook = useMapMarkerStyles({
    markerStyles,
    isFullscreenRef,
    hoveredListing,
    clickedMarkerId,
    selectedMarker,
    markersRef,
    markersDataRef,
    getVisibleMarkers,
    verifyAndFixMarkerStyles
  });
  const { updateMarkerColors } = markerStylesHook;

  // Initialize marker manager hook
  const markerManager = useMapMarkerManager({
    mapRef,
    markersRef,
    markersDataRef,
    isFullscreenRef,
    hoveredListing,
    selectedMarker,
    clickedMarkerId,
    markerStyles,
    setSelectedMarker,
    setClickedMarkerId,
    getVisibleMarkers,
    createSimpleMarker,
    createPriceBubbleMarker,
    verifyAllMarkerStyles
  });
  const { renderMarkers, createSingleMarker } = markerManager;







  // **Debouncing for Map Event Handlers**
  const mapEventDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedUpdateMarkers = (skipRender = false) => {
    if (mapEventDebounceTimer.current) {
      clearTimeout(mapEventDebounceTimer.current);
    }
    
    mapEventDebounceTimer.current = setTimeout(() => {
      if (!mapRef.current) return;
      const newZoom = mapRef.current.getZoom();
      setCurrentZoom(newZoom);
      
      // Only update visible markers if we don't have a clicked marker
      if (isFullscreenRef.current || !clickedMarkerIdRef.current) {
        updateVisibleMarkers();
      }
      
      // Only render markers if not skipping render
      if (!skipRender) {
        renderMarkers();
      }
    }, DEBOUNCE_DELAY);
  };

  // **Map Initialization and Event Handlers** 
  // Only initialize map once and never re-create it on prop changes
  useEffect(() => {
    // Return early if we don't have what we need to initialize
    if (!mapContainerRef.current || !center) return;
    if (mapRef.current) return; // Map already initialized
    if (mapInitFailed) return; // Don't retry if we've already failed

    const retryDelays = RETRY_DELAYS;
    let mapRenderZoom = currentZoom || zoom || DEFAULT_ZOOM;

    const initializeMap = () => {
      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: center || [0, 0],
          zoom: mapRenderZoom,
          scrollZoom: true,
          failIfMajorPerformanceCaveat: false, // Try to render even on low-end devices
        });

        mapRef.current = map;
        setMapLoaded(true);

        // Handle map load errors
        map.on('error', (e) => {
          console.error('MapLibre GL error:', e);
        });

        // Use the debounced version from above - no need to redefine

        // On initial load, update visible markers and render them
        map.on('load', () => {
          if (!mapRef.current) return; // Safety check

          // Always update visible markers on initial load
          updateVisibleMarkers();
          const newZoom = mapRef.current.getZoom();
          setCurrentZoom(newZoom);
          renderMarkers();
          updateMarkerColors();

          // Make sure we set this to true
          setMapLoaded(true);
        });

        // On zoom, update markers and visible listings
        map.on('zoomend', () => {
          debouncedUpdateMarkers();
        });

        // On move, update visible listings and re-render markers
        map.on('moveend', () => {
          if (!mapRef.current) return;
          
          // Report center change to parent
          const newCenter = mapRef.current.getCenter();
          onCenterChanged(newCenter.lng, newCenter.lat);

          // Update visible listings and render markers for pan changes
          debouncedUpdateMarkers();
        });

        map.on('click', () => {
          if (isFullscreenRef.current) {
            setSelectedMarker(null);
          }
          setClickedCluster(null);
          if (!isFullscreenRef.current) {
            setClickedMarkerId(null);
            // Update visible markers to show all listings in bounds
            updateVisibleMarkers();
          }
        });

        // Add idle event for synchronized updates
        map.on('idle', () => {
          // Always update visible markers when map is idle (after zoom/pan operations)
          updateVisibleMarkers();
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);

        // If we have retries left, schedule the next attempt
        if (retryCount < retryDelays.length) {
          const delay = retryDelays[retryCount];
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          // No more retries, mark as failed
          setMapLoaded(false);
          setMapInitFailed(true);
        }
      }
    };

    // Attempt to initialize the map
    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, [retryCount]); // Add retryCount as dependency to trigger retries

  // Only fly to center on initial load when map is way off
  useEffect(() => {
    if (!mapRef.current || !center || !mapLoaded) return;

    const currentCenter = mapRef.current.getCenter();

    // Only recenter if this appears to be the initial load (center way off)
    const isInitialLoad = Math.abs(currentCenter.lng - center[0]) > COORDINATE_TOLERANCE ||
      Math.abs(currentCenter.lat - center[1]) > COORDINATE_TOLERANCE;

    if (isInitialLoad) {
      // Use flyTo with a short duration to smoothly transition
      mapRef.current.flyTo({
        center: center,
        duration: MAP_FLY_DURATION,
        essential: true,
        zoom: zoom,
      });
    }
  }, [mapLoaded]); // Only depend on mapLoaded for initial positioning

  // Create reset function and pass it to parent
  useEffect(() => {
    if (onResetRequest && mapRef.current && center) {
      const resetMap = () => {
        if (mapRef.current && center) {
          mapRef.current.flyTo({
            center: center,
            zoom: zoom,
            duration: MAP_FLY_DURATION,
            essential: true
          });
        }
      };
      onResetRequest(resetMap);
    }
  }, [onResetRequest, center, zoom, mapLoaded]);

  // **State Sync Effects**
  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
    setTimeout(updateVisibleMarkers, VISIBLE_MARKERS_UPDATE_DELAY);
  }, [queryParams]);

  // Use debounced updates for hover/selection changes to prevent infinite loops
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    const timeoutId = setTimeout(() => {
      updateMarkerColors();
    }, STYLE_UPDATE_DELAY);
    
    return () => clearTimeout(timeoutId);
  }, [hoveredListing, clickedMarkerId, selectedMarker, mapLoaded, markers]);


  // Update markers data ref whenever markers prop changes
  useEffect(() => {
    markersDataRef.current = markers;
    // Update marker colors to reflect any state changes (like dislike status)
    if (mapLoaded) {
      setTimeout(() => {
        updateMarkerColors();
      }, STYLE_UPDATE_DELAY);
    }
  }, [markers, mapLoaded]);

  // Effect to update map's zoom when the zoom prop changes (removed - handled in center effect)
  // The zoom is now handled together with center changes in the effect above


  // Handle fullscreen toggle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Define a function to safely update the map after fullscreen toggle
    const safelyHandleFullscreenChange = () => {
      if (!mapRef.current) return;

      try {
        // Always re-render markers when fullscreen mode changes
        // because the threshold changes and marker types switch
        updateVisibleMarkers();
        renderMarkers();
        updateMarkerColors();

        // Ensure map resizes properly after fullscreen toggle
        mapRef.current.resize();
      } catch (e) {
        console.error("Error handling fullscreen change:", e);
      }
    };

    // Small delay to ensure the container has resized
    const timeoutId = setTimeout(safelyHandleFullscreenChange, FULLSCREEN_CHANGE_DELAY);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, mapLoaded, currentZoom]);


  const handleFullscreen = () => {
    // Don't adjust zoom when toggling fullscreen - just toggle the state
    setIsFullscreen(!isFullscreen);

    // Clear selections when switching modes
    if (!isFullscreen) {
      // Entering fullscreen - clear non-fullscreen selection
      setClickedMarkerId(null);
      useVisibleListingsStore.getState().setVisibleListingIds(null);
    } else {
      // Exiting fullscreen - clear fullscreen selection
      setSelectedMarker(null);
    }

    // Schedule a resize after the state change is processed
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 50);
  }

  // **Render**
  return (
    <div style={{ height }} ref={mapContainerRef}>
      {mapLoaded === true && mapRef.current && (
        <>
          <div className="absolute top-2 right-2 z-10 flex flex-col">
            <button onClick={() => mapRef.current?.zoomIn()} className="bg-white p-2 rounded-md shadow mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={STROKE_WIDTH} d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button onClick={() => mapRef.current?.zoomOut()} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={STROKE_WIDTH} d="M18 12H6" />
              </svg>
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10">
            <button onClick={handleFullscreen} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={STROKE_WIDTH}
                  d={isFullscreen ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"}
                />
              </svg>
            </button>
          </div>
          {selectedMarker && isFullscreen && center && (
            <>
              <div className="hidden md:block">
                <DesktopListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
                  customSnapshot={markers[0]?.listing?.customSnapshot} // Pass the custom snapshot from markers
                />
              </div>
              <div className="block md:hidden">
                <ListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
                  className="top-4 left-1/2 transform -translate-x-1/2 w-96"
                  customSnapshot={markers[0]?.listing?.customSnapshot} // Pass the custom snapshot from markers
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Fallback UI when map fails to load */}
      {mapInitFailed && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-700 mb-3">Unable to load map</div>
          <div className="text-sm text-gray-500 max-w-md text-center px-4">
            The map could not be loaded after multiple attempts.
            Please try using a different browser or device.
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchMap;
