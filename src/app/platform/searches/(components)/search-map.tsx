import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

interface SearchMapProps {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  zoom?: number;
}

const SearchMap: React.FC<SearchMapProps> = ({ center, markers, zoom = 1 }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.title}
            onClick={() => {
              alert(marker.title);
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default SearchMap;
