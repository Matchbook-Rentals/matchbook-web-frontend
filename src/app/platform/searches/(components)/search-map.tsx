import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
}

interface SearchMapProps {
  center: { lat: number; lng: number };
  markers?: MapMarker[]; // Made optional
  zoom?: number;
  height?: string; // Height prop with default
}

const SearchMap: React.FC<SearchMapProps> = ({ center = { lat: 0, lng: 0 }, markers = [], zoom = 1, height = '600px' }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const mapContainerStyle = {
    width: '100%',
    height,
    minHeight: '200px',
    flex: '1 1 auto',
    display: 'block',
  };

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  const getMarkerIcon = (color: string = 'red') => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      scale: 8,
    };
  };

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
          icon={getMarkerIcon(marker.color)}
          onClick={() => {
            alert(marker.title);
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default SearchMap;
