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

const SearchMap: React.FC<SearchMapProps> = ({
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

  /** Create clusters based on visible markers and zoom level */
  const createClusters = (zoomLevel: number): ClusterMarker[] => {
    if (!mapRef.current) return [];
    const clusterRadius = Math.max(40, 100 - zoomLevel * 4); // Dynamic radius based on zoom
    const visited = new Set<string>();
    const newClusters: ClusterMarker[] = [];
    const bounds = mapRef.current.getBounds();
    const visibleMarkers = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)));

    visibleMarkers.forEach(marker => {
      if (visited.has(marker.listing.id)) return;
      const cluster: ClusterMarker = { lat: marker.lat, lng: marker.lng, count: 1, listingIds: [marker.listing.id] };
      visited.add(marker.listing.id);

      visibleMarkers.forEach(otherMarker => {
        if (visited.has(otherMarker.listing.id)) return;
        const distance = calculatePixelDistance(marker.lat, marker.lng, otherMarker.lat, otherMarker.lng);
        if (distance < clusterRadius) {
          cluster.count++;
          cluster.listingIds.push(otherMarker.listing.id);
          cluster.lat = (cluster.lat * (cluster.count - 1) + otherMarker.lat) / cluster.count;
          cluster.lng = (cluster.lng * (cluster.count - 1) + otherMarker.lng) / cluster.count;
          visited.add(otherMarker.listing.id);
        }
      });
      newClusters.push(cluster);
    });
    return newClusters;
  };

  /** Render individual or cluster markers */
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

  /** Create a single marker */
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
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
      if (isFullscreen && selectedMarker?.listing.id === id) {
        setColor(marker, '#404040', '2');
      } else if (hoveredListing?.id === id || (!isFullscreen && clickedMarkerId === id)) {
        setColor(marker, '#404040', '2');
      } else {
        setColor(marker, '#FF0000');
      }
    });

    clusterMarkersRef.current.forEach((marker, id) => {
      if (!isFullscreen && clickedCluster && id === `cluster-${clickedCluster.listingIds.join('-')}`) {
        setColor(marker, '#404040', '2');
      } else {
        setColor(marker, '#FF0000', '1');
      }
    });
  };

  // **Map Initialization and Event Handlers**
  useEffect(() => {
    if (!mapContainerRef.current || !center) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center,
      zoom,
      scrollZoom: false,
    });
    mapRef.current = map;
    setMapLoaded(true);

    const updateMarkers = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      updateVisibleMarkers();
      const newClusters = createClusters(newZoom);
      setClusters(newClusters);
      renderMarkers(newClusters);
      updateMarkerColors();
    };

    map.on('load', updateMarkers);
    map.on('zoomend', updateMarkers);
    map.on('moveend', () => {
      updateVisibleMarkers();
      if (!isFullscreen) updateMarkers();
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
  }, [center, markers, zoom, isFullscreen]);

  // **State Sync Effects**
  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
    setTimeout(updateVisibleMarkers, 300);
  }, [filters, searchRadius, queryParams]);

  useEffect(updateMarkerColors, [hoveredListing, clickedMarkerId, selectedMarker, clickedCluster, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen && mapRef.current) {
      updateVisibleMarkers();
      const newClusters = createClusters(currentZoom);
      setClusters(newClusters);
      renderMarkers(newClusters);
    }
  }, [isFullscreen, markers]);

  // **Render**
  return (
    <div style={{ height }} ref={mapContainerRef}>
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
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="bg-white p-2 rounded-md shadow">
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
                />
              </div>
              <div className="block md:hidden">
                <ListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
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

export default SearchMap;
