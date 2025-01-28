import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
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
  height = '526px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { shouldPanTo, clearPanTo } = useListingHoverStore();

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
      new maplibregl.Marker({
        color: marker.color || '#FF0000'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map)
        .getElement().addEventListener('click', () => {
          if (marker.title) {
            alert(marker.title);
          }
        });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, markers, zoom]);

  // Handle panning to hovered location
  useEffect(() => {
    if (mapRef.current && shouldPanTo) {
      mapRef.current.easeTo({
        center: [shouldPanTo.lng, shouldPanTo.lat],
        duration: 800,
        zoom: zoom
      });
      clearPanTo();
    }
  }, [shouldPanTo, clearPanTo, zoom]);

  return (
    <div style={{ height }} ref={mapContainerRef} >
      {/* Map container */}
      <div className="absolute top-2 right-2 z-10 flex flex-col">
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.zoomIn();
            }
          }}
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
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.zoomOut();
            }
          }}
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
      </div>
    </div>
  );
}

export default SearchMap;
