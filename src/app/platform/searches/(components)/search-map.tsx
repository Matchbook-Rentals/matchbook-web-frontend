import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Image from 'next/image';
import ListingCard from './map-click-listing-card';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useSearchParams } from 'next/navigation';

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const highlightedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const updateVisibleMarkersRef = useRef<() => void>();
  const { shouldPanTo, clearPanTo, hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);

  const {state} = useTripContext();
  const {filters, trip} = state;
  const {searchRadius} = trip;
  const queryParams = useSearchParams();

  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setTimeout(() => {
      updateVisibleMarkersRef.current?.();
    }, 300);
  }, [filters, searchRadius, queryParams]);


  // Function to calculate distance between two lat/lng points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize map and set up markers
  useEffect(() => {
    if (!mapContainerRef.current || !center) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: center,
      zoom: zoom,
      scrollZoom: false,
    });

    mapRef.current = map;
    setMapLoaded(true);

    // Define updateVisibleMarkers before using it in event listeners
    const updateVisibleMarkers = () => {
      const bounds = map.getBounds();
      const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .map(marker => marker.listing.id);
      useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
    };

    // Store the updateVisibleMarkers function in the ref for later use
    updateVisibleMarkersRef.current = updateVisibleMarkers;

    // Close card when clicking on the map background
    const handleMapClick = () => {
      setSelectedMarker(null);
      if (!isFullscreen) {
        updateVisibleMarkers();
        setClickedMarkerId(null);
      }
    };
    map.on('click', handleMapClick);

    markers.forEach(marker => {
      const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      
      mapMarker.getElement().style.cursor = 'pointer';
      

      // Updated: use Zustand store to set the marker on click based on fullscreen state
      mapMarker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isFullscreen) {
          setClickedMarkerId(curr => {
            if (curr === marker.listing.id) {
              updateVisibleMarkers();
              return null; // toggle off if already clicked
            } else {
              useVisibleListingsStore.getState().setVisibleListingIds([marker.listing.id]);
              return marker.listing.id;
            }
          });
        } else {
          setSelectedMarker((prev) => (prev?.listing.id === marker.listing.id ? null : marker));
        }
      });

      markersRef.current.set(marker.listing.id, mapMarker);
    });

    map.on('moveend', updateVisibleMarkers);

    // Cleanup
    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.off('moveend', updateVisibleMarkers);
        map.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      highlightedMarkerRef.current = null;
    };
  }, [center, markers, zoom, isFullscreen, setSelectedMarker]);

  // New useEffect to listen for changes in trip.filters and trip.searchRadius
  useEffect(() => {
    if (updateVisibleMarkersRef.current && mapRef.current) {
      updateVisibleMarkersRef.current();
    }
  }, [filters, searchRadius]);

  // Update marker colors based on hovered listing, clicked marker, and selected marker in fullscreen
  useEffect(() => {
    const setMarkerColor = (marker: maplibregl.Marker, color: string, zIndex: string = '') => {
      const markerElement = marker.getElement();
      const paths = markerElement.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', color);
      });
      markerElement.style.zIndex = zIndex;
    };

    if (isFullscreen) {
      if (selectedMarker) {
        markersRef.current.forEach((marker, id) => {
          if (id === selectedMarker.listing.id) {
            setMarkerColor(marker, '#404040', '1');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else if (hoveredListing) {
        markersRef.current.forEach((marker, id) => {
          if (id === hoveredListing.id) {
            setMarkerColor(marker, '#404040', '1');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else {
        markersRef.current.forEach(marker => {
          setMarkerColor(marker, '#FF0000', '');
        });
      }
    } else {
      if (clickedMarkerId) {
        markersRef.current.forEach((marker, id) => {
          if (id === clickedMarkerId) {
            setMarkerColor(marker, '#404040', '1');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else if (hoveredListing) {
        markersRef.current.forEach((marker, id) => {
          if (id === hoveredListing.id) {
            setMarkerColor(marker, '#404040', '1');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else {
        markersRef.current.forEach(marker => {
          setMarkerColor(marker, '#FF0000', '');
        });
      }
    }
  }, [hoveredListing, clickedMarkerId, selectedMarker, isFullscreen]);

  // Sync isFullscreen state with browser full-screen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      setSelectedMarker(null);
      setClickedMarkerId(null);
      if (!fs && mapRef.current) {
        const bounds = mapRef.current.getBounds();
        const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
          .map(marker => marker.listing.id);
        useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [markers]);

  return (
    <div style={{ height }} ref={mapContainerRef}>
      {/* Conditionally render controls only after the map is loaded */}
      {mapLoaded && (
        <>
          {/* Zoom controls */}
          <div className="absolute top-2 right-2 z-10 flex flex-col">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="bg-white p-2 rounded-md shadow mb-1"
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
              className="bg-white p-2 rounded-md shadow"
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

          {/* Fullscreen control */}
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={() => {
                if (mapRef.current) {
                  if (!document.fullscreenElement) {
                    mapContainerRef.current?.requestFullscreen();
                    setIsFullscreen(true);
                  } else {
                    document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }
              }}
              className="bg-white p-2 rounded-md shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Updated Detailed Card (only in full-screen) */}
      {selectedMarker && isFullscreen && center && (
        <ListingCard
          listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
          distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
          onClose={() => setSelectedMarker(null)}
          className="top-4 left-1/2 transform -translate-x-1/2 w-96"
        />
      )}
    </div>
  );
};

export default SearchMap;
