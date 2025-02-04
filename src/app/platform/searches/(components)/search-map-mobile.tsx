import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { RejectIcon } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
  listing?: {
    listingImages: { url: string }[];
    price: number;
    title: string;
    distance: number;
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

    // Handler for clicking on the map background
    const handleMapClick = () => {
      setSelectedListing(null);
    };
    map.on('click', handleMapClick);

    // Add marker with click handlers that stop propagation
    markers.forEach(marker => {
      new maplibregl.Marker({
        color: marker.color || '#FF0000'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map)
        .getElement()
        .addEventListener('click', (e) => {
          // Prevent the map click event from firing
          e.stopPropagation();
          console.log('Marker clicked:', marker);
          setSelectedListing(marker);
        });
    });

    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.remove();
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

  console.log('Selected listing:', selectedListing);

  return (
    <div style={{ height }} className="font-montserrat" ref={mapContainerRef}>
      {/* Listing Card */}
      {selectedListing && selectedListing.listing && (
        <div className="absolute top-2 left-2 right-[50px] z-10 bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
          {/* Carousel Image Container */}
          <div className="relative h-40 w-full">
            <Carousel keyboardControls={false}>
              <CarouselContent>
                {selectedListing.listing.listingImages.map((image, index) => (
                  <CarouselItem key={index} className="relative h-40 w-full">
                    <Image
                      src={image.url}
                      alt={selectedListing.listing.title}
                      fill
                      className="object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* The arrows below will only be visible from "sm" and up */}
              <div className="hidden sm:block">
                <CarouselPrevious className="z-20" />
                <CarouselNext className="z-20" />
              </div>
            </Carousel>
          </div>

          {/* Content Container */}
          <div className="p-4 space-y-2">
            {/* Title */}
            <h3 className="font-semibold text-xl leading-tight tracking-tight text-gray-900">
              {selectedListing.listing.title}
            </h3>

            {/* Distance */}
            <p className="text-sm font-medium text-gray-500">
              {selectedListing.listing.distance.toFixed(1)} miles away
            </p>

            {/* Price and CTA Row */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-lg font-bold text-gray-900">
                ${selectedListing.listing.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>

              <button
                onClick={() => setSelectedListing(null)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                See More
              </button>
            </div>
          </div>
        </div>
      )}

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
