import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
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
  height = '526px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
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

  // Handle panning to hovered location with debounce
  useEffect(() => {
    if (!mapRef.current || !shouldPanTo) return;

    const timeoutId = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [shouldPanTo.lng, shouldPanTo.lat],
          duration: 1500,
          zoom: zoom
        });
        clearPanTo();
      }
    }, 1000); // 1000ms debounce

    return () => clearTimeout(timeoutId);
  }, [shouldPanTo, clearPanTo, zoom]);

  return (
    <div style={{ height }} ref={mapContainerRef}>
      {/* Host Card */}
      {selectedMarker && (
        <div
          className="absolute top-2 left-2 right-[50px] z-10 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden p-2 "
          key={selectedMarker.listing.id}
        >
          <div className="flex items-center gap-4">
            {/* Host Image */}
            <div className="relative h-16 w-16 rounded-full overflow-hidden">
              <img
                src={selectedMarker.listing.user.imageUrl}
                alt={selectedMarker.listing.user.firstName}
                className="object-cover"
              />
            </div>

            {/* Host Info */}
            <div className="flex-1">
              <p className="text-sm text-gray-600">Hosted by {selectedMarker.listing.user.fullName || selectedMarker.listing.user.firstName}</p>
              <h3 className="font-semibold text-lg text-gray-900">
                {selectedMarker.listing.user.fullName}
              </h3>
              <p className="text-sm text-gray-500">
                Been on Matchbook since{' '}
                {format(new Date(selectedMarker.listing.user.createdAt), 'MMMM yyyy')}
              </p>
            </div>
          </div>
        </div>
      )}

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
