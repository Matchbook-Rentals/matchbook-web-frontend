import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { RejectIcon } from '@/components/icons';
import Image from 'next/image';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
  listing?: {
    listingImages: string[];
    price: number;
    title: string;
    distance: string;
  };
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
  const { shouldPanTo, clearPanTo } = useListingHoverStore();
  const [selectedListing, setSelectedListing] = React.useState<MapMarker | null>(null);

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
          console.log('Marker clicked:', marker);
          setSelectedListing(marker);
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
        duration: 1500,
        zoom: zoom
      });
      clearPanTo();
    }
  }, [shouldPanTo, clearPanTo, zoom]);

  // Debug log to show selected listing
  console.log('Selected listing:', selectedListing);

  return (
    <div style={{ height }} ref={mapContainerRef}>
      {/* Listing small Card (stretches between left and zoom controls) */}
      {selectedListing && selectedListing.listing && (
        <div className="absolute top-2 left-2 right-[50px] z-10 bg-white shadow-lg border border-gray-200 rounded-lg">
          {/* Image spanning full width on the top half */}
          <div className="relative h-40 w-full">
            <Image
              src={selectedListing.listing.listingImages[0].url}
              alt={selectedListing.listing.title}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
          {/* Details in the lower half */}
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{selectedListing.listing.title}</h3>
              <button onClick={() => setSelectedListing(null)} className="p-2">
                <RejectIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-gray-600">{selectedListing.listing.distance}</p>
            <p className="mt-1 font-bold">${selectedListing.listing.price}</p>
          </div>
        </div>
      )}

      {/* Close button */}
      <div className="absolute bottom-[10vh] left-1/2 transform -translate-x-1/2 z-10">
        <Button
          onClick={onClose}
          className="gap-x-2 px-5 max-w-[300px] text-[16px] font-montserrat font-medium rounded-full bg-charcoalBrand text-background"
        >
          <RejectIcon className="h-5 w-5 mb-[2px]" />
          Close
        </Button>
      </div>

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