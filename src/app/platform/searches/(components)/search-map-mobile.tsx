import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { RejectIcon } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import ListingCard from './map-click-listing-card';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';

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
  const { shouldPanTo, clearPanTo } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();

  // Local calculateDistance function
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

  // Initial map setup
  useEffect(() => {
    if (!mapContainerRef.current || !center) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: center,
      zoom: zoom,
      scrollZoom: false,
      attributionControl: false
    });
    
    // Add a custom attribution control that starts collapsed
    map.addControl(new maplibregl.AttributionControl({
      compact: true
    }));

    mapRef.current = map;

    // Handler for clicking on the map background
    const handleMapClick = () => {
      setSelectedMarker(null);
    };
    map.on('click', handleMapClick);

    // Add markers with click handlers that stop propagation
    markers.forEach(marker => {
      new maplibregl.Marker({
        color: marker.color || '#FF0000'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map)
        .getElement()
        .addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Marker clicked:', marker);
          setSelectedMarker(marker);
        });
    });

    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.remove();
        mapRef.current = null;
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

  console.log('Selected marker:', selectedMarker);

  return (
    <div style={{ height }} className="font-montserrat" ref={mapContainerRef}>
      {/* Updated Listing Card using the common component */}
      {selectedMarker && selectedMarker.listing && center && (
        <ListingCard
          listing={selectedMarker.listing}
          distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
          onClose={() => setSelectedMarker(null)}
          className="top-2 left-2 right-[50px]"
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchMapMobile;
