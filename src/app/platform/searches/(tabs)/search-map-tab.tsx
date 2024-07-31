import React, { useState } from 'react';
import { useSearchContext } from '@/contexts/search-context-provider';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

const MapView: React.FC = () => {
  const { state } = useSearchContext();
  const { listings } = state;

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

  const listingsWithStatus = listings.map((listing) => ({
    ...listing,
    status: getListingStatus(listing)
  }));

  const center = { lat: state.currentSearch?.latitude, lng: state.currentSearch?.longitude };
  const markers: MapMarker[] = state.listings.map((listing) => ({
    title: listing.title,
    lat: listing.latitude,
    lng: listing.longitude,
    color: getListingStatus(listing)
  }));

  const defaultCenter = { lat: 0, lng: 0 };
  const mapCenter = center ? { lat: center.lat, lng: center.lng } : defaultCenter;

  return (
    <div className="mx-auto px-2 flex gap-x-4">
      <div className="w-1/2">
        <SearchListingsGrid
          listings={state.listings}
        />
      </div>
      <div className="w-1/2">
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