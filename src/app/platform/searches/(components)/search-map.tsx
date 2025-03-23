import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { ListingAndImages } from '@/types';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import Image from 'next/image';
import ListingCard from './desktop-map-click-card';
import DesktopListingCard from './desktop-map-click-card';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useSearchParams } from 'next/navigation';

interface ClusterMarker {
  lat: number;
  lng: number;
  count: number;
  listingIds: string[];
}

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  isFullscreen = false,
  setIsFullscreen = () => {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const highlightedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const updateVisibleMarkersRef = useRef<() => void>();
  const { shouldPanTo, clearPanTo, hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ClusterMarker[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [clickedCluster, setClickedCluster] = useState<ClusterMarker | null>(null);

  const {state} = useTripContext();
  const {filters, trip} = state;
  const {searchRadius} = trip;
  const queryParams = useSearchParams();

  // Function to calculate pixel distance based on zoom level
  const calculatePixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number, zoom: number): number => {
    if (!mapRef.current) return Infinity;
    
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  // Function to create marker clusters based on current zoom level
  const createClusters = (currentZoom: number) => {
    if (!mapRef.current) return [];
    
    // Clear previous cluster markers
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current.clear();
    
    // Minimum pixel distance for clustering based on zoom level
    // Lower zoom = larger clustering radius 
    // Adjust these values to control how aggressively markers cluster
    const clusterRadius = Math.max(40, 100 - currentZoom * 4);
    
    const visitedMarkers = new Set<string>();
    const newClusters: ClusterMarker[] = [];
    
    // Get current visible map bounds
    const bounds = mapRef.current.getBounds();
    
    // Filter to only markers that are currently in the visible viewport
    const visibleMarkers = markers.filter(marker => 
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
    
    // First pass: create clusters from visible markers only
    visibleMarkers.forEach(marker => {
      if (visitedMarkers.has(marker.listing.id)) return;
      
      const cluster: ClusterMarker = {
        lat: marker.lat,
        lng: marker.lng,
        count: 1,
        listingIds: [marker.listing.id],
      };
      
      visitedMarkers.add(marker.listing.id);
      
      // Find nearby markers to cluster (only from visible markers)
      visibleMarkers.forEach(otherMarker => {
        if (marker.listing.id === otherMarker.listing.id || visitedMarkers.has(otherMarker.listing.id)) return;
        
        const pixelDistance = calculatePixelDistance(
          marker.lat, marker.lng, 
          otherMarker.lat, otherMarker.lng, 
          currentZoom
        );
        
        if (pixelDistance < clusterRadius) {
          // Add to cluster
          cluster.count++;
          cluster.listingIds.push(otherMarker.listing.id);
          visitedMarkers.add(otherMarker.listing.id);
          
          // Update cluster center (average position)
          cluster.lat = (cluster.lat * (cluster.count - 1) + otherMarker.lat) / cluster.count;
          cluster.lng = (cluster.lng * (cluster.count - 1) + otherMarker.lng) / cluster.count;
        }
      });
      
      newClusters.push(cluster);
    });
    
    return newClusters;
  };

  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
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
    setCurrentZoom(map.getZoom());

    // Define updateVisibleMarkers before using it in event listeners
    const updateVisibleMarkers = () => {
      const bounds = map.getBounds();
      const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .map(marker => marker.listing.id);
      useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
    };

    // Store the updateVisibleMarkers function in the ref for later use
    updateVisibleMarkersRef.current = updateVisibleMarkers;
    
    // Helper function to render clusters
    const renderClusters = (clusters: ClusterMarker[], map: maplibregl.Map) => {
      const currentMapZoom = map.getZoom();
      const shouldCluster = currentMapZoom < 15;
      
      if (shouldCluster) {
        // Create and add cluster markers
        clusters.forEach(cluster => {
          if (cluster.count === 1) {
            // Single marker in cluster, render normally
            const markerId = cluster.listingIds[0];
            const markerData = markers.find(m => m.listing.id === markerId);
            
            if (markerData) {
              const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
                .setLngLat([markerData.lng, markerData.lat])
                .addTo(map);
              
              mapMarker.getElement().style.cursor = 'pointer';
              
              // Add click handler
              mapMarker.getElement().addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isFullscreen) {
                  setClickedMarkerId(curr => {
                    if (curr === markerData.listing.id) {
                      updateVisibleMarkers();
                      return null; // toggle off if already clicked
                    } else {
                      useVisibleListingsStore.getState().setVisibleListingIds([markerData.listing.id]);
                      return markerData.listing.id;
                    }
                  });
                } else {
                  setSelectedMarker((prev) => (prev?.listing.id === markerData.listing.id ? null : markerData));
                }
              });
              
              markersRef.current.set(markerData.listing.id, mapMarker);
            }
          } else {
            // Multiple markers in cluster
            const el = document.createElement('div');
            el.className = 'cluster-marker-container';
            el.style.position = 'relative';
            el.style.width = '36px';
            el.style.height = '36px';
            
            const innerMarker = document.createElement('div');
            innerMarker.className = 'cluster-marker';
            innerMarker.style.position = 'absolute';
            innerMarker.style.top = '0';
            innerMarker.style.left = '0';
            innerMarker.style.width = '100%';
            innerMarker.style.height = '100%';
            innerMarker.style.borderRadius = '50%';
            innerMarker.style.backgroundColor = '#FF0000';
            innerMarker.style.color = 'white';
            innerMarker.style.display = 'flex';
            innerMarker.style.justifyContent = 'center';
            innerMarker.style.alignItems = 'center';
            innerMarker.style.fontWeight = 'bold';
            innerMarker.style.fontSize = '14px';
            innerMarker.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
            innerMarker.style.border = '2px solid white';
            innerMarker.style.cursor = 'pointer';
            innerMarker.style.userSelect = 'none';
            innerMarker.innerText = `${cluster.count}`;
            
            el.appendChild(innerMarker);
            
            el.addEventListener('mouseenter', () => {
              innerMarker.style.backgroundColor = '#E00000';
              innerMarker.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.7)';
            });
            
            el.addEventListener('mouseleave', () => {
              innerMarker.style.backgroundColor = '#FF0000';
              innerMarker.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
            });
            
            const markerOptions = { 
              element: el,
              anchor: 'center',
              offset: [0, 0]
            };
            
            const clusterMarker = new maplibregl.Marker(markerOptions)
              .setLngLat([cluster.lng, cluster.lat])
              .addTo(map);
            
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              
              useVisibleListingsStore.getState().setVisibleListingIds(cluster.listingIds);
              setClickedCluster(cluster);
              
              if (currentMapZoom < 14) {
                map.flyTo({
                  center: [cluster.lng, cluster.lat],
                  zoom: Math.min(currentMapZoom + 2, 14),
                  duration: 500
                });
              } else {
                map.flyTo({
                  center: [cluster.lng, cluster.lat],
                  duration: 300
                });
              }
            });
            
            const clusterId = `cluster-${cluster.listingIds.join('-')}`;
            clusterMarkersRef.current.set(clusterId, clusterMarker);
          }
        });
      } else {
        // No clustering, render all visible markers individually
        const bounds = map.getBounds();
        const visibleMarkers = markers.filter(marker => 
          bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
        );
        
        visibleMarkers.forEach(marker => {
          const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);
          
          mapMarker.getElement().style.cursor = 'pointer';
          
          mapMarker.getElement().addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isFullscreen) {
              setClickedMarkerId(curr => {
                if (curr === marker.listing.id) {
                  updateVisibleMarkers();
                  return null;
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
      }
    };
    
    // Function to update markers based on current zoom level - defined here to access map and other variables
    const updateMarkers = () => {
      // Clear all existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      
      clusterMarkersRef.current.forEach(marker => marker.remove());
      clusterMarkersRef.current.clear();
      
      const currentMapZoom = map.getZoom();
      setCurrentZoom(currentMapZoom);
      
      // First update the visible listings
      const bounds = map.getBounds();
      const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .map(marker => marker.listing.id);
      useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
      
      // Create clusters - now using only visible markers
      const newClusters = createClusters(currentMapZoom);
      setClusters(newClusters);
      
      // Use our renderClusters function to render markers
      renderClusters(newClusters, map);
    };

    // Close card when clicking on the map background
    const handleMapClick = () => {
      setSelectedMarker(null);
      setClickedCluster(null);
      if (!isFullscreen) {
        updateVisibleMarkers();
        setClickedMarkerId(null);
      }
    };
    map.on('click', handleMapClick);

    // Only update markers on zoom end to prevent flickering during panning
    map.on('zoomend', () => {
      // We only need to re-cluster markers when zoom level changes
      updateMarkers();
      updateVisibleMarkers();
    });
    
    // Update visible listings when panning, and re-cluster if needed
    map.on('moveend', () => {
      if (map.getZoom() !== currentZoom) {
        // If zoom changed, updateMarkers was already called
        return;
      }
      
      // Always update visible markers
      updateVisibleMarkers();
      
      // Re-create clusters if not in fullscreen mode to ensure all visible markers are shown
      if (!isFullscreen) {
        const newClusters = createClusters(map.getZoom());
        setClusters(newClusters);
        
        // Clear and re-create markers based on current viewport
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();
        
        clusterMarkersRef.current.forEach(marker => marker.remove());
        clusterMarkersRef.current.clear();
        
        // Re-render markers with updated clusters
        renderClusters(newClusters, map);
      }
    });
    
    // Disable markers while dragging to prevent visual glitches
    map.on('dragstart', () => {
      if (map.getContainer()) {
        const markerElements = map.getContainer().querySelectorAll('.maplibregl-marker');
        markerElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.pointerEvents = 'none';
          }
        });
      }
    });
    
    map.on('dragend', () => {
      if (map.getContainer()) {
        const markerElements = map.getContainer().querySelectorAll('.maplibregl-marker');
        markerElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.pointerEvents = 'auto';
          }
        });
      }
      
      // Update visible markers after drag ends
      updateVisibleMarkers();
      
      // Re-create clusters based on the new visible area
      if (!isFullscreen) {
        // Using the same pattern as moveend to avoid potential infinite loops
        if (map.getZoom() !== currentZoom) {
          return; // If zoom changed, updateMarkers was already called
        }
        
        // Always update visible markers
        updateVisibleMarkers();
        
        // Re-create clusters to ensure all visible markers are shown
        const newClusters = createClusters(map.getZoom());
        setClusters(newClusters);
        
        // Clear and re-create markers based on current viewport
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();
        
        clusterMarkersRef.current.forEach(marker => marker.remove());
        clusterMarkersRef.current.clear();
        
        // Re-render markers with the updated clusters
        renderClusters(newClusters, map);
      }
    });
    
    // Initial rendering of markers
    updateMarkers();
    
    // Fire map load event to ensure initial markers and clustering
    map.once('load', () => {
      // Update visible markers immediately when map loads
      updateVisibleMarkers();
      // Initialize marker rendering on load
      const currentMapZoom = map.getZoom();
      const newClusters = createClusters(currentMapZoom);
      setClusters(newClusters);
      updateMarkers();
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        map.off('click', handleMapClick);
        map.off('zoomend');
        map.off('moveend');
        map.off('dragstart');
        map.off('dragend');
        map.off('load');
        map.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      clusterMarkersRef.current.clear();
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
      
      // Check if this is a custom cluster marker (div) or standard marker (SVG)
      const clusterDiv = markerElement.querySelector('.cluster-marker');
      if (clusterDiv || markerElement.classList.contains('cluster-marker')) {
        // For cluster markers
        const targetEl = clusterDiv || markerElement;
        // Force the background color to be explicitly set for cluster markers
        if (targetEl instanceof HTMLElement) {
          targetEl.style.backgroundColor = color;
          markerElement.style.zIndex = zIndex;
        }
      } else {
        // For standard markers
        const paths = markerElement.querySelectorAll('path');
        paths.forEach(path => {
          path.setAttribute('fill', color);
        });
        markerElement.style.zIndex = zIndex;
      }
    };

    if (isFullscreen) {
      if (selectedMarker) {
        markersRef.current.forEach((marker, id) => {
          if (id === selectedMarker.listing.id) {
            setMarkerColor(marker, '#404040', '2');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else if (hoveredListing) {
        markersRef.current.forEach((marker, id) => {
          if (id === hoveredListing.id) {
            setMarkerColor(marker, '#404040', '2');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else {
        markersRef.current.forEach(marker => {
          setMarkerColor(marker, '#FF0000', '');
        });
      }
      
      // Always keep cluster markers red in fullscreen mode
      clusterMarkersRef.current.forEach(marker => {
        setMarkerColor(marker, '#FF0000', '1');
      });
    } else {
      if (clickedMarkerId) {
        markersRef.current.forEach((marker, id) => {
          if (id === clickedMarkerId) {
            setMarkerColor(marker, '#404040', '2');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else if (hoveredListing) {
        markersRef.current.forEach((marker, id) => {
          if (id === hoveredListing.id) {
            setMarkerColor(marker, '#404040', '2');
          } else {
            setMarkerColor(marker, '#FF0000', '');
          }
        });
      } else {
        markersRef.current.forEach(marker => {
          setMarkerColor(marker, '#FF0000', '');
        });
      }
      
      // Handle clicked clusters
      if (clickedCluster) {
        clusterMarkersRef.current.forEach((marker, id) => {
          if (id === `cluster-${clickedCluster.listingIds.join('-')}`) {
            setMarkerColor(marker, '#404040', '2');
          } else {
            setMarkerColor(marker, '#FF0000', '1');
          }
        });
      } else {
        clusterMarkersRef.current.forEach(marker => {
          setMarkerColor(marker, '#FF0000', '1');
        });
      }
    }
  }, [hoveredListing, clickedMarkerId, selectedMarker, clickedCluster, isFullscreen]);

  // Update visible listings when toggling fullscreen mode or when markers change
  useEffect(() => {
    if (mapRef.current) {
      // When exiting fullscreen or when markers change
      if (!isFullscreen) {
        setSelectedMarker(null);
        setClickedMarkerId(null);
        setClickedCluster(null);
        
        // Get current visible map bounds
        const bounds = mapRef.current.getBounds();
        const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
          .map(marker => marker.listing.id);
        useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
      }
      
      // Always completely refresh all markers to ensure proper rendering
      // Clear all existing markers 
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      
      clusterMarkersRef.current.forEach(marker => marker.remove());
      clusterMarkersRef.current.clear();
      
      // Get current zoom level
      const currentMapZoom = mapRef.current.getZoom();
      setCurrentZoom(currentMapZoom);
      
      // Create new clusters based on current zoom and visible area
      const shouldCluster = currentMapZoom < 15;
      
      // Make sure to update the visible listings first
      const bounds = mapRef.current.getBounds();
      const visibleIds = markers.filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
        .map(marker => marker.listing.id);
      useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
      
      // Now create clusters using only the visible markers
      const newClusters = createClusters(currentMapZoom);
      setClusters(newClusters);
      
      // Force render all markers - recreate the marker rendering logic here
      setTimeout(() => {
        const map = mapRef.current;
        if (!map) return;
        
        if (shouldCluster) {
          // Create and add cluster markers
          newClusters.forEach(cluster => {
            if (cluster.count === 1) {
              // Single marker in cluster, render normally
              const markerId = cluster.listingIds[0];
              const markerData = markers.find(m => m.listing.id === markerId);
              
              if (markerData) {
                const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
                  .setLngLat([markerData.lng, markerData.lat])
                  .addTo(map);
                
                mapMarker.getElement().style.cursor = 'pointer';
                
                // Add click handler
                mapMarker.getElement().addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (!isFullscreen) {
                    setClickedMarkerId(curr => {
                      if (curr === markerData.listing.id) {
                        if (updateVisibleMarkersRef.current) {
                          updateVisibleMarkersRef.current();
                        }
                        return null; // toggle off if already clicked
                      } else {
                        useVisibleListingsStore.getState().setVisibleListingIds([markerData.listing.id]);
                        return markerData.listing.id;
                      }
                    });
                  } else {
                    setSelectedMarker((prev) => (prev?.listing.id === markerData.listing.id ? null : markerData));
                  }
                });
                
                markersRef.current.set(markerData.listing.id, mapMarker);
              }
            } else {
              // Multiple markers in cluster, render as cluster
              // Create a custom cluster marker element
              const el = document.createElement('div');
              el.className = 'cluster-marker-container';
              el.style.position = 'relative';
              el.style.width = '36px';
              el.style.height = '36px';
              
              // Inner element for the actual marker
              const innerMarker = document.createElement('div');
              innerMarker.className = 'cluster-marker';
              innerMarker.style.position = 'absolute';
              innerMarker.style.top = '0';
              innerMarker.style.left = '0';
              innerMarker.style.width = '100%';
              innerMarker.style.height = '100%';
              innerMarker.style.borderRadius = '50%';
              innerMarker.style.backgroundColor = '#FF0000'; // Explicitly set to red
              innerMarker.style.color = 'white';
              innerMarker.style.display = 'flex';
              innerMarker.style.justifyContent = 'center';
              innerMarker.style.alignItems = 'center';
              innerMarker.style.fontWeight = 'bold';
              innerMarker.style.fontSize = '14px';
              innerMarker.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
              innerMarker.style.border = '2px solid white';
              innerMarker.style.cursor = 'pointer';
              innerMarker.style.userSelect = 'none';
              innerMarker.innerText = `${cluster.count}`;
              
              // Append inner marker to container
              el.appendChild(innerMarker);
              
              // Create the marker with the custom element
              const markerOptions = { 
                element: el,
                anchor: 'center',
                offset: [0, 0]
              };
              
              const clusterMarker = new maplibregl.Marker(markerOptions)
                .setLngLat([cluster.lng, cluster.lat])
                .addTo(map);
              
              // Add click handler for cluster
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Always filter to show only listings in this cluster
                useVisibleListingsStore.getState().setVisibleListingIds(cluster.listingIds);
                setClickedCluster(cluster);
                
                // Also zoom in a bit if not zoomed in enough
                if (currentMapZoom < 14) {
                  map.flyTo({
                    center: [cluster.lng, cluster.lat],
                    zoom: Math.min(currentMapZoom + 2, 14),
                    duration: 500
                  });
                } else {
                  // Just center on the cluster
                  map.flyTo({
                    center: [cluster.lng, cluster.lat],
                    duration: 300
                  });
                }
              });
              
              // Store reference to cluster marker
              const clusterId = `cluster-${cluster.listingIds.join('-')}`;
              clusterMarkersRef.current.set(clusterId, clusterMarker);
            }
          });
        } else {
          // No clustering, render all markers individually
          const bounds = map.getBounds();
          const visibleMarkers = markers.filter(marker => 
            bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
          );
          
          visibleMarkers.forEach(marker => {
            const mapMarker = new maplibregl.Marker({ color: '#FF0000' })
              .setLngLat([marker.lng, marker.lat])
              .addTo(map);
            
            mapMarker.getElement().style.cursor = 'pointer';
            
            // Add click handler
            mapMarker.getElement().addEventListener('click', (e) => {
              e.stopPropagation();
              if (!isFullscreen) {
                setClickedMarkerId(curr => {
                  if (curr === marker.listing.id) {
                    if (updateVisibleMarkersRef.current) {
                      updateVisibleMarkersRef.current();
                    }
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
        }
        
        // Update visible listings
        if (updateVisibleMarkersRef.current) {
          updateVisibleMarkersRef.current();
        }
      }, 50);
    }
  }, [isFullscreen, markers]);

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
                  setIsFullscreen(!isFullscreen);
                }
              }}
              className="bg-white p-2 rounded-md shadow"
            >
              {isFullscreen ? (
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
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              ) : (
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
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              )}
            </button>
          </div>
        </>
      )}

      {/* Desktop Listing Card (only in full-screen) */}
      {selectedMarker && isFullscreen && center && (
        <div className="hidden md:block">
          <DesktopListingCard
            listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
            distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
            onClose={() => setSelectedMarker(null)}
          />
        </div>
      )}
      
      {/* Mobile Listing Card (only in full-screen) */}
      {selectedMarker && isFullscreen && center && (
        <div className="block md:hidden">
          <ListingCard
            listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
            distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
            onClose={() => setSelectedMarker(null)}
            className="top-4 left-1/2 transform -translate-x-1/2 w-96"
          />
        </div>
      )}
    </div>
  );
};

export default SearchMap;