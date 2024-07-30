import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

interface SearchMapProps {
  center: { lat: number; lng: number };
  markers?: MapMarker[]; // Made optional
  zoom?: number;
}

const SearchMap: React.FC<SearchMapProps> = ({ center = { lat: 0, lng: 0 }, markers = [], zoom = 1 }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
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
  );
};

export default SearchMap;