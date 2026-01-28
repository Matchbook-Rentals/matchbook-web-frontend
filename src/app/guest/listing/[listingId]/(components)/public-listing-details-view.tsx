'use client'
import React, { useRef, useState } from 'react';
import ListingImageCarousel from '@/app/app/rent/searches/(trips-components)/image-carousel';
import { ListingAndImages } from '@/types';
import ListingDescription from '@/app/app/rent/searches/(trips-components)/listing-info';
import PublicListingDetailsBox from './public-listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent } from '@/components/ui/card';

interface PublicListingDetailsViewProps {
  listing: ListingAndImages;
  locationString: string;
  isAuthenticated?: boolean;
  tripContext?: { tripId?: string; startDate: Date; endDate: Date } | null;
  calculatedPrice?: number | null;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
  onApplyClick?: () => void;
  showDatePopover?: boolean;
  onDatePopoverChange?: (open: boolean) => void;
  onDatesSelected?: (start: Date, end: Date) => void;
}

export default function PublicListingDetailsView({
  listing,
  locationString,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
  onApplyClick,
  showDatePopover,
  onDatePopoverChange,
  onDatesSelected,
}: PublicListingDetailsViewProps) {
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

  return (
    <>
      <div className="w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6">
        <ListingImageCarousel listingImages={listing.listingImages || []} maxHeight={420} />

        <div className="flex justify-between gap-x-8 lg:gap-x-16 relative">
          <div className="w-full lg:w-full">
            <ListingDescription listing={listing} />

            <Card className="border-none shadow-none rounded-xl mt-5">
              <CardContent className="flex flex-col items-start gap-[18px] p-5">
                <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">Location</h3>
                <div className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                  {locationString}
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="w-1/2 mt-6 h-fit lg:w-full rounded-[12px] shadow-md pr-0 min-w-[375px] max-w-[400px] sticky top-[10%] hidden lg:block"
          >
            <PublicListingDetailsBox
              listing={listing}
              isAuthenticated={isAuthenticated}
              tripContext={tripContext}
              calculatedPrice={calculatedPrice}
              listingState={listingState}
              onApplyClick={onApplyClick}
              showDatePopover={showDatePopover}
              onDatePopoverChange={onDatePopoverChange}
              onDatesSelected={onDatesSelected}
            />
          </div>
        </div>

        {/* Map section */}
        <div className="pb-20 md:pb-0 mt-0" ref={locationSectionRef}>
          <div className="w-full h-[526px] mt-4 relative rounded-[12px]" ref={mapContainerRef}>
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
