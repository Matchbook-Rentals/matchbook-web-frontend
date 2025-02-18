import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import { format } from 'date-fns';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  listing: ListingAndImages & {
    user: {
      imageUrl: string;
      fullName: string;
      createdAt: Date;
    };
  };
}

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const highlightedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { shouldPanTo, clearPanTo, hoveredListing } = useListingHoverStore();
  const [selectedMarker, setSelectedMarker] = React.useState<MapMarker | null>(null);

  // Update selected marker when hoveredListing changes
  useEffect(() => {
    if (hoveredListing) {
      const marker = markers.find(m => m.listing.id === hoveredListing.id);
      setSelectedMarker(marker || null);
    } else {
      setSelectedMarker(null);
    }
  }, [hoveredListing, markers]);

  // Initial map setup
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

    markers.forEach(marker => {
      const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      markersRef.current.set(marker.listing.id, mapMarker);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      highlightedMarkerRef.current = null;
    };
  }, [center, markers, zoom]);

  // Update marker colors based on hoveredListing
  useEffect(() => {
    const setMarkerColor = (marker: maplibregl.Marker, color: string) => {
      const markerElement = marker.getElement();
      const paths = markerElement.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', color);
      });
    };

    if (highlightedMarkerRef.current) {
      setMarkerColor(highlightedMarkerRef.current, '#FF0000'); // Default color
    }
    if (hoveredListing) {
      const marker = markersRef.current.get(hoveredListing.id);
      if (marker) {
        setMarkerColor(marker, '#404040'); // Highlighted color
        highlightedMarkerRef.current = marker;
      }
    } else {
      highlightedMarkerRef.current = null;
    }
  }, [hoveredListing]);

  // Handle panning to hovered location with debounce
  useEffect(() => {
    if (!mapRef.current || !shouldPanTo) return;

    const timeoutId = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [shouldPanTo.lng, shouldPanTo.lat],
          duration: 1500,
          zoom: zoom,
        });
        clearPanTo();
      }
    }, 1000); // 1000ms debounce

    return () => clearTimeout(timeoutId);
  }, [shouldPanTo, clearPanTo, zoom]);

  return (
    <div style={{ height }} ref={mapContainerRef}>

      {/* Map controls */}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m6-6H6"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 12H6"
            />
          </svg>
        </button>
        <button
          onClick={() => {
            if (mapRef.current) {
              if (!document.fullscreenElement) {
                mapContainerRef.current?.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }
          }}
          className="bg-white p-2 rounded-md shadow mt-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchMap;
