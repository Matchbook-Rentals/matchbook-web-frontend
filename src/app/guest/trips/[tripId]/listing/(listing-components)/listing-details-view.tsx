'use client'
import React, { useRef, useState } from 'react';
import ListingImageCarousel from '@/app/app/rent/searches/(trips-components)/image-carousel';
import { ListingAndImages } from '@/types';
import ListingDescription from '@/app/app/rent/searches/(trips-components)/listing-info';
import ListingDetailsBox from './listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BrandHeart, RejectIcon } from '@/components/icons';

interface ListingDetailsViewProps {
  listing: ListingAndImages;
  locationString: string;
  calculatedPrice: number;
}

export default function ListingDetailsView({
  listing,
  locationString,
  calculatedPrice,
}: ListingDetailsViewProps) {
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [mapCenter] = useState<[number, number]>([listing.longitude, listing.latitude]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);

  // Set up the map
  React.useEffect(() => {
    if (!mapContainerRef.current || !mapCenter) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: mapCenter,
      zoom: 14,
      scrollZoom: false,
      dragPan: false,
    });

    mapRef.current = map;

    new maplibregl.Marker().setLngLat(mapCenter).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCenter]);

  // Desktop action buttons
  const DesktopActionButtons = () => (
    <div className="flex items-center gap-x-3">
      <button
        className="w-[50px] drop-shadow aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]"
      >
        <RejectIcon className="w-[60%] h-[60%] text-white" />
      </button>

      <button
        className="w-[50px] drop-shadow aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity bg-gradient-to-br from-[#A3B899] to-[#5F6F58]"
      >
        <BrandHeart className="w-[60%] h-[60%]" />
      </button>
    </div>
  );

  return (
    <>

      <div className="w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6">
        <ListingImageCarousel listingImages={listing.listingImages || []} />
        <div className="flex justify-between gap-x-8 relative">
          <ListingDescription listing={listing} />
          <div className="w-1/2 h-fit lg:w-3/5 sticky top-[10%] hidden lg:block">
            <ListingDetailsBox listing={listing} calculatedPrice={calculatedPrice} />
          </div>
        </div>

        {/* Location section */}
        <div className="pb-3 mt-3" ref={locationSectionRef}>
          <h3 className="text-[24px] text-[#404040] font-medium mb-4">Location</h3>
          <div className="w-full h-[526px] mt-4 relative" ref={mapContainerRef}>
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
        </div>
      </div>
    </>
  );
}
