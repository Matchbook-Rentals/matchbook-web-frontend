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

  // Calculate the number of liked/maybed and filtered out listings
  const numFavorites = likedListings.length + maybedListings.length;
  const numFilteredOut = listings.length - likedListings.length - maybedListings.length;

  return (
    <div className="flex flex-col md:flex-row justify-center mx-auto w-full px-2">
      {/*Grid container*/}
      <div className="w-full md:w-3/5 md:pr-4">
        {displayListings.length > 0 ? (
          <SearchListingsGrid listings={[...showListings]} />
        ) : listings.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-[50vh]'>
            <p className="text-gray-600 text-center">
              Sorry, we couldn't find any listings in this area right now.
              <br />
              Please check again later or try different dates.
            </p>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-[50vh]'>
            {(() => {
              if (numFavorites > 0) {
                handleTabChange('prefetch');
              }
              return null;
            })()}
            <p className='font-montserrat-regular text-2xl mb-5'>You&apos;re out of listings!</p>
            <p>You can {numFavorites > 0 ? 'look at your favorites' : ''}{numFavorites > 0 && numFilteredOut > 0 ? ' or ' : ''}{numFilteredOut > 0 ? 'alter your filters' : ''} to see more.</p>

            {(numFavorites > 0 || numFilteredOut > 0) && (
              <p className='mt-3'>
                {numFavorites > 0 && `You have ${numFavorites} listings in your favorites`}
                {numFavorites > 0 && numFilteredOut > 0 && ' & '}
                {numFilteredOut > 0 && `${numFilteredOut} listings filtered out`}
                .
              </p>
            )}

            <div className='flex justify-center gap-x-2 mt-2'>
              {numFilteredOut > 0 && (
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="px-3 py-1 bg-background text-[#404040] rounded-md hover:bg-gray-100 border-2"
                >
                  Adjust Filters
                </button>
              )}
              {numFavorites > 0 && (
                <button
                  onClick={() => handleTabChange()}
                  className="px-4 py-1 bg-[#4F4F4F] text-background rounded-md hover:bg-[#404040]"
                >
                  View Favorites
                </button>
              )}
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
