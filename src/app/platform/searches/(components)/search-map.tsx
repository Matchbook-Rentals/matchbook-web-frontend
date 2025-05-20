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

// No longer using clustering

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
  onCenterChanged?: (lng: number, lat: number) => void;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  isFullscreen = false,
  setIsFullscreen = () => {},
  onCenterChanged = () => {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [clickedCluster, setClickedCluster] = useState<null>(null);

  const { hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const { state: { filters, trip: { searchRadius } } } = useTripContext();
  const queryParams = useSearchParams();

  // **Utility Functions**

  /** Calculate pixel distance between two points on the map */
  const calculatePixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!mapRef.current) return Infinity;
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  /** Calculate real-world distance in miles */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /** Update visible listings based on current map bounds */
  const updateVisibleMarkers = () => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    const visibleIds = markers
      .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
      .map(marker => marker.listing.id);
    useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
  };

  /** Get visible markers within the current bounds */
  const getVisibleMarkers = (): MapMarker[] => {
    if (!mapRef.current) return [];
    
    const bounds = mapRef.current.getBounds();
    return markers.filter(marker => 
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
  };


  /** Render markers */
  const renderMarkers = () => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.clear(); // Keep the ref but don't use it
    
    // Get visible markers and render them individually
    getVisibleMarkers().forEach(marker => createSingleMarker(marker));
  };

  /** Create a single marker */
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    // Set initial color based on liked status
    const initialColor = marker.listing.isLiked ? '#0000FF' : '#FF0000';
    console.log(`Creating marker for ${marker.listing.id}, isLiked: ${marker.listing.isLiked}, color: ${initialColor}`);
    
    const mapMarker = new maplibregl.Marker({ color: initialColor })
      .setLngLat([marker.lng, marker.lat])
      .addTo(mapRef.current);
    mapMarker.getElement().style.cursor = 'pointer';
    mapMarker.getElement().addEventListener('click', (e) => {
      e.stopPropagation();
      if (isFullscreen) {
        setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
      } else {
        setClickedMarkerId(curr => {
          if (curr === marker.listing.id) {
            updateVisibleMarkers();
            return null;
          }
          useVisibleListingsStore.getState().setVisibleListingIds([marker.listing.id]);
          return marker.listing.id;
        });
      }
    });
    markersRef.current.set(marker.listing.id, mapMarker);
  };

  // No longer using cluster markers

  /** Update marker colors based on state */
  const updateMarkerColors = () => {
    const setColor = (marker: maplibregl.Marker, color: string, zIndex = '') => {
      const el = marker.getElement();
      el.querySelectorAll('path').forEach(path => path.setAttribute('fill', color));
      el.style.zIndex = zIndex;
    };

    markersRef.current.forEach((marker, id) => {
      const correspondingMarker = markers.find(m => m.listing.id === id);
      
      // Debug log to check what's happening
      if (correspondingMarker) {
        console.log(`Updating marker ${id}, isLiked: ${correspondingMarker.listing.isLiked}`);
      }
      
      if (isFullscreen && selectedMarker?.listing.id === id) {
        setColor(marker, '#404040', '2');
      } else if (hoveredListing?.id === id || (!isFullscreen && clickedMarkerId === id)) {
        setColor(marker, '#404040', '2');
      } else if (correspondingMarker?.listing.isLiked) {
        setColor(marker, '#0000FF'); // Blue color for liked listings
      } else {
        setColor(marker, '#FF0000');
      }
    });
  };

  // **Map Initialization and Event Handlers** 
  // Only initialize map once and never re-create it on prop changes
  useEffect(() => {
    // Return early if we don't have what we need to initialize
    if (!mapContainerRef.current || !center) return;
    if (mapRef.current) return; // Map already initialized

    let mapRenderZoom = currentZoom || zoom || 12;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center,
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

      // Define updateMarkers function - used in multiple event handlers
      const updateMarkers = (skipRender = false) => {
        if (!mapRef.current) return;
        
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        updateVisibleMarkers();
        
        // Only render markers if not skipping render
        if (!skipRender) {
          renderMarkers();
        }
        
        updateMarkerColors();
      };
      
      // On initial load, just update the visible markers and render them
      map.on('load', () => {
        if (!mapRef.current) return; // Safety check
        
        updateVisibleMarkers();
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        renderMarkers();
        updateMarkerColors();
        
        // Make sure we set this to true
        setMapLoaded(true);
      });
      
      // On zoom, update markers but preserve center
      map.on('zoomend', () => {
        // Get current center before updating
        const currentCenter = mapRef.current!.getCenter();
        updateMarkers();
        // Re-center the map if needed - this ensures user interactions are preserved
        if (mapRef.current) {
          mapRef.current.setCenter(currentCenter);
        }
      });
      
      // On move, only update visible listings without re-rendering the whole map
      map.on('moveend', () => {
        if (!mapRef.current) return;
        
        // Report center change to parent
        const newCenter = mapRef.current.getCenter();
        onCenterChanged(newCenter.lng, newCenter.lat);
        
        // Update visible listings
        updateVisibleMarkers();
        // Update markers but skip rendering to prevent flashy behavior
        updateMarkers(true);
      });
      
      map.on('click', () => {
        setSelectedMarker(null);
        setClickedCluster(null);
        if (!isFullscreen) {
          setClickedMarkerId(null);
          updateVisibleMarkers();
        }
      });
      
      // Add idle event for synchronized updates
      map.on('idle', () => {
        updateVisibleMarkers();
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      // Set a flag to indicate map failed to load, so we can show fallback UI
      setMapLoaded(false);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      clusterMarkersRef.current.clear();
    };
  }, []); // Empty dependency array - only run once

  // Update center when center prop changes without reinitializing the map
  useEffect(() => {
    if (!mapRef.current || !center || !mapLoaded) return;
    
    // Get the current view bounds
    const bounds = mapRef.current.getBounds();
    const currentCenter = mapRef.current.getCenter();
    
    // Check if we should update center based on:
    // 1. This appears to be the initial load (center way off)
    // 2. The center point is not within the current view bounds
    // 3. User hasn't manually moved the map
    const isInitialLoad = Math.abs(currentCenter.lng - center[0]) > 1 || 
                         Math.abs(currentCenter.lat - center[1]) > 1;
    
    const centerPoint = new maplibregl.LngLat(center[0], center[1]);
    const isOutsideView = !bounds.contains(centerPoint) && !mapRef.current.isMoving();
    
    // Only fly to a new center if one of the conditions is met
    if (isInitialLoad || isOutsideView) {
      // Use flyTo with a short duration to smoothly transition
      mapRef.current.flyTo({
        center: center,
        duration: 500,
        essential: true
      });
    }
  }, [center, mapLoaded]); // Include center in dependencies to respond to prop changes

  // **State Sync Effects**
  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
    setTimeout(updateVisibleMarkers, 300);
  }, [filters, searchRadius, queryParams]);

  useEffect(updateMarkerColors, [hoveredListing, clickedMarkerId, selectedMarker, clickedCluster, isFullscreen, markers]);

  // Handle marker changes using debouncing to prevent frequent re-renders
  useEffect(() => {
    // Only proceed if we have a loaded map
    if (!mapRef.current || !mapLoaded) return;
    
    // Don't re-render if map is being dragged
    try {
      if (mapRef.current.isEasing() || mapRef.current.isMoving() || mapRef.current.isZooming()) {
        return;
      }
    } catch (e) {
      console.error("Error checking map state:", e);
      return;
    }
    
    // Debounce marker updates to reduce flickering
    const safelyUpdateMarkers = () => {
      if (!mapRef.current) return;
      
      try {
        updateVisibleMarkers();
        renderMarkers();
      } catch (e) {
        console.error("Error updating markers:", e);
      }
    };
    
    // Use a longer delay to prevent too frequent updates
    const timeoutId = setTimeout(safelyUpdateMarkers, 200);
    return () => clearTimeout(timeoutId);
  }, [markers, mapLoaded, currentZoom]);
  
  // Handle fullscreen toggle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    // Define a function to safely update the map after fullscreen toggle
    const safelyHandleFullscreenChange = () => {
      if (!mapRef.current) return;
      
      try {
        if (!isFullscreen) {
          updateVisibleMarkers();
          renderMarkers();
        }
        
        // Ensure map resizes properly after fullscreen toggle
        mapRef.current.resize();
      } catch (e) {
        console.error("Error handling fullscreen change:", e);
      }
    };
    
    // Small delay to ensure the container has resized
    const timeoutId = setTimeout(safelyHandleFullscreenChange, 200);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, mapLoaded, currentZoom]);


  const handleFullscreen = () => {
    // Don't adjust zoom when toggling fullscreen - just toggle the state
    setIsFullscreen(!isFullscreen);
    
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button onClick={() => mapRef.current?.zoomOut()} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 12H6" />
              </svg>
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10">
            <button onClick={handleFullscreen} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
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
      {mapLoaded === false && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-700 mb-3">Unable to load map</div>
          <div className="text-sm text-gray-500 max-w-md text-center px-4">
            The map could not be loaded due to browser limitations. 
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
