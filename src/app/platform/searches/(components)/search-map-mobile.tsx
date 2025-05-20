import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { RejectIcon } from '@/components/icons';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import ListingCard from './mobile-map-click-listing-card';

// Define the ClusterMarker interface
interface ClusterMarker {
  lat: number;
  lng: number;
  count: number;
  listingIds: string[];
}

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
  const [clickedCluster, setClickedCluster] = useState<ClusterMarker | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);

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

  /** Create clusters based on visible markers and zoom level using a grid */
  const createClusters = (zoomLevel: number): ClusterMarker[] => {
    if (!mapRef.current) return [];

    const bounds = mapRef.current.getBounds();
    const visibleMarkers = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)));

    if (visibleMarkers.length === 0) return [];

    // Dynamic pixel radius based on zoom, similar to original logic
    const clusterPixelRadius = Math.max(40, 100 - zoomLevel * 4);

    const grid = new Map<string, MapMarker[]>();
    const visitedRevised = new Set<string>();
    const revisedClusters: ClusterMarker[] = [];

    // Helper to get grid cell key from pixel coordinates
    const getGridKey = (point: maplibregl.Point): string => {
      // Use clusterPixelRadius for grid cell size
      const col = Math.floor(point.x / clusterPixelRadius);
      const row = Math.floor(point.y / clusterPixelRadius);
      return `${col}_${row}`;
    };

    // 1. Assign markers to grid cells
    visibleMarkers.forEach(marker => {
      const point = mapRef.current!.project([marker.lng, marker.lat]);
      const key = getGridKey(point);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(marker);
    });

    // 2. Iterate through markers to form clusters using BFS and grid
    visibleMarkers.forEach(marker => {
        if (visitedRevised.has(marker.listing.id)) return;

        // Start a new potential cluster using BFS
        const clusterQueue: MapMarker[] = [marker];
        visitedRevised.add(marker.listing.id);
        const currentClusterMembers: MapMarker[] = [];

        while (clusterQueue.length > 0) {
            const currentMarker = clusterQueue.shift()!;
            currentClusterMembers.push(currentMarker);

            const point = mapRef.current!.project([currentMarker.lng, currentMarker.lat]);
            const currentCellCol = Math.floor(point.x / clusterPixelRadius);
            const currentCellRow = Math.floor(point.y / clusterPixelRadius);

            // Check neighboring cells for potential members
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = `${currentCellCol + dx}_${currentCellRow + dy}`;
                    if (grid.has(key)) {
                        grid.get(key)!.forEach(neighbor => {
                            // Check if neighbor is already visited *before* distance calculation
                            if (!visitedRevised.has(neighbor.listing.id)) {
                                const distance = calculatePixelDistance(currentMarker.lat, currentMarker.lng, neighbor.lat, neighbor.lng);
                                if (distance < clusterPixelRadius) {
                                    visitedRevised.add(neighbor.listing.id);
                                    clusterQueue.push(neighbor);
                                }
                            }
                        });
                    }
                }
            }
        }

        // Create the final cluster from members found in BFS
        if (currentClusterMembers.length > 0) {
            let totalLat = 0;
            let totalLng = 0;
            const listingIds: string[] = [];
            currentClusterMembers.forEach(m => {
                totalLat += m.lat;
                totalLng += m.lng;
                listingIds.push(m.listing.id);
            });
            revisedClusters.push({
                lat: totalLat / currentClusterMembers.length,
                lng: totalLng / currentClusterMembers.length,
                count: currentClusterMembers.length,
                listingIds: listingIds
            });
        }
    });

    return revisedClusters;
  };

  // Function to create a single marker
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([marker.lng, marker.lat])
      .addTo(mapRef.current);
    mapMarker.getElement().style.cursor = 'pointer';
    mapMarker.getElement().addEventListener('click', (e) => {
      e.stopPropagation();
      setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
    });
    markersRef.current.set(marker.listing.id, mapMarker);
  };

  // Function to create a cluster marker
  const createClusterMarker = (cluster: ClusterMarker) => {
    if (!mapRef.current) return;
    const el = document.createElement('div');
    el.className = 'cluster-marker';
    el.style.cssText = `
      width: 36px; height: 36px; border-radius: 50%; background-color: #FF0000; color: white;
      display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px;
      box-shadow: 0 0 5px rgba(0,0,0,0.5); border: 2px solid white; cursor: pointer; user-select: none;
    `;
    el.innerText = `${cluster.count}`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      setClickedCluster(cluster);
      
      // Always zoom in by 2 levels, capped at max zoom
      const currentZoom = mapRef.current!.getZoom();
      const newZoom = Math.min(currentZoom + 2, mapRef.current!.getMaxZoom());
      
      mapRef.current!.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: newZoom,
        duration: 500,
      });
    });
    const clusterMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([cluster.lng, cluster.lat])
      .addTo(mapRef.current);
    clusterMarkersRef.current.set(`cluster-${cluster.listingIds.join('-')}`, clusterMarker);
  };

  // Function to render clusters and markers
  const renderMarkers = (clusters: ClusterMarker[]) => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current.clear();

    const shouldCluster = currentZoom < 15;
    if (!shouldCluster) {
      const bounds = mapRef.current.getBounds();
      markers
        .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .forEach(marker => createSingleMarker(marker));
    } else {
      clusters.forEach(cluster => {
        cluster.count === 1
          ? createSingleMarker(markers.find(m => m.listing.id === cluster.listingIds[0])!)
          : createClusterMarker(cluster);
      });
    }
  };

  // Function to update marker colors based on state
  const updateMarkerColors = () => {
    const setColor = (marker: maplibregl.Marker, color: string, zIndex = '') => {
      const el = marker.getElement();
      const isCluster = el.classList.contains('cluster-marker');
      if (isCluster) {
        el.style.backgroundColor = color;
      } else {
        el.querySelectorAll('path').forEach(path => path.setAttribute('fill', color));
      }
      el.style.zIndex = zIndex;
    };

    markersRef.current.forEach((marker, id) => {
      if (selectedMarker?.listing.id === id) {
        setColor(marker, '#404040', '2');
      } else {
        setColor(marker, '#FF0000');
      }
    });

    clusterMarkersRef.current.forEach((marker, id) => {
      if (clickedCluster && id === `cluster-${clickedCluster.listingIds.join('-')}`) {
        setColor(marker, '#404040', '2');
      } else {
        setColor(marker, '#FF0000', '1');
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
        const newClusters = createClusters(newZoom);
        
        // Only render if not skipping
        if (!skipRender) {
          renderMarkers(newClusters);
        }
        
        updateMarkerColors();
      };

      // Set up event listeners with improved handling
      map.on('load', () => {
        if (!mapRef.current) return;
        
        // Initial markers
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        const newClusters = createClusters(newZoom);
        renderMarkers(newClusters);
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
          const newClusters = createClusters(mapRef.current.getZoom());
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
    
    // Define a safe update function with more aggressive debouncing
    const safelyUpdateMarkers = () => {
      if (!mapRef.current) return;
      
      try {
        const newClusters = createClusters(currentZoom);
        renderMarkers(newClusters);
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
