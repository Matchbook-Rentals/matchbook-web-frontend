'use client'
import React, { useCallback, useRef, useState } from 'react';
import ListingImageCarousel from '@/app/app/rent/searches/(trips-components)/image-carousel';
import { ListingAndImages } from '@/types';
import ListingDescription from '@/app/app/rent/searches/(trips-components)/listing-info';
import PublicListingDetailsBox from './public-listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import ShareButton from '@/components/ui/share-button';
import { BrandButton } from '@/components/ui/brandButton';
import { format } from 'date-fns';


interface PublicListingDetailsViewProps {
  listing: ListingAndImages;
  locationString: string;
  isAuthenticated?: boolean;
  tripContext?: {
    tripId?: string;
    startDate: Date;
    endDate: Date;
    numAdults?: number;
    numChildren?: number;
    numPets?: number;
  } | null;
  calculatedPrice?: number | null;
  listingState?: { hasApplied: boolean; isMatched: boolean } | null;
  onApplyClick?: () => void;
  onDatesSelected?: (start: Date, end: Date, guests: { adults: number; children: number; pets: number }) => void;
}

const baseUrl = process.env.NEXT_PUBLIC_URL || "https://matchbookrentals.com";

export default function PublicListingDetailsView({
  listing,
  locationString,
  isAuthenticated = false,
  tripContext = null,
  calculatedPrice = null,
  listingState = null,
  onApplyClick,
  onDatesSelected,
}: PublicListingDetailsViewProps) {
  const [mapCenter] = useState<[number, number]>([listing.longitude, listing.latitude]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);

  // Mobile footer state
  const [mobileState, setMobileState] = useState<{
    hasDates: boolean;
    startDate: Date | null;
    endDate: Date | null;
    guests: { adults: number; children: number; pets: number };
  }>({ hasDates: false, startDate: null, endDate: null, guests: { adults: 0, children: 0, pets: 0 } });
  const [requestOpenDates, setRequestOpenDates] = useState(0);
  const [requestApply, setRequestApply] = useState(0);
  const handleMobileStateChange = useCallback((state: typeof mobileState) => {
    setMobileState(state);
  }, []);

  // Price range for footer
  const getPriceRange = () => {
    if (!listing.monthlyPricing || listing.monthlyPricing.length === 0) {
      return { min: listing.price || 0, max: listing.price || 0, hasRange: false };
    }
    const prices = listing.monthlyPricing.map(p => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices), hasRange: Math.min(...prices) !== Math.max(...prices) };
  };
  const priceRange = getPriceRange();

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
        {/* Title and Share Button - Above Image Carousel */}
        <div className="mb-4">
          {/* Desktop Title and Share Button */}
          <div className="hidden lg:flex items-center justify-between">
            <h1 className="font-medium text-[#404040] text-[32px] tracking-[-2.00px] font-['Poppins',Helvetica]">
              {listing.title || "Your Home Away From Home"}
            </h1>
            <ShareButton
              title={`${listing.title} on MatchBook`}
              text={`Check out this listing on MatchBook!`}
              url={`${baseUrl}/search/listing/${listing.id}`}
            />
          </div>
          
          {/* Mobile Title and Share Button */}
          <div className="flex lg:hidden items-center justify-between">
            <h2 className="flex-1 font-medium text-[#404040] text-xl md:text-2xl tracking-[-2.00px] font-['Poppins',Helvetica]">
              {listing.title || "Your Home Away From Home"}
            </h2>
            <ShareButton
              title={`${listing.title} on MatchBook`}
              text={`Check out this listing on MatchBook!`}
              url={`${baseUrl}/search/listing/${listing.id}`}
            />
          </div>
        </div>

        <ListingImageCarousel listingImages={listing.listingImages || []} maxHeight={420} />

        <div className="flex justify-between gap-x-8 lg:gap-x-16 relative">
          <div className="w-full lg:w-full">
            <ListingDescription
              listing={listing}
              isAuthenticated={isAuthenticated}
              tripContext={tripContext}
              calculatedPrice={calculatedPrice}
              listingState={listingState}
              onApplyClick={onApplyClick}
              onDatesSelected={onDatesSelected}
              requestOpenDates={requestOpenDates}
              requestApply={requestApply}
              onMobileStateChange={handleMobileStateChange}
            />

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

      {/* Mobile sticky footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-5">
          <div className="flex-1 flex flex-col gap-1">
            {/* Price row */}
            <div className="flex items-center gap-6">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-[#373940] text-sm font-['Poppins'] whitespace-nowrap">
                  {priceRange.hasRange
                    ? `$${priceRange.min.toLocaleString()}– ${priceRange.max.toLocaleString()}`
                    : `$${priceRange.min.toLocaleString()}`
                  }
                </span>
                <span className="font-normal text-[#5d606d] text-xs font-['Poppins']">Per Month</span>
              </div>
              {listing.depositSize && (
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-[#373940] text-sm font-['Poppins'] whitespace-nowrap">
                    ${listing.depositSize.toLocaleString()}
                  </span>
                  <span className="font-normal text-[#5d606d] text-xs font-['Poppins']">Deposit</span>
                </div>
              )}
            </div>
            {/* Dates row */}
            {mobileState.startDate && mobileState.endDate && (
              <div className="text-[#373940] text-[11px] font-normal font-['Poppins'] leading-normal">
                {format(mobileState.startDate, 'd MMM yy')} – {format(mobileState.endDate, 'd MMM yyyy')}
              </div>
            )}
            {/* Guests row */}
            {mobileState.guests.adults > 0 && (
              <div className="text-[#373940] text-[11px] font-normal font-['Poppins'] leading-normal">
                {mobileState.guests.adults} Adult{mobileState.guests.adults !== 1 ? 's' : ''}
                {mobileState.guests.children > 0 && `, ${mobileState.guests.children} Kid${mobileState.guests.children !== 1 ? 's' : ''}`}
                {mobileState.guests.pets > 0 && `, ${mobileState.guests.pets} Pet${mobileState.guests.pets !== 1 ? 's' : ''}`}
              </div>
            )}
          </div>
          <BrandButton
            size="lg"
            className="min-w-[160px] font-semibold"
            onClick={() => {
              if (mobileState.hasDates) {
                setRequestApply(prev => prev + 1);
              } else {
                setRequestOpenDates(prev => prev + 1);
              }
            }}
          >
            {mobileState.hasDates ? 'Apply Now' : 'Check Availability'}
          </BrandButton>
        </div>
      </footer>
    </>
  );
}
