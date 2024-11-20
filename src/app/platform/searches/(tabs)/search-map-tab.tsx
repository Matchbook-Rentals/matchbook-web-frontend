import React, { useState } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';
import { ListingAndImages } from '@/types';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

const MapView: React.FC = () => {
  const { state } = useTripContext();
  const [showRejected, setShowRejected] = useState(false);

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
  const markers: MapMarker[] = state.listings.map((listing) => ({
    title: listing.title,
    lat: listing.latitude,
    lng: listing.longitude,
    color: getListingStatus(listing)
  }));

  const defaultCenter = { lat: 0, lng: 0 };
  const mapCenter = center ? { lat: center.lat, lng: center.lng } : defaultCenter;

  const displayListings = showRejected
    ? state.dislikedListings
    : state.listings.filter(listing => !state.lookup.dislikedIds.has(listing.id));

  return (
    <div className='h-[100vh]'>
      <div className='px-2 w-full mb-2 flex justify-between'>
        <h2 className='text-left text-xl'>
          {showRejected
            ? 'A second chance perhaps?'
            : `Listings for ${state.trip.locationString}`}
        </h2>
        <h2
          className='text-left text-base font-medium underline cursor-pointer'
          onClick={() => setShowRejected(!showRejected)}
        >
          {showRejected ? 'Show All Properties' : 'Show Rejected Properties'}
        </h2>
      </div>

      <div className="mx-auto px-2 w-full flex flex-col-reverse md:flex-row items-center gap-x-4">
        <div className="w-full md:w-2/3">
          <SearchListingsGrid
            listings={displayListings}
          />
        </div>
        <div className="w-full md:w-1/3 h-[640px]">
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
    </div>

  );
};

export default MapView;
