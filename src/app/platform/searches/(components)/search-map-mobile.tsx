import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { RejectIcon } from '@/components/icons';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import ListingCard from './mobile-map-click-listing-card';

// No longer using clustering

// Threshold for switching to simple markers when there are too many listings
const SIMPLE_MARKER_THRESHOLD = 30;

// Simple marker color configuration (for >30 listings)
const MARKER_COLORS = {
  DEFAULT: {
    primary: '#404040',   // Charcoal outer circle
    secondary: '#404040'  // Charcoal inner circle
  },
  HOVER: {
    primary: '#FFFFFF',   // White outer circle
    secondary: '#404040'  // Charcoal inner circle
  },
  LIKED: {
    primary: '#000000',   // Black outer circle
    secondary: '#5c9ac5'  // Blue inner circle
  },
  DISLIKED: {
    primary: '#FFFFFF',   // White outer circle
    secondary: '#404040'  // Charcoal inner circle
  }
};

// Price bubble marker color configuration (for ≤30 listings)
const PRICE_BUBBLE_COLORS = {
  DEFAULT: {
    background: '#FFFFFF',
    text: '#404040',
    border: '#404040'
  },
  HOVER: {
    background: '#404040',
    text: '#FFFFFF',
    border: '#FFFFFF'
  },
  DISLIKED: {
    background: '#404040',
    text: '#FFFFFF',
    border: '#FFFFFF'
  }
};

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  onClose: () => void;
  onCenterChanged?: (lng: number, lat: number) => void;
}

