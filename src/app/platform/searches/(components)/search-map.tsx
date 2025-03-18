import React, { useRef, useEffect, useState } from 'react';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Image from 'next/image';
import ListingCard from './map-click-listing-card';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useMapFullscreenStore } from '@/store/map-fullscreen-store';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/spinner';

// For client-side only
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const mapRef = useRef<any | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const highlightedMarkerRef = useRef<any | null>(null);
  const updateVisibleMarkersRef = useRef<() => void>();
  const { shouldPanTo, clearPanTo, hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const { isMapFullscreen, setMapFullscreen } = useMapFullscreenStore();
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [maplibreModule, setMaplibreModule] = useState<any>(null);
  // Add a ref to track if the map has been interacted with
  const hasMapInteractionRef = useRef<boolean>(false);

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

  // Dynamically import maplibre-gl library
  useEffect(() => {
    let isMounted = true;
    
    const loadMapLibrary = async () => {
      try {
        // Dynamically import the library
        const maplibregl = await import('maplibre-gl');
        if (isMounted) {
          setMaplibreModule(maplibregl);
        }
      } catch (error) {
        console.error("Failed to load maplibre-gl:", error);
      }
    };
    
    loadMapLibrary();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize map and set up markers
  useEffect(() => {
    if (!mapContainerRef.current || !center || !maplibreModule) return;

    // Initialize the map with the loaded library
    const map = new maplibreModule.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: center,
      zoom: zoom,
      scrollZoom: false,
      attributionControl: false
    });
    
    // Add a custom attribution control that starts collapsed
    map.addControl(new maplibreModule.AttributionControl({
      compact: true
    }));

    // Set map to loaded when it's ready
    map.on('load', () => {
      // Force a resize to ensure map fills container properly
      setTimeout(() => {
        map.resize();
        
        // Add all markers to the map now that it's properly sized
        markersToAdd.forEach(mapMarker => {
          mapMarker.addTo(map);
        });
        
        setMapLoaded(true);
      }, 100);
    });

    mapRef.current = map;

    // Define updateVisibleMarkers before using it in event listeners
    const updateVisibleMarkers = () => {
      // If there has been no interaction, either return all IDs or don't filter
      if (!hasMapInteractionRef.current) {
        // On initial load, show all listings by setting to null
        useVisibleListingsStore.getState().setVisibleListingIds(null);
        return;
      }
      
      // After interaction, filter by visible bounds
      const bounds = map.getBounds();
      const visibleIds = markers.filter(marker => bounds.contains(new maplibreModule.LngLat(marker.lng, marker.lat)))
        .map(marker => marker.listing.id);
      useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
    };

    // Store the updateVisibleMarkers function in the ref for later use
    updateVisibleMarkersRef.current = updateVisibleMarkers;

    // Close card when clicking on the map background
    const handleMapClick = () => {
      // Set interaction flag on map click
      hasMapInteractionRef.current = true;
      
      setSelectedMarker(null);
      if (!isMapFullscreen) {
        updateVisibleMarkers();
        setClickedMarkerId(null);
      }
    };
    map.on('click', handleMapClick);

    // Store markers in a temporary array for later adding to ensure the container is fully ready
    const markersToAdd = [];
    
    markers.forEach(marker => {
      const mapMarker = new maplibreModule.Marker({ color: '#FF0000' })
        .setLngLat([marker.lng, marker.lat]);
      
      markersToAdd.push(mapMarker);
      
      mapMarker.getElement().style.cursor = 'pointer';
      
      // Updated: use Zustand store to set the marker on click based on fullscreen state
      mapMarker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        // Set interaction flag on marker click
        hasMapInteractionRef.current = true;
        
        if (!isMapFullscreen) {
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

      // Store marker in ref for later use
      markersRef.current.set(marker.listing.id, mapMarker);
    });

    // Set up map interaction event handlers
    const handleMapInteraction = () => {
      hasMapInteractionRef.current = true;
    };
    
    // Track user interactions that should trigger filtering
    map.on('dragend', handleMapInteraction);
    map.on('zoomend', handleMapInteraction);
    
    // Update visible markers after map movement ends, but only if there's been interaction
    map.on('moveend', () => {
      updateVisibleMarkers();
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.off('dragend', handleMapInteraction);
        map.off('zoomend', handleMapInteraction);
        map.off('moveend');
        map.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      highlightedMarkerRef.current = null;
      // Reset the interaction flag when unmounting
      hasMapInteractionRef.current = false;
    };
  }, [center, markers, zoom, isMapFullscreen, setSelectedMarker, maplibreModule]);

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

    if (isMapFullscreen) {
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
  }, [hoveredListing, clickedMarkerId, selectedMarker, isMapFullscreen]);

  // Handle effects when fullscreen state changes
  useEffect(() => {
    if (isMapFullscreen) {
      // Actions when entering fullscreen
      setSelectedMarker(null);
      setClickedMarkerId(null);
      
      // Reset the map after a short delay to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
          // End transition state after the map has been resized
          setTimeout(() => {
            setIsTransitioning(false);
          }, 300);
        }
      }, 200);
    } else {
      // Actions when exiting fullscreen
      setSelectedMarker(null);
      setClickedMarkerId(null);
      
      // Update visible listings after exiting fullscreen
      if (mapRef.current) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
            // Only filter by visible markers if there's been a map interaction
            if (hasMapInteractionRef.current && maplibreModule) {
              const bounds = mapRef.current.getBounds();
              const visibleIds = markers.filter(marker => {
                return bounds.contains(new maplibreModule.LngLat(marker.lng, marker.lat));
              }).map(marker => marker.listing.id);
              useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
            } else {
              // Otherwise show all listings
              useVisibleListingsStore.getState().setVisibleListingIds(null);
            }
            // End transition state after the map has been resized
            setTimeout(() => {
              setIsTransitioning(false);
            }, 300);
          }
        }, 200);
      }
    }
  }, [isMapFullscreen, markers, maplibreModule]);
  
  // Also keep sync with browser fullscreen for backward compatibility
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      if (!fs && isMapFullscreen) {
        // If browser fullscreen was exited, also exit our custom fullscreen
        setIsTransitioning(true);
        setTimeout(() => {
          setMapFullscreen(false);
        }, 50);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isMapFullscreen, setMapFullscreen]);
  
  // Handle window resize events to keep markers properly positioned
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial resize to ensure map fits container
    setTimeout(handleResize, 200);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapLoaded]);

  return (
    <div 
      className={`transition-all duration-300 ease-in-out relative w-full h-full ${isMapFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ height: height || '100%', minHeight: '600px' }}
    >
      {/* Map container or loading placeholder */}
      <div 
        ref={mapContainerRef}
        className={`w-full h-full absolute inset-0 overflow-hidden ${!mapLoaded || !maplibreModule ? 'hidden' : ''}`}
      ></div>
      
      {/* Loading placeholder with the same dimensions as the map */}
      {(!mapLoaded || !maplibreModule) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-gray-500">Loading map...</span>
        </div>
      )}
      
      {/* Loading overlay that appears during transitions */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[60]">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Conditionally render controls only after the map is loaded */}
      {mapLoaded && maplibreModule && (
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
                  // Set transitioning state to true
                  setIsTransitioning(true);
                  // Delay the actual fullscreen toggle slightly to allow transition overlay to appear
                  setTimeout(() => {
                    setMapFullscreen(!isMapFullscreen);
                    if (isMapFullscreen) {
                      // If we're exiting fullscreen, check if we need to exit browser fullscreen too
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      }
                    }
                  }, 50);
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
                {isMapFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                )}
              </svg>
            </button>
          </div>
          
          {/* Exit fullscreen button (only shows when in fullscreen) */}
          {isMapFullscreen && (
            <div className="absolute top-2 right-14 z-10">
              <button
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setMapFullscreen(false);
                  }, 50);
                }}
                className="bg-white p-2 rounded-md shadow text-sm"
              >
                Exit Full Screen
              </button>
            </div>
          )}
        </>
      )}

      {/* Updated Detailed Card (only in full-screen) */}
      {selectedMarker && isMapFullscreen && center && mapLoaded && maplibreModule && (
        <ListingCard
          listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
          distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
          onClose={() => setSelectedMarker(null)}
          className="top-14 left-2 w-80"
        />
      )}
    </div>
  );
};

export default SearchMap;
