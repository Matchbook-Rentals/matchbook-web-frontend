'use client'
import React, { useRef, useState } from 'react';
import ListingImageCarousel from './image-carousel';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import ListingDescription from './listing-info';
import SearchListingDetailsBox from '../../searches/(components)/search-listing-details-box';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BrandHeart, RejectIcon } from '@/components/icons';

interface ListingDetailsViewProps {
  listingId: string;
}

export default function SearchListingDetailsView({ listingId }: ListingDetailsViewProps) {
  const { state, actions } = useTripContext();
  const listing = state.listings.find(l => l.id === listingId);

  // Early exit _before_ rendering the inner component that uses hooks
  if (!listing) {
    return <div>Listing not found</div>;
  }

  return <ListingDetailsView listing={listing} actions={actions} />;
}

function ListingDetailsView({
  listing,
  actions,
}: {
  listing: ListingAndImages;
  actions: ReturnType<typeof useTripContext>["actions"];
}) {
  const { state } = useTripContext();
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;
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

  const handleLike = async () => {
    await optimisticLike(listing.id);
  };

  const handleReject = async () => {
    await optimisticDislike(listing.id);
  };

  // Desktop action buttons
  const DesktopActionButtons = () => (
    <div className="flex items-center gap-x-3">
      <button
        onClick={handleReject}
        className={`w-[50px] drop-shadow aspect-square
          flex items-center justify-center rounded-full
          hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]`}
      >
        <RejectIcon className={`w-[60%] h-[60%] text-white`} />
      </button>

      <button
        onClick={handleLike}
        className={`w-[50px] drop-shadow aspect-square flex
          items-center justify-center rounded-full
          hover:opacity-90 transition-opacity
          bg-gradient-to-br from-[#A3B899] to-[#5F6F58]`}
      >
        <BrandHeart className={`w-[60%] h-[60%]`} />
      </button>
    </div>
  );

  return (
    <>
      {/* Conditionally rendered top control box */}
      {!isDetailsVisible && (
        <div className="hidden lg:block sticky top-0 bg-background z-50 py-4 px-0 border-b-2 border-gray-200">
          <div className='flex justify-between items-center'>
            <div className='flex flex-col'>
              <p className='text-lg font-medium'>{listing.title}</p>
              <p className='text-sm'>Hosted by {listing.user?.firstName}</p>
            </div>
            <div className='flex items-center gap-x-4'>
              <p className='text-lg font-medium'>${listing.price?.toLocaleString()}/month</p>
              <DesktopActionButtons />
            </div>
          </div>
        </div>
      )}

      <div className={`w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6`}>
        <ListingImageCarousel
          listingImages={listing.listingImages || []}
        />
        <div className='flex justify-between gap-x-8 relative'>
          <ListingDescription listing={listing} />
          <div
            className="w-1/2 h-fit lg:w-3/5 sticky top-[10%] hidden lg:block"
          >
            <SearchListingDetailsBox
              listing={listing}
              onReject={handleReject}
              onLike={handleLike}
              onReturn={() => { }}
              setIsDetailsVisible={setIsDetailsVisible}
            />
          </div>
        </div>

        {/* Location section */}
        <div className="pb-3 mt-3" ref={locationSectionRef}>
          <h3 className="text-[24px] text-[#404040] font-medium mb-4">Location</h3>

          <div className="pb-3 text-[#404040] text-[20px] font-normal">
            {listing.distance >= 10
              ? <p>{listing.distance?.toFixed(0)} miles from {state.trip.locationString} </p>
              : <p>{listing.distance?.toFixed(1)} miles from {state.trip.locationString} </p>}

          </div>

          <div className="w-full h-[526px] mt-4 relative" ref={mapContainerRef} >
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
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden fixed sm:bottom-[20px] bottom-[80px] left-0 right-0 z-50">
          <div className="flex justify-center items-center gap-y-4 gap-x-6 my-4">
            <button
              onClick={handleReject}
              className={`w-[80px] drop-shadow aspect-square
                flex items-center justify-center rounded-full
                hover:opacity-90 transition-opacity bg-gradient-to-br from-[#E697A2] to-[#B6767C]`}
            >
              <RejectIcon className={`w-[40%] h-[40%] text-white`} />
            </button>

            <button
              onClick={handleLike}
              className={`w-[80px] drop-shadow aspect-square flex
                items-center justify-center rounded-full
                hover:opacity-90 transition-opacity
                bg-gradient-to-br from-[#A3B899] to-[#5F6F58]`}
            >
              <BrandHeart className={`w-[40%] h-[40%]`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
