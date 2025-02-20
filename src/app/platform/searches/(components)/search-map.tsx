import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Image from 'next/image';
import ListingCard from './map-click-listing-card';

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
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Function to calculate distance between two lat/lng points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize map and set up markers
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

    // Close card when clicking on the map background
    const handleMapClick = () => {
      setSelectedMarker(null);
    };
    map.on('click', handleMapClick);

    markers.forEach(marker => {
      const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);

      // Only set selectedMarker in full-screen mode with a fixed callback that returns a value
      mapMarker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreen) {
          setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
        }
      });

      markersRef.current.set(marker.listing.id, mapMarker);
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      highlightedMarkerRef.current = null;
    };
  }, [center, markers, zoom, isFullscreen]);

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

  // Sync isFullscreen state with browser full-screen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div style={{ height }} ref={mapContainerRef}>
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

      {/* Fullscreen control */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={() => {
            if (mapRef.current) {
              if (!document.fullscreenElement) {
                mapContainerRef.current?.requestFullscreen();
                setIsFullscreen(true);
              } else {
                document.exitFullscreen();
                setIsFullscreen(false);
              }
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
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      </div>

      {/* Updated Detailed Card (only in full-screen) */}
      {selectedMarker && isFullscreen && center && (
        <ListingCard
          listing={selectedMarker.listing}
          distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
          onClose={() => setSelectedMarker(null)}
          className="top-4 left-1/2 transform -translate-x-1/2 w-96"
        />
      )}
    </div>
  );
};

export default SearchMap;
