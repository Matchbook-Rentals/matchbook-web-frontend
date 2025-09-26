import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import GuestMobileMapClickListingCard from './guest-mobile-map-click-listing-card';

// No longer using clustering

interface MarkerStyles {
  SIMPLE_MARKER_THRESHOLD: number;
  MARKER_COLORS: {
    DEFAULT: { primary: string; secondary: string };
    HOVER: { primary: string; secondary: string };
    LIKED: { primary: string; secondary: string }; // LIKED may not be used directly for marker body, but for icon
    DISLIKED: { primary: string; secondary: string };
  };
  PRICE_BUBBLE_COLORS: {
    DEFAULT: { background: string; text: string; border: string };
    HOVER: { background: string; text: string; border: string };
    DISLIKED: { background: string; text: string; border: string };
  };
  HEART_ICON: {
    color: string;
    simpleMarkerTransform: string;
    simpleMarkerScale: string;
    priceBubblePosition: { top: string; right: string };
    size: string;
    withBackground: boolean;
    backgroundCircle: {
      radius: string;
      fill: string;
      stroke: string;
      strokeWidth: string;
    };
  };
}

interface GuestSearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  markerStyles: MarkerStyles;
  onClose: () => void;
  onCenterChanged?: (lng: number, lat: number) => void;
  customSnapshot: any; // Required custom snapshot for guest mode
}

