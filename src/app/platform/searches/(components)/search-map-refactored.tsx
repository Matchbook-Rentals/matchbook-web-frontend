import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useSearchParams } from 'next/navigation';
import DesktopListingCard from './desktop-map-click-card-refactored';
import { useTripSnapshot } from '@/hooks/useTripSnapshot';
import { useTripActions } from '@/hooks/useTripActions';

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
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
}

const SearchMapRefactored: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  isFullscreen = false,
  setIsFullscreen = () => {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ClusterMarker[]>([]);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [clickedCluster, setClickedCluster] = useState<ClusterMarker | null>(null);
  
  // Local state for listings - populated initially from TripContext but not subscribed to updates
  const [localMarkers, setLocalMarkers] = useState<MapMarker[]>(markers);

  // Get one-time snapshot of filters and searchRadius from TripContext
  const initialFilters = useTripSnapshot(state => state.filters);
  const initialSearchRadius = useTripSnapshot(state => state.trip.searchRadius);
  const [filters, setFilters] = useState(initialFilters);
  const [searchRadius, setSearchRadius] = useState(initialSearchRadius);

  // Get stable reference to actions
  const { optimisticLike, optimisticDislike } = useTripActions();

  const { hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
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
    const visibleIds = localMarkers
      .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
      .map(marker => marker.listing.id);
    useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
  };

  // Handler for liking/disliking listings with local state update
  const handleLike = async (listingId: string) => {
    // Update local state optimistically
    setLocalMarkers(prev => {
      return prev.map(marker => {
        if (marker.listing.id === listingId) {
          return {
            ...marker,
            listing: {
              ...marker.listing,
              isLiked: true,
              isDisliked: false
            }
          };
        }
        return marker;
      });
    });
    
    // Dispatch action to update global state
    await optimisticLike(listingId);
  };

  const handleDislike = async (listingId: string) => {
    // Update local state optimistically
    setLocalMarkers(prev => {
      return prev.map(marker => {
        if (marker.listing.id === listingId) {
          return {
            ...marker,
            listing: {
              ...marker.listing,
              isLiked: false,
              isDisliked: true
            }
          };
        }
        return marker;
      });
    });
    
    // Dispatch action to update global state
    await optimisticDislike(listingId);
  };

  /** Create clusters based on visible markers and zoom level using a grid */
  const createClusters = (zoomLevel: number): ClusterMarker[] => {
    if (!mapRef.current) return [];

    const bounds = mapRef.current.getBounds();
    const visibleMarkers = localMarkers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)));

    if (visibleMarkers.length === 0) return [];

    // Dynamic pixel radius based on zoom, similar to original logic
    let baseClusterPixelRadius = Math.max(40, 100 - zoomLevel * 4);
    // Halve the radius if in fullscreen mode for *less* aggressive clustering
    const clusterPixelRadius = baseClusterPixelRadius;

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


  /** Render individual or cluster markers */
  const renderMarkers = (clusters: ClusterMarker[], zoom: number) => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current.clear();

    const shouldCluster = zoom < 17;
    if (!shouldCluster) {
      const bounds = mapRef.current.getBounds();
      localMarkers
        .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .forEach(marker => createSingleMarker(marker));
    } else {
      clusters.forEach(cluster => {
        cluster.count === 1
          ? createSingleMarker(localMarkers.find(m => m.listing.id === cluster.listingIds[0])!)
          : createClusterMarker(cluster);
      });
    }
  };

  /** Create a single marker */
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    
    // Determine marker color based on like/dislike status
    const color = marker.listing.isLiked ? '#0000FF' : 
                 marker.listing.isDisliked ? '#AA0000' : '#FF0000';
    
    const mapMarker = new maplibregl.Marker({ color })
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

  /** Create a cluster marker with updated click behavior */
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
    // Store listing IDs on the element for hover detection
    el.dataset.listingIds = cluster.listingIds.join(',');
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      useVisibleListingsStore.getState().setVisibleListingIds(cluster.listingIds);
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

  /** Update marker colors based on state */
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
      const correspondingMarker = localMarkers.find(m => m.listing.id === id);
      
      if (isFullscreen && selectedMarker?.listing.id === id) {
        setColor(marker, '#404040', '2');
      } else if (hoveredListing?.id === id || (!isFullscreen && clickedMarkerId === id)) {
        setColor(marker, '#404040', '2');
      } else if (correspondingMarker?.listing.isLiked) {
        setColor(marker, '#0000FF');
      } else if (correspondingMarker?.listing.isDisliked) {
        setColor(marker, '#AA0000');
      } else {
        setColor(marker, '#FF0000');
      }
    });

    clusterMarkersRef.current.forEach((marker) => {
      const el = marker.getElement();
      const listingIdsStr = el.dataset.listingIds || '';
      const clusterListingIds = listingIdsStr.split(',');
      const isHovered = hoveredListing && clusterListingIds.includes(hoveredListing.id);
      const isClicked = !isFullscreen && clickedCluster && clusterListingIds.join('-') === clickedCluster.listingIds.join('-');

      if (isHovered || isClicked) {
        setColor(marker, '#404040', '2'); // Highlight color
      } else {
        setColor(marker, '#FF0000', '1'); // Default color
      }
    });
  };

  // **Map Initialization and Event Handlers**
  useEffect(() => {
    if (!mapContainerRef.current || !center) return;

    let mapRenderZoom = currentZoom || zoom || 12;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center,
      zoom: mapRenderZoom,
      scrollZoom: true,
    });
    mapRef.current = map;
    setMapLoaded(true);

    const updateMarkers = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      updateVisibleMarkers();
      const newClusters = createClusters(newZoom);
      setClusters(newClusters);
      renderMarkers(newClusters, newZoom);
      updateMarkerColors();
    };

    map.on('load', updateMarkers);
    map.on('zoomend', updateMarkers);
    map.on('moveend', () => {
      updateVisibleMarkers();
      updateMarkers();
    });
    map.on('click', () => {
      setSelectedMarker(null);
      setClickedCluster(null);
      if (!isFullscreen) {
        setClickedMarkerId(null);
        updateVisibleMarkers();
      }
    });

    return () => {
      map.remove();
      markersRef.current.clear();
      clusterMarkersRef.current.clear();
    };
  }, [center, zoom, isFullscreen]);

  // **State Sync Effects**
  useEffect(() => {
    // This no longer directly watches TripContext state
    // It now watches local filter and search radius changes instead
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
    setTimeout(updateVisibleMarkers, 300);
  }, [filters, searchRadius, queryParams]);

  useEffect(updateMarkerColors, [hoveredListing, clickedMarkerId, selectedMarker, clickedCluster, isFullscreen, localMarkers]);

  useEffect(() => {
    if (!isFullscreen && mapRef.current) {
      updateVisibleMarkers();
      const newClusters = createClusters(currentZoom);
      setClusters(newClusters);
      renderMarkers(newClusters, currentZoom);
    }
  }, [isFullscreen, localMarkers]);


  const handleFullscreen = () => {
    let newZoom = isFullscreen ? currentZoom - 1 : currentZoom + 1;
    let maxZoom = Math.min(newZoom, 14);

    setCurrentZoom(maxZoom);
    setIsFullscreen(!isFullscreen);
  }

  // **Render**
  return (
    <div style={{ height }} ref={mapContainerRef} data-center={center?.join(',')}>
      {mapLoaded && (
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
                  onLike={() => handleLike(selectedMarker.listing.id)}
                  onDislike={() => handleDislike(selectedMarker.listing.id)}
                />
              </div>
              <div className="block md:hidden">
                <DesktopListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
                  onLike={() => handleLike(selectedMarker.listing.id)}
                  onDislike={() => handleDislike(selectedMarker.listing.id)}
                  className="top-4 left-1/2 transform -translate-x-1/2 w-96"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SearchMapRefactored;