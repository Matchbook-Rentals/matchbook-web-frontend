import React from 'react';
import { useSearchContext } from '@/contexts/search-context-proivder';
import SearchListingsGrid from '../(components)/search-listings-grid';
import SearchMap from '../(components)/search-map';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

const MapView: React.FC = () => {
  const { state } = useSearchContext();
  const center = { lat: state.currentSearch?.latitude, lng: state.currentSearch?.longitude };
  const markers: MapMarker[] = state.listings.map((listing) => ({
    title: listing.title,
    lat: listing.latitude,
    lng: listing.longitude
  }));

  const defaultCenter = { lat: 0, lng: 0 };
  const mapCenter = center ? { lat: center.lat, lng: center.lng } : defaultCenter;

  return (
    <div className="mx-auto px-4 flex">
      <div className="w-1/2">
        <SearchListingsGrid listings={state.listings} />
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