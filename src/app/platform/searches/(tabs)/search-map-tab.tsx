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
    <div className="flex flex-col md:flex-row justify-center mx-auto w-full px-2 ">
      {/*Grid container*/}
      <div className="w-full md:w-3/5 md:pr-4">

        <SearchListingsGrid
          listings={displayListings}
        />
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
