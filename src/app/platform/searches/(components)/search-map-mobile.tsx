import React, { useRef, useEffect } from 'react';
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
}

const SearchMapMobile: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  onClose
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const { shouldPanTo, clearPanTo } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();

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

  // Create clusters based on visible markers and current zoom level
  const createClusters = (currentZoom: number): ClusterMarker[] => {
    if (!mapRef.current) return [];
    const clusterRadius = Math.max(40, 100 - currentZoom * 4);
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

  // Initial map setup with clustering
  useEffect(() => {
    if (!mapContainerRef.current || !center) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: center,
      zoom: zoom,
      scrollZoom: false,
    });

    mapRef.current = map;

    // Handler for clicking on the map background
    const handleMapClick = () => {
      setSelectedMarker(null);
    };
    map.on('click', handleMapClick);

    // Function to update markers and clusters
    const updateMarkers = () => {
      if (!mapRef.current) return;
      const currentZoom = mapRef.current.getZoom();
      const newClusters = createClusters(currentZoom);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      clusterMarkersRef.current.forEach(marker => marker.remove());
      clusterMarkersRef.current.clear();

      // Add new markers or clusters
      newClusters.forEach(cluster => {
        if (cluster.count === 1) {
          // Individual marker
          const markerData = markers.find(m => m.listing.id === cluster.listingIds[0]);
          if (markerData) {
            const mapMarker = new maplibregl.Marker({ color: markerData.color || '#FF0000' })
              .setLngLat([markerData.lng, markerData.lat])
              .addTo(mapRef.current);
            mapMarker.getElement().addEventListener('click', (e) => {
              e.stopPropagation();
              setSelectedMarker(markerData);
            });
            markersRef.current.set(markerData.listing.id, mapMarker);
          }
        } else {
          // Cluster marker
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
          const clusterId = `cluster-${cluster.listingIds.join('-')}`;
          clusterMarkersRef.current.set(clusterId, clusterMarker);
        }
      });
    };

    // Set up event listeners
    map.on('load', updateMarkers);
    map.on('zoomend', updateMarkers);
    map.on('moveend', updateMarkers);

    // Cleanup
    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.off('load', updateMarkers);
        map.off('zoomend', updateMarkers);
        map.off('moveend', updateMarkers);
        map.remove();
        mapRef.current = null;
        markersRef.current.clear();
        clusterMarkersRef.current.clear();
      }
    };
  }, [center, markers, zoom, setSelectedMarker]);

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

  return (
    <div style={{ height }} className="font-montserrat" ref={mapContainerRef}>
      {/* Listing Card */}
      {selectedMarker && selectedMarker.listing && center && (
        <ListingCard
          listing={selectedMarker.listing}
          distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
          onClose={() => setSelectedMarker(null)}
          className="top-2 w-full z-40"
        />
      )}

      <Button
        onClick={onClose}
        className="fixed bottom-[13vh] left-1/2 transform -translate-x-1/2 z-50 gap-x-2 px-5 max-w-[300px] text-[16px] font-montserrat font-medium rounded-full bg-charcoalBrand text-background"
      >
        <RejectIcon className="h-5 w-5 mb-[2px]" />
        Close
      </Button>

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
    </div>
  );
};

export default SearchMapMobile;