const SearchMapMobile: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  onClose,
  onCenterChanged = () => {}
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { shouldPanTo, clearPanTo } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const [clickedCluster, setClickedCluster] = useState<null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const markersDataRef = useRef<MapMarker[]>(markers);

  // Local calculateDistance function for listing card distance display
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate pixel distance between two points for clustering
  const calculatePixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!mapRef.current) return Infinity;
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  /** Get visible markers within the current bounds */
  const getVisibleMarkers = (): MapMarker[] => {
    if (!mapRef.current) return [];
    
    const bounds = mapRef.current.getBounds();
    return markers.filter(marker => 
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
  };

  // Function to create a single marker
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    
    const visibleMarkers = getVisibleMarkers();
    const shouldUseSimpleMarkers = visibleMarkers.length > SIMPLE_MARKER_THRESHOLD;
    
    if (shouldUseSimpleMarkers) {
      // Use simple black MapLibre marker with configurable inner circle for high-density views
      const mapMarker = new maplibregl.Marker({ 
        color: MARKER_COLORS.DEFAULT.primary,
        scale: 0.7 // Make them smaller
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current);
      
      const markerElement = mapMarker.getElement();
      markerElement.style.cursor = 'pointer';
      
      // Customize the inner circle to default color
      const innerCircle = markerElement.querySelector('svg circle:last-child');
      if (innerCircle) {
        innerCircle.setAttribute('fill', MARKER_COLORS.DEFAULT.secondary);
      }
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
      });
      markersRef.current.set(marker.listing.id, mapMarker);
    } else {
      // Use custom price bubble markers for normal density
      const el = document.createElement('div');
      el.className = 'price-bubble-marker';
      
      // Set initial color for price bubbles based on selection state
      const isSelected = selectedMarker?.listing.id === marker.listing.id;
      const colors = isSelected ? PRICE_BUBBLE_COLORS.HOVER : PRICE_BUBBLE_COLORS.DEFAULT;
      const { background: initialColor, text: textColor, border: borderColor } = colors;
      
      
      // Format the price for display if available
      const price = marker.listing.calculatedPrice || marker.listing.price;
      const formattedPrice = (price !== null && price !== undefined) 
        ? `$${price.toLocaleString()}`
        : 'N/A';
      
      // Set the CSS for the marker
      el.style.cssText = `
        padding: 6px 10px;
        border-radius: 16px;
        background-color: ${initialColor};
        color: ${textColor};
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        min-width: 40px;
        text-align: center;
        border: 2px solid ${borderColor};
        z-index: ${isSelected ? '2' : ''};
      `;
      
      // Set the inner HTML with the price and heart if liked
      if (marker.listing.isLiked) {
        el.innerHTML = `
          <span style="position: relative;">
            ${formattedPrice}
            <svg style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 8px;
              height: 8px;
              fill: #FF6B6B;
              filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
            " viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
            </svg>
          </span>
        `;
      } else {
        el.innerHTML = formattedPrice;
      }
      
      const mapMarker = new maplibregl.Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current);
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
      });
      
      markersRef.current.set(marker.listing.id, mapMarker);
    }
  };

  // No longer using cluster markers

  // Function to render markers
  const renderMarkers = () => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.clear(); // Keep the ref but don't use it

    // Get visible markers and render them individually
    getVisibleMarkers().forEach(marker => createSingleMarker(marker));
  };

  // Function to update marker colors based on state
  const updateMarkerColors = () => {
    const visibleMarkers = getVisibleMarkers();
    const shouldUseSimpleMarkers = visibleMarkers.length > SIMPLE_MARKER_THRESHOLD;
    
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const correspondingMarker = markersDataRef.current.find(m => m.listing.id === id);
      
      // Handle simple markers (MapLibre markers when >30 listings)
      if (shouldUseSimpleMarkers) {
        const innerCircle = el.querySelector('svg circle:last-child');
        const markerShape = el.querySelector('svg g:nth-child(2)');
        
        if (!markerShape || !innerCircle) return;
        
        if (selectedMarker?.listing.id === id) {
          markerShape.setAttribute('fill', MARKER_COLORS.HOVER.primary);
          innerCircle.setAttribute('fill', MARKER_COLORS.HOVER.secondary);
        } else if (correspondingMarker?.listing.isLiked) {
          markerShape.setAttribute('fill', MARKER_COLORS.LIKED.primary);
          innerCircle.setAttribute('fill', MARKER_COLORS.LIKED.secondary);
        } else if (correspondingMarker?.listing.isDisliked) {
          markerShape.setAttribute('fill', MARKER_COLORS.DISLIKED.primary);
          innerCircle.setAttribute('fill', MARKER_COLORS.DISLIKED.secondary);
        } else {
          markerShape.setAttribute('fill', MARKER_COLORS.DEFAULT.primary);
          innerCircle.setAttribute('fill', MARKER_COLORS.DEFAULT.secondary);
        }
        return;
      }
      
      // Handle custom price bubble markers (when ≤30 listings)
      if (selectedMarker?.listing.id === id) {
        el.style.backgroundColor = PRICE_BUBBLE_COLORS.HOVER.background;
        el.style.color = PRICE_BUBBLE_COLORS.HOVER.text;
        el.style.border = `2px solid ${PRICE_BUBBLE_COLORS.HOVER.border}`;
        el.style.zIndex = '2';
      } else if (correspondingMarker?.listing.isLiked) {
        // For mobile, when selected (equivalent to hover), maintain the hover state
        if (selectedMarker?.listing.id === id) {
          el.style.backgroundColor = PRICE_BUBBLE_COLORS.HOVER.background;
          el.style.color = PRICE_BUBBLE_COLORS.HOVER.text;
          el.style.border = `2px solid ${PRICE_BUBBLE_COLORS.HOVER.border}`;
          el.style.zIndex = '2';
        } else {
          // Keep default colors for liked listings - only the heart indicates liked status
          el.style.backgroundColor = PRICE_BUBBLE_COLORS.DEFAULT.background;
          el.style.color = PRICE_BUBBLE_COLORS.DEFAULT.text;
          el.style.border = `2px solid ${PRICE_BUBBLE_COLORS.DEFAULT.border}`;
          el.style.zIndex = '1';
        }
        
        // Update the heart icon if needed
        if (!el.querySelector('svg')) {
          const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
          const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
          el.innerHTML = `
            <span style="position: relative;">
              ${formattedPrice}
              <svg style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 8px;
                height: 8px;
                fill: #FF6B6B;
                filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
              " viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
              </svg>
            </span>
          `;
        }
      } else {
        // Default state
        el.style.backgroundColor = PRICE_BUBBLE_COLORS.DEFAULT.background;
        el.style.color = PRICE_BUBBLE_COLORS.DEFAULT.text;
        el.style.border = `2px solid ${PRICE_BUBBLE_COLORS.DEFAULT.border}`;
        el.style.zIndex = '';
        
        // Remove heart icon if it exists
        const heartIcon = el.querySelector('svg');
        if (heartIcon) {
          const price = correspondingMarker?.listing.calculatedPrice || correspondingMarker?.listing.price;
          const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
          el.innerHTML = formattedPrice;
        }
      }
    });
  };

  // Initialize map only once with no dependencies
  useEffect(() => {
    // Return early if we don't have what we need to initialize or map already exists
    if (!mapContainerRef.current || !center) return;
    if (mapRef.current) return; // Map already initialized

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: center,
        zoom: zoom,
        scrollZoom: false,
        failIfMajorPerformanceCaveat: false, // Try to render even on low-end devices
      });

      mapRef.current = map;
      
      // Handle map load errors
      map.on('error', (e) => {
        console.error('MapLibre GL error:', e);
      });
      
      setMapLoaded(true);

      // Define updateMarkers function to be used across event handlers
      const updateMarkers = (skipRender = false) => {
        if (!mapRef.current) return;
        
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        
        // Only render if not skipping
        if (!skipRender) {
          renderMarkers();
        }
        
        updateMarkerColors();
      };

      // Set up event listeners with improved handling
      map.on('load', () => {
        if (!mapRef.current) return;
        
        // Initial markers
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        renderMarkers();
        updateMarkerColors();
        
        // Make sure we set this to true
        setMapLoaded(true);
      });
      
      map.on('zoomend', () => {
        // Store current center to maintain user's view
        if (!mapRef.current) return;
        const currentCenter = mapRef.current.getCenter();
        
        // Update markers
        updateMarkers();
        
        // Restore center to avoid jumps
        if (mapRef.current) {
          mapRef.current.setCenter(currentCenter);
        }
      });
      
      map.on('moveend', () => {
        if (!mapRef.current) return;
        
        // Report center change to parent
        const newCenter = mapRef.current.getCenter();
        onCenterChanged(newCenter.lng, newCenter.lat);
        
        // Update markers without re-rendering
        updateMarkers(true);
      });
      
      map.on('click', () => {
        setSelectedMarker(null);
        setClickedCluster(null);
      });
      
      // Add idle event for synchronized updates
      map.on('idle', () => {
        // Safe time to update markers when the map is not actively changing
        if (mapRef.current && !mapRef.current.isMoving() && !mapRef.current.isZooming()) {
          // No longer using clustering, just update marker colors
          updateMarkerColors();
        }
      });
    } catch (error) {
      console.error('Failed to initialize mobile map:', error);
      setMapLoaded(false);
    }

    // Cleanup
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
    
    // Only update center if:
    // 1. This appears to be the initial load (center way off)
    // 2. The center point is not within the current view bounds
    // 3. User hasn't manually moved the map
    const isInitialLoad = Math.abs(currentCenter.lng - center[0]) > 1 || 
                         Math.abs(currentCenter.lat - center[1]) > 1;
    
    const centerPoint = new maplibregl.LngLat(center[0], center[1]);
    const isOutsideView = !bounds.contains(centerPoint) && !mapRef.current.isMoving();
    
    if (isInitialLoad || isOutsideView) {
      // Use flyTo with a short duration - user likely hasn't interacted yet
      mapRef.current.flyTo({
        center: center,
        duration: 500,
        essential: true
      });
    }
  }, [center, mapLoaded]); // Include center in dependencies to respond to prop changes
  
  // Handle panning to hovered location
  useEffect(() => {
    if (mapRef.current && shouldPanTo) {
      mapRef.current.easeTo({
        center: [shouldPanTo.lng, shouldPanTo.lat],
        duration: 1500,
        zoom: zoom
      });
      clearPanTo();
    }
  }, [shouldPanTo, clearPanTo, zoom]);
  
  // Store previous markers to detect real changes
  const prevMarkersRef = useRef<MapMarker[]>([]);
  
  // Update markers data ref whenever markers prop changes
  useEffect(() => {
    markersDataRef.current = markers;
  }, [markers]);
  
  // Handle marker changes using debouncing to prevent frequent re-renders
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    // Don't re-render if map is being dragged or manipulated
    try {
      if (mapRef.current.isEasing() || mapRef.current.isMoving() || mapRef.current.isZooming()) {
        return;
      }
    } catch (e) {
      console.error("Error checking map state:", e);
      return;
    }
    
    // Check if markers have actually changed position or count
    const markersChanged = markers.length !== prevMarkersRef.current.length ||
      markers.some((marker, index) => {
        const prevMarker = prevMarkersRef.current[index];
        return !prevMarker || 
               marker.listing.id !== prevMarker.listing.id ||
               marker.lat !== prevMarker.lat ||
               marker.lng !== prevMarker.lng;
      });
    
    // Define a safe update function with more aggressive debouncing
    const safelyUpdateMarkers = () => {
      if (!mapRef.current) return;
      
      try {
        // Only re-render markers if positions/count changed
        if (markersChanged) {
          renderMarkers();
          prevMarkersRef.current = [...markers];
        }
        // Always update colors to reflect current state
        updateMarkerColors();
      } catch (e) {
        console.error("Error updating mobile map markers:", e);
      }
    };
    
    // Use a longer delay (200ms) to prevent too frequent updates
    const timeoutId = setTimeout(safelyUpdateMarkers, 200);
    return () => clearTimeout(timeoutId);
  }, [markers, mapLoaded, currentZoom]);
  
  // Update marker colors when state changes
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      updateMarkerColors();
    }
  }, [mapLoaded, selectedMarker, clickedCluster]);

  return (
    <div style={{ height }} className="font-montserrat" ref={mapContainerRef}>
      {/* Close button - always show this regardless of map state */}
      <Button
        onClick={onClose}
        className="fixed bottom-[13vh] left-1/2 transform -translate-x-1/2 z-50 gap-x-2 px-5 max-w-[300px] text-[16px] font-montserrat font-medium rounded-full bg-charcoalBrand text-background"
      >
        <RejectIcon className="h-5 w-5 mb-[2px]" />
        Close
      </Button>
      
      {mapLoaded === true && mapRef.current && (
        <>
          {/* Listing Card */}
          {selectedMarker && selectedMarker.listing && center && (
            <ListingCard
              listing={selectedMarker.listing}
              distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
              onClose={() => setSelectedMarker(null)}
              className="top-2 left-1/2 transform -translate-x-1/2 w-[95%] z-40"
            />
          )}

          {/* Zoom controls */}
          <div className="absolute top-2 right-2 z-10 flex flex-col">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="bg-white p-2 rounded-md shadow mb-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="bg-white p-2 rounded-md shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
          </div>
        </>
      )}
      
      {/* Fallback UI when map fails to load */}
      {mapLoaded === false && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-700 text-lg mb-3">Unable to load map</div>
          <div className="text-sm text-gray-500 max-w-[80%] text-center px-4">
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

export default SearchMapMobile;