const GuestSearchMapMobile: React.FC<GuestSearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  markerStyles,
  onClose,
  onCenterChanged = () => {},
  customSnapshot
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  // clusterMarkersRef is not used but kept to minimize structural diff for now
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const { shouldPanTo, clearPanTo } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const markersDataRef = useRef<MapMarker[]>(markers);
  const [retryCount, setRetryCount] = useState(0);
  const [mapInitFailed, setMapInitFailed] = useState(false);

  // Use guest-provided snapshot instead of authenticated hook
  const listingsSnapshot = customSnapshot;

  // Local calculateDistance function for listing card distance display
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate pixel distance between two points for clustering
  const calculatePixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!mapRef.current) return Infinity;
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  /** Get visible markers within the current bounds */
  const getVisibleMarkers = (): MapMarker[] => {
    if (!mapRef.current) return [];
    const bounds = mapRef.current.getBounds();
    // Use markersDataRef.current as it's updated with the prop
    return markersDataRef.current.filter(marker =>
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
  };

  // Function to create a single marker
  const createSingleMarker = (markerData: MapMarker) => {
    if (!mapRef.current) return;

    const visibleMarkers = getVisibleMarkers();
    const shouldUseSimpleMarkers = visibleMarkers.length > markerStyles.SIMPLE_MARKER_THRESHOLD;

    const isSelected = selectedMarker?.listing.id === markerData.listing.id;
    const isLiked = listingsSnapshot.isLiked(markerData.listing.id);
    // isDisliked is not directly used for initial simple marker color, but for price bubbles and updates
    // const isDisliked = listingsSnapshot.isDisliked(markerData.listing.id);


    if (shouldUseSimpleMarkers) {
      const mapMarkerInstance = new maplibregl.Marker({
        color: isSelected ? markerStyles.MARKER_COLORS.HOVER.primary : markerStyles.MARKER_COLORS.DEFAULT.primary,
        scale: 0.7
      })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(mapRef.current);

      const markerElement = mapMarkerInstance.getElement();
      markerElement.style.cursor = 'pointer';
      markerElement.style.overflow = 'visible';

      const innerCircle = markerElement.querySelector('svg circle:last-child');
      if (innerCircle) {
        innerCircle.setAttribute('fill', isSelected ? markerStyles.MARKER_COLORS.HOVER.secondary : markerStyles.MARKER_COLORS.DEFAULT.secondary);
      }

      if (isLiked) {
        const svg = markerElement.querySelector('svg');
        if (svg) {
          svg.style.overflow = 'visible';
          if (markerStyles.HEART_ICON.withBackground) {
            const heartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
            heartGroup.setAttribute('class', 'marker-heart-icon');

            const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bgCircle.setAttribute('cx', '0'); bgCircle.setAttribute('cy', '0');
            bgCircle.setAttribute('r', markerStyles.HEART_ICON.backgroundCircle.radius);
            bgCircle.setAttribute('fill', markerStyles.HEART_ICON.backgroundCircle.fill);
            bgCircle.setAttribute('stroke', markerStyles.HEART_ICON.backgroundCircle.stroke);
            bgCircle.setAttribute('stroke-width', markerStyles.HEART_ICON.backgroundCircle.strokeWidth);

            const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            heartPath.setAttribute('d', 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5');
            heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
            heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);

            heartGroup.appendChild(bgCircle); heartGroup.appendChild(heartPath);
            svg.appendChild(heartGroup);
          } else {
            const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            heartPath.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314');
            heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
            heartPath.setAttribute('transform', `${markerStyles.HEART_ICON.simpleMarkerTransform} scale(0.5)`);
            heartPath.setAttribute('class', 'marker-heart-icon');
            heartPath.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
            svg.appendChild(heartPath);
          }
        }
      }
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedMarker(prev => (prev?.listing.id === markerData.listing.id ? null : markerData));
      });
      markersRef.current.set(markerData.listing.id, mapMarkerInstance);
    } else {
      // Custom price bubble markers
      const el = document.createElement('div');
      el.className = 'price-bubble-marker';

      const isDisliked = listingsSnapshot.isDisliked(markerData.listing.id); // isLiked is already defined via listingsSnapshot
      let colorsForCss;
      if (isSelected) {
        colorsForCss = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
      } else if (isDisliked && !isLiked) { // Disliked and not liked (as liked takes z-index precedence)
        colorsForCss = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
      } else { // Covers Default and Liked (not selected)
        colorsForCss = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
      }
      const { background: bgColor, text: textColor, border: borderColor } = colorsForCss;

      let zIndexValue = '0'; // Default for 'nothing else' / lowest tier
      if (isSelected) {
        zIndexValue = '2'; // Highest tier
      } else if (isLiked) {
        zIndexValue = '1'; // Middle tier
      }
      // If disliked (and not selected, not liked), it will use zIndexValue '0'

      const price = markerData.listing.calculatedPrice || markerData.listing.price;
      const formattedPrice = (price !== null && price !== undefined)
        ? `$${price.toLocaleString()}`
        : 'N/A';

      el.style.cssText = `
        padding: 6px 10px; border-radius: 16px; background-color: ${bgColor};
        color: ${textColor}; font-weight: bold; font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; justify-content: center;
        align-items: center; cursor: pointer; user-select: none; min-width: 40px;
        text-align: center; border: 1px solid ${borderColor}; /* Mobile uses 1px border from example */
        z-index: ${zIndexValue}; overflow: visible;
      `;

      if (isLiked) {
        el.innerHTML = `
          <span style="position: relative;">
            ${formattedPrice}
            <svg style="position: absolute; top: ${markerStyles.HEART_ICON.priceBubblePosition.top}; right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
                      width: ${markerStyles.HEART_ICON.size}; height: ${markerStyles.HEART_ICON.size}; fill: ${markerStyles.HEART_ICON.color};
                      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
            </svg>
          </span>`;
      } else {
        el.innerHTML = formattedPrice;
      }

      const mapMarkerInstance = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(mapRef.current);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedMarker(prev => (prev?.listing.id === markerData.listing.id ? null : markerData));
      });
      markersRef.current.set(markerData.listing.id, mapMarkerInstance);
    }
  };

  const renderMarkers = () => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.clear();

    markersDataRef.current.forEach(marker => createSingleMarker(marker));
    updateMarkerColors(); // Ensure colors are correct after re-render
  };

  const updateMarkerColors = () => {
    if (!mapRef.current) return;
    const visibleMarkers = getVisibleMarkers();
    const shouldUseSimpleMarkers = visibleMarkers.length > markerStyles.SIMPLE_MARKER_THRESHOLD;

    markersRef.current.forEach((mapLibreMarker, id) => {
      const el = mapLibreMarker.getElement();
      const correspondingMarkerData = markersDataRef.current.find(m => m.listing.id === id);
      if (!correspondingMarkerData) return;

      const isSelected = selectedMarker?.listing.id === id;
      const isLiked = listingsSnapshot.isLiked(id);
      const isDisliked = listingsSnapshot.isDisliked(id);

      if (shouldUseSimpleMarkers) {
        const svg = el.querySelector('svg');
        const innerCircle = el.querySelector('svg circle:last-child');
        const markerShape = el.querySelector('svg g:nth-child(2)'); // Path for the main marker body

        if (!markerShape || !innerCircle || !svg) return;
        svg.style.overflow = 'visible';

        if (isSelected) {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.secondary);
        } else if (isDisliked) { // Disliked takes precedence over default if not selected
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.DISLIKED.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.DISLIKED.secondary);
        } else {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.DEFAULT.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.DEFAULT.secondary);
        }

        const existingHeart = svg.querySelector('.marker-heart-icon');
        if (isLiked) {
          if (!existingHeart) {
            if (markerStyles.HEART_ICON.withBackground) {
                const heartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
                heartGroup.setAttribute('class', 'marker-heart-icon');
                const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bgCircle.setAttribute('cx', '0'); bgCircle.setAttribute('cy', '0');
                bgCircle.setAttribute('r', markerStyles.HEART_ICON.backgroundCircle.radius);
                bgCircle.setAttribute('fill', markerStyles.HEART_ICON.backgroundCircle.fill);
                bgCircle.setAttribute('stroke', markerStyles.HEART_ICON.backgroundCircle.stroke);
                bgCircle.setAttribute('stroke-width', markerStyles.HEART_ICON.backgroundCircle.strokeWidth);
                const heartPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                heartPathElement.setAttribute('d', 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5');
                heartPathElement.setAttribute('fill', markerStyles.HEART_ICON.color);
                heartPathElement.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);
                heartGroup.appendChild(bgCircle); heartGroup.appendChild(heartPathElement);
                svg.appendChild(heartGroup);
            } else {
                const heartPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                heartPathElement.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314');
                heartPathElement.setAttribute('fill', markerStyles.HEART_ICON.color);
                heartPathElement.setAttribute('transform', `${markerStyles.HEART_ICON.simpleMarkerTransform} scale(0.5)`);
                heartPathElement.setAttribute('class', 'marker-heart-icon');
                heartPathElement.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
                svg.appendChild(heartPathElement);
            }
          }
        } else {
          if (existingHeart) existingHeart.remove();
        }
      } else { // Price bubble markers
        let currentColors;
        let zIndexValue = '0'; // Default z-index for 'nothing' / lowest tier

        if (isSelected) {
          currentColors = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
          zIndexValue = '2'; // Highest tier
        } else if (isLiked) {
          // A liked marker that is not selected. Color is default, z-index is middle.
          currentColors = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
          zIndexValue = '1'; // Middle tier
        } else if (isDisliked) {
          // A disliked marker that is not selected and not liked.
          currentColors = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
          zIndexValue = '0'; // Lowest tier
        } else {
          // A default marker (not selected, not liked, not disliked).
          currentColors = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
          zIndexValue = '0'; // Lowest tier
        }

        el.style.backgroundColor = currentColors.background;
        el.style.color = currentColors.text;
        el.style.border = `1px solid ${currentColors.border}`;
        el.style.zIndex = zIndexValue;

        const price = correspondingMarkerData.listing.calculatedPrice || correspondingMarkerData.listing.price;
        const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
        const heartSVGMarkup = `
          <svg style="position: absolute; top: ${markerStyles.HEART_ICON.priceBubblePosition.top}; right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
                    width: ${markerStyles.HEART_ICON.size}; height: ${markerStyles.HEART_ICON.size}; fill: ${markerStyles.HEART_ICON.color};
                    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
          </svg>`;

        if (isLiked) {
          // Ensure span exists, then add SVG or update content
          let span = el.querySelector('span');
          if (!span) {
            el.innerHTML = `<span style="position: relative;">${formattedPrice}</span>`;
            span = el.querySelector('span');
          }
          if (span && !span.querySelector('svg')) {
             span.innerHTML = `${formattedPrice}${heartSVGMarkup}`;
          } else if (span) { // Span and SVG exist, ensure price is correct
            span.firstChild!.textContent = formattedPrice;
          }
        } else {
            // Remove heart: Set innerHTML to just the price, removing the span and SVG
            el.innerHTML = formattedPrice;
        }
      }
    });
  };

  // Initialize map only once with no dependencies
  useEffect(() => {
    // Return early if we don't have what we need to initialize or map already exists
    if (!mapContainerRef.current || !center) return;
    if (mapRef.current) return; // Map already initialized
    if (mapInitFailed) return; // Don't retry if we've already failed

    const retryDelays = [200, 400, 600]; // Retry delays in ms

    const initializeMap = () => {
      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: center,
          zoom: zoom,
          scrollZoom: true, // Typically enabled for mobile maps for better UX
          failIfMajorPerformanceCaveat: false,
        });
        mapRef.current = map;
        setMapLoaded(true);

        map.on('error', (e) => console.error('MapLibre GL error:', e));

        const handleMapInteractionEnd = () => { // Covers moveend, zoomend
          if (!mapRef.current) return;
          const newZoom = mapRef.current.getZoom();
          const mapCenter = mapRef.current.getCenter();

          let needsRender = false;
          if (newZoom !== currentZoom) {
              setCurrentZoom(newZoom);
              needsRender = true; // Zoom change might cross SIMPLE_MARKER_THRESHOLD
          }
          onCenterChanged(mapCenter.lng, mapCenter.lat);

          if(needsRender) {
              renderMarkers(); // This calls createSingleMarker which depends on visible count
          } else {
              updateMarkerColors(); // Just update colors if no structural change
          }
        };

        map.on('load', () => {
          if (!mapRef.current) return;
          setCurrentZoom(mapRef.current.getZoom());
          renderMarkers(); // Initial render
        });
        map.on('zoomend', handleMapInteractionEnd);
        map.on('moveend', handleMapInteractionEnd);
        map.on('click', () => {
          setSelectedMarker(null); // Deselect on map click
        });
        // 'idle' can be too frequent, covered by zoom/moveend
      } catch (error) {
        console.error('Failed to initialize mobile map:', error);
        console.error('Map center:', center);
        console.error('Map container:', mapContainerRef.current);
        console.error('Retry count:', retryCount);

        // If we have retries left, schedule the next attempt
        if (retryCount < retryDelays.length) {
          const delay = retryDelays[retryCount];
          console.log(`Retrying mobile map initialization in ${delay}ms...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          // No more retries, mark as failed
          console.error('Mobile map initialization failed after all retries');
          setMapLoaded(false);
          setMapInitFailed(true);
        }
      }
    };

    // Attempt to initialize the map
    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      clusterMarkersRef.current.clear();
    };
  }, [retryCount]); // Add retryCount as dependency to trigger retries

  // Only fly to center on initial load when map is way off (similar to desktop version)
  useEffect(() => {
    if (!mapRef.current || !center || !mapLoaded) return;

    const currentCenter = mapRef.current.getCenter();

    // Only recenter if this appears to be the initial load (center way off)
    const isInitialLoad = Math.abs(currentCenter.lng - center[0]) > 1 ||
      Math.abs(currentCenter.lat - center[1]) > 1;

    if (isInitialLoad) {
      // Use flyTo with a short duration to smoothly transition
      mapRef.current.flyTo({
        center: center,
        duration: 500,
        essential: true,
        zoom: zoom,
      });
    }
  }, [mapLoaded]); // Only depend on mapLoaded for initial positioning

  useEffect(() => {
    if (mapRef.current && shouldPanTo) {
      mapRef.current.easeTo({ center: [shouldPanTo.lng, shouldPanTo.lat], duration: 1500, zoom: mapRef.current.getZoom() }); // Keep current zoom
      clearPanTo();
    }
  }, [shouldPanTo, clearPanTo]);

  // Update markersDataRef when markers prop changes
  useEffect(() => {
    markersDataRef.current = markers;
    // If map is loaded, re-render markers as data has changed
    if (mapLoaded && mapRef.current) {
        // Check if map is being manipulated to avoid race conditions
        if (!mapRef.current.isEasing() && !mapRef.current.isMoving() && !mapRef.current.isZooming()) {
            renderMarkers();
        } else {
            // If map is busy, defer rendering to idle state or next interaction end
            const onIdleOnce = () => {
                if (mapRef.current) { // Check again as it might be removed
                    renderMarkers();
                    mapRef.current.off('idle', onIdleOnce);
                }
            };
            mapRef.current.on('idle', onIdleOnce);
        }
    }
  }, [markers, mapLoaded]); // Add mapLoaded here

  // Effect to update map's zoom when the zoom prop changes
  useEffect(() => {
    if (mapRef.current && mapLoaded && zoom !== undefined) {
      if (mapRef.current.getZoom() !== zoom) {
        mapRef.current.setZoom(zoom);
      }
    }
  }, [zoom, mapLoaded]);

  // Update marker colors when selection or like/dislike state changes
   useEffect(() => {
    if (mapLoaded && mapRef.current) {
      // Debounce or throttle if this becomes too frequent
      updateMarkerColors();
    }
  }, [mapLoaded, selectedMarker, listingsSnapshot.favoriteIds, listingsSnapshot.dislikedIds, currentZoom]);


  return (
    <div style={{ height }} className="font-montserrat" ref={mapContainerRef}>
      {/* Back button - always show this regardless of map state */}
      <Button
        onClick={onClose}
        className="fixed w-16 h-16 p-0 z-50 rounded-full bg-secondaryBrand text-background flex items-center justify-center overflow-visible"
        style={{
          bottom: '4dvh',
          right: '1rem'
        }}
      >
        <ChevronDown className="w-8 h-8" strokeWidth={2} style={{ width: '32px', height: '32px' }} />
      </Button>

      {mapLoaded === true && mapRef.current && (
        <>
          {/* Listing Card */}
          {selectedMarker && selectedMarker.listing && center && (
            <GuestMobileMapClickListingCard
              listing={selectedMarker.listing}
              distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
              onClose={() => setSelectedMarker(null)}
              className="top-2 left-1/2 transform -translate-x-1/2 w-[95%] z-40"
              customSnapshot={listingsSnapshot}
            />
          )}
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
        </>
      )}

      {/* Fallback UI when map fails to load */}
      {mapInitFailed && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-700 text-lg mb-3">Unable to load map</div>
          <div className="text-sm text-gray-500 max-w-[80%] text-center px-4">
            The map could not be loaded after multiple attempts.
            Please try using a different browser or device.
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestSearchMapMobile;