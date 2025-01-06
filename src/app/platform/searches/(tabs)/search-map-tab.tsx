import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';
import { ListingAndImages } from '@/types';
import FilterOptionsDialog from './filter-options-dialog';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

interface MapViewProps {
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
}

const MapView: React.FC<MapViewProps> = ({ setIsFilterOpen }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useTripContext();
  const { listings, showListings, likedListings, maybedListings } = state;

  // Using this instead of showListings as we might want to add back in liked/maybed listings
  const displayListings = [...showListings];

  const getListingStatus = (listing: ListingAndImages) => {
    if (state.lookup.requestedIds.has(listing.id)) {
      return 'blue'
    }
    if (state.lookup.dislikedIds.has(listing.id)) {
      return 'black'
    }
    if (state.lookup.favIds.has(listing.id)) {
      return 'green'
    }
    return 'red'
  }

  const listingsWithStatus = state.listings.map((listing) => ({
    ...listing,
    status: getListingStatus(listing)
  }));

  const center = { lat: state.trip?.latitude, lng: state.trip?.longitude };
  const markers: MapMarker[] = displayListings.map((listing) => ({
    title: listing.title,
    lat: listing.latitude,
    lng: listing.longitude,
    color: getListingStatus(listing)
  }));

  const defaultCenter = { lat: 0, lng: 0 };
  const mapCenter = center ? { lat: center.lat, lng: center.lng } : defaultCenter;

  const handleTabChange = (action: 'push' | 'prefetch' = 'push') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'favorites');
    const url = `${pathname}?${params.toString()}`;
    router[action](url);
  };

  return (
    <div className="flex flex-col md:flex-row justify-center mx-auto w-full px-2">
      {/*Grid container*/}
      <div className="w-full md:w-3/5 md:pr-4">
        {displayListings.length > 0 ? (
          <SearchListingsGrid listings={[...showListings]} />
        ) : (
          <div className='flex flex-col items-center justify-center h-[50vh]'>
            {(() => {
              handleTabChange('prefetch');
              return null;
            })()}
            <p>You have {likedListings.length + maybedListings.length} listings in your favorites
              & {listings.length - likedListings.length - maybedListings.length} listings filtered out.</p>
            <div className='flex justify-center gap-x-2'>
              <button
                onClick={() => handleTabChange()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                View Favorites
              </button>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Adjust Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/*Map container*/}
      <div className="w-full md:w-2/5 mt-4 md:mt-0">
        <SearchMap
          center={mapCenter}
          zoom={10}
          markers={markers.map((marker) => ({
            ...marker,
            lat: marker.lat,
            lng: marker.lng
          }))}
        />
      </div>
    </div>
  );
};

export default MapView;
