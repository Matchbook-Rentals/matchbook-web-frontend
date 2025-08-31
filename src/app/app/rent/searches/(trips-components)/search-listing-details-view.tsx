'use client'
import React, { useRef, useState } from 'react';
import ListingImageCarousel from './image-carousel';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import ListingDescription from './listing-info';
import ListingDetailsBoxWithState from './listing-details-box-with-state';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BrandHeart, RejectIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ListingDetailsViewProps {
  listingId: string;
  className?: string;
  hideLocationSection?: boolean;
  showFullAmenities?: boolean;
  lowerActionButtons?: boolean;
}

export default function SearchListingDetailsView({ 
  listingId, 
  className, 
  hideLocationSection, 
  showFullAmenities,
  lowerActionButtons 
}: ListingDetailsViewProps) {
  const { state, actions } = useTripContext();
  const listing = state.listings.find(l => l.id === listingId);

  // Early exit _before_ rendering the inner component that uses hooks
  if (!listing) {
    return <div>Listing not found</div>;
  }

  return (
    <ListingDetailsView 
      listing={listing} 
      actions={actions} 
      className={className} 
      hideLocationSection={hideLocationSection} 
      showFullAmenities={showFullAmenities}
      lowerActionButtons={lowerActionButtons}
    />
  );
}

function ListingDetailsView({
  listing,
  actions,
  className,
  hideLocationSection = false,
  showFullAmenities = false,
  lowerActionButtons = false,
}: {
  listing: ListingAndImages;
  actions: ReturnType<typeof useTripContext>["actions"];
  className?: string;
  hideLocationSection?: boolean;
  showFullAmenities?: boolean;
  lowerActionButtons?: boolean;
}) {
  const { state } = useTripContext();
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;
  
  // Check current like/dislike state for mobile buttons
  const isLiked = state.lookup.favIds.has(listing.id);
  const isDisliked = state.lookup.dislikedIds.has(listing.id);
  const [isDetailsVisible, setIsDetailsVisible] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => [listing.longitude, listing.latitude]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);

  // All hooks in this component are always called in the same order.
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

    new maplibregl.Marker()
      .setLngLat(mapCenter)
      .addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapCenter, listing]);

  // Add this helper function for scroll to top behavior
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async () => {
    scrollToTop();
    if (isLiked) {
      // Undo like
      await optimisticRemoveLike(listing.id);
    } else {
      // Like the listing
      await optimisticLike(listing.id, true);
    }
  };

  const handleReject = async () => {
    scrollToTop();
    if (isDisliked) {
      // Undo dislike
      await optimisticRemoveDislike(listing.id);
    } else {
      // Dislike the listing
      await optimisticDislike(listing.id);
    }
  };


  return (
    <>
      <div className={cn("w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6", className)}>
        <ListingImageCarousel
          listingImages={listing.listingImages || []}
        />
        <div className='flex justify-between gap-x-8 relative'>
          <ListingDescription listing={listing} showFullAmenities={showFullAmenities} />
          <div
            className="w-1/2 mt-6 h-fit lg:w-full rounded-[12px] shadow-md pr-0 min-w-[375px] max-w-[400px] sticky top-[10%] hidden lg:block"
          >
            <ListingDetailsBoxWithState
              listing={listing}
              onReject={handleReject}
              onLike={handleLike}
              onReturn={() => { }}
              setIsDetailsVisible={setIsDetailsVisible}
            />
          </div>
        </div>

        {/* Location section - conditionally rendered */}
        {!hideLocationSection && (
          <Card className="bg-neutral-50 rounded-xl mt-5" ref={locationSectionRef}>
            <CardContent className="flex flex-col items-start gap-[18px] p-5">
              <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">Location</h3>

              <div className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                {listing.distance >= 10
                  ? <p>{listing.distance?.toFixed(0)} miles from {state.trip.locationString} </p>
                  : <p>{listing.distance?.toFixed(1)} miles from {state.trip.locationString} </p>}
              </div>

              <div className="w-full h-[526px] relative" ref={mapContainerRef} >
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
            </CardContent>
          </Card>
        )}

        {/* Mobile Action Buttons */}
        <div className={cn(
          "lg:hidden fixed left-0 right-0 z-50",
          lowerActionButtons ? "sm:bottom-[10px] bottom-[10px]" : "sm:bottom-[20px] bottom-[80px]"
        )}>
          <div className="flex justify-center items-center gap-y-4 gap-x-6 my-4">
            <button
              onClick={handleReject}
              className="w-[80px] drop-shadow aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]"
            >
              <RejectIcon className="w-[40%] h-[40%] text-white" />
            </button>

            <button
              onClick={handleLike}
              className="w-[80px] drop-shadow aspect-square flex items-center justify-center rounded-full hover:opacity-90 transition-opacity bg-gradient-to-br from-[#A3B899] to-[#5F6F58]"
            >
              <BrandHeart className="w-[40%] h-[40%]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
