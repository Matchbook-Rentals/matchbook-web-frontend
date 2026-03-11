'use client';

import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPlaceholderProps {
  latitude: number;
  longitude: number;
}

export default function MapPlaceholder({ latitude, longitude }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [longitude, latitude],
      zoom: 14,
      scrollZoom: true,
      dragPan: true,
      dragRotate: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
    });

    mapRef.current = map;

    new maplibregl.Marker({ color: '#095859' }).setLngLat([longitude, latitude]).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="relative h-[600px] lg:h-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-white p-2 rounded-md shadow hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-white p-2 rounded-md shadow hover:bg-gray-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
