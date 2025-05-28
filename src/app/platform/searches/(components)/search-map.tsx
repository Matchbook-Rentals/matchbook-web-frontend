import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useListingHoverStore } from '@/store/listing-hover-store';
import { useMapSelectionStore, MapMarker } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';
import { useTripContext } from '@/contexts/trip-context-provider';
import { useSearchParams } from 'next/navigation';
import DesktopListingCard from './desktop-map-click-card';
import ListingCard from './desktop-map-click-card';

// No longer using clustering

interface MarkerStyles {
  SIMPLE_MARKER_THRESHOLD: number;
  MARKER_COLORS: {
    DEFAULT: { primary: string; secondary: string };
    HOVER: { primary: string; secondary: string };
    LIKED: { primary: string; secondary: string };
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

interface SearchMapProps {
  center: [number, number] | null;
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean) => void;
  markerStyles: MarkerStyles;
  onCenterChanged?: (lng: number, lat: number) => void;
  onClickedMarkerChange?: (markerId: string | null) => void;
}

const SearchMap: React.FC<SearchMapProps> = ({
  center,
  markers = [],
  zoom = 12,
  height = '526px',
  isFullscreen = false,
  setIsFullscreen = () => {},
  markerStyles,
  onCenterChanged = () => {},
  onClickedMarkerChange = () => {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clickedMarkerId, setClickedMarkerId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [clickedCluster, setClickedCluster] = useState<null>(null);
  const markersDataRef = useRef<MapMarker[]>(markers);
  const clickedMarkerIdRef = useRef<string | null>(null);
  const isFullscreenRef = useRef<boolean>(isFullscreen);
  const [retryCount, setRetryCount] = useState(0);
  const [mapInitFailed, setMapInitFailed] = useState(false);

  const { hoveredListing } = useListingHoverStore();
  const { selectedMarker, setSelectedMarker } = useMapSelectionStore();
  const { state: { filters, trip: { searchRadius } } } = useTripContext();
  const queryParams = useSearchParams();

  // **Utility Functions**

  /** Calculate pixel distance between two points on the map */
  const calculatePixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!mapRef.current) return Infinity;
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  /** Calculate real-world distance in miles */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Keep refs in sync with state
  useEffect(() => {
    clickedMarkerIdRef.current = clickedMarkerId;
    onClickedMarkerChange(clickedMarkerId);
  }, [clickedMarkerId, onClickedMarkerChange]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  /** Update visible listings based on current map bounds */
  const updateVisibleMarkers = () => {
    if (!mapRef.current) return;
    
    // Don't update visible markers if we have a clicked marker in non-fullscreen mode
    if (!isFullscreenRef.current && clickedMarkerIdRef.current) {
      return;
    }
    
    const bounds = mapRef.current.getBounds();
    const visibleIds = markersDataRef.current
      .filter(marker => bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat)))
      .map(marker => marker.listing.id);
    useVisibleListingsStore.getState().setVisibleListingIds(visibleIds);
  };

  /** Get visible markers within the current bounds */
  const getVisibleMarkers = (): MapMarker[] => {
    if (!mapRef.current) return [];
    
    const bounds = mapRef.current.getBounds();
    return markers.filter(marker => 
      bounds.contains(new maplibregl.LngLat(marker.lng, marker.lat))
    );
  };


  /** Render markers */
  const renderMarkers = () => {
    if (!mapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    clusterMarkersRef.current.clear(); // Keep the ref but don't use it
    
    // Get visible markers and render them individually
    markersDataRef.current.forEach(marker => createSingleMarker(marker));
  };

  /** Create a single marker */
  const createSingleMarker = (marker: MapMarker) => {
    if (!mapRef.current) return;
    
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? 60 : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    if (shouldUseSimpleMarkers) {
      // Check if this marker is currently hovered or selected
      const isHovered = hoveredListing?.id === marker.listing.id || 
                       (!isFullscreenRef?.current && clickedMarkerId === marker.listing.id) ||
                       (isFullscreenRef?.current && selectedMarker?.listing.id === marker.listing.id);
      
      // Use simple black MapLibre marker with configurable inner circle for high-density views
      const mapMarker = new maplibregl.Marker({ 
        color: isHovered ? markerStyles.MARKER_COLORS.HOVER.primary : markerStyles.MARKER_COLORS.DEFAULT.primary,
        scale: 0.7 // Make them smaller
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current);
      
      const markerElement = mapMarker.getElement();
      markerElement.style.cursor = 'pointer';
      markerElement.style.overflow = 'visible';
      
      // Customize the inner circle based on state
      const innerCircle = markerElement.querySelector('svg circle:last-child');
      if (innerCircle) {
        innerCircle.setAttribute('fill', isHovered ? markerStyles.MARKER_COLORS.HOVER.secondary : markerStyles.MARKER_COLORS.DEFAULT.secondary);
      }
      
      // Add heart icon if liked
      if (marker.listing.isLiked) {
        const svg = markerElement.querySelector('svg');
        if (svg) {
          svg.style.overflow = 'visible';
          // Create and add heart icon
          if (markerStyles.HEART_ICON.withBackground) {
            const heartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
            heartGroup.setAttribute('class', 'marker-heart-icon');
            
            // Add white background circle for contrast
            const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bgCircle.setAttribute('cx', '0');
            bgCircle.setAttribute('cy', '0');
            bgCircle.setAttribute('r', markerStyles.HEART_ICON.backgroundCircle.radius);
            bgCircle.setAttribute('fill', markerStyles.HEART_ICON.backgroundCircle.fill);
            bgCircle.setAttribute('stroke', markerStyles.HEART_ICON.backgroundCircle.stroke);
            bgCircle.setAttribute('stroke-width', markerStyles.HEART_ICON.backgroundCircle.strokeWidth);
            
            // Add heart path
            const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            heartPath.setAttribute('d', 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5');
            heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
            heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);
            
            heartGroup.appendChild(bgCircle);
            heartGroup.appendChild(heartPath);
            svg.appendChild(heartGroup);
          } else {
            // Heart without background
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
        if (isFullscreenRef?.current) {
          setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
        } else {
          // In non-fullscreen mode, toggle selection
          setClickedMarkerId(prev => {
            if (prev === marker.listing.id) {
              // Clicking same marker - deselect it
              useVisibleListingsStore.getState().setVisibleListingIds(null);
              return null;
            } else {
              // Clicking different marker - select it
              useVisibleListingsStore.getState().setVisibleListingIds([marker.listing.id]);
              return marker.listing.id;
            }
          });
        }
      });
      markersRef.current.set(marker.listing.id, mapMarker);
    } else {
      // Use custom price bubble markers for normal density
      const el = document.createElement('div');
      el.className = 'price-bubble-marker';
      
      // Determine marker color based on hover/dislike status for price bubbles
      let colors;
      // Check if this marker is currently hovered or selected
      const isHovered = hoveredListing?.id === marker.listing.id || 
                       (!isFullscreenRef?.current && clickedMarkerId === marker.listing.id) ||
                       (isFullscreenRef?.current && selectedMarker?.listing.id === marker.listing.id);
      
      if (isHovered) {
        colors = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
      } else if (marker.listing.isDisliked) {
        colors = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
      } else {
        colors = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
      }
      const { background: bgColor, text: textColor, border: borderColor } = colors;
      
      // Format the price for display
      const price = marker.listing.calculatedPrice || marker.listing.price;
      const formattedPrice = (price !== null && price !== undefined) 
        ? `$${price.toLocaleString()}`
        : 'N/A';
      
      // Set the CSS for the marker
      el.style.cssText = `
        padding: 6px 10px;
        border-radius: 16px;
        background-color: ${bgColor};
        color: ${textColor};
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
        min-width: 40px;
        text-align: center;
        border: 1px solid ${borderColor};
        z-index: ${isHovered ? '2' : ''};
        overflow: visible;
      `;
      
      // Set the inner HTML with the price and heart if liked
      if (marker.listing.isLiked) {
        el.innerHTML = `
          <span style="position: relative;">
            ${formattedPrice}
            <svg style="
              position: absolute;
              top: ${markerStyles.HEART_ICON.priceBubblePosition.top};
              right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
              width: ${markerStyles.HEART_ICON.size};
              height: ${markerStyles.HEART_ICON.size};
              fill: ${markerStyles.HEART_ICON.color};
              filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
            " viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
            </svg>
          </span>
        `;
      } else {
        el.innerHTML = formattedPrice;
      }
      
      
      const mapMarker = new maplibregl.Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current);
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreenRef?.current) {
          setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
        } else {
          // In non-fullscreen mode, toggle selection
          setClickedMarkerId(prev => {
            if (prev === marker.listing.id) {
              // Clicking same marker - deselect it
              useVisibleListingsStore.getState().setVisibleListingIds(null);
              return null;
            } else {
              // Clicking different marker - select it
              useVisibleListingsStore.getState().setVisibleListingIds([marker.listing.id]);
              return marker.listing.id;
            }
          });
        }
      });
      markersRef.current.set(marker.listing.id, mapMarker);
    }
  };

  // No longer using cluster markers

  /** Update marker colors based on state */
  const updateMarkerColors = () => {
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? 60 : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const correspondingMarker = markersDataRef.current.find(m => m.listing.id === id);
      
      
      // Handle simple markers (MapLibre markers when >30 listings)
      if (shouldUseSimpleMarkers) {
        const svg = el.querySelector('svg');
        const innerCircle = el.querySelector('svg circle:last-child');
        const markerShape = el.querySelector('svg g:nth-child(2)');
        
        if (!markerShape || !innerCircle || !svg) return;
        
        // Ensure SVG has overflow visible
        svg.style.overflow = 'visible';
        
        // Update marker colors based on state
        if (isFullscreenRef.current && selectedMarker?.listing.id === id) {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.secondary);
        } else if (hoveredListing?.id === id || (!isFullscreenRef.current && clickedMarkerId === id)) {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.HOVER.secondary);
        } else if (correspondingMarker?.listing.isDisliked) {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.DISLIKED.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.DISLIKED.secondary);
        } else {
          markerShape.setAttribute('fill', markerStyles.MARKER_COLORS.DEFAULT.primary);
          innerCircle.setAttribute('fill', markerStyles.MARKER_COLORS.DEFAULT.secondary);
        }
        
        // Handle heart icon for liked markers
        // Use a class to reliably identify heart elements
        const existingHeart = svg.querySelector('.marker-heart-icon');
        
        if (correspondingMarker?.listing.isLiked) {
          // Add heart if it doesn't exist
          if (!existingHeart) {
            if (markerStyles.HEART_ICON.withBackground) {
              const heartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
              heartGroup.setAttribute('class', 'marker-heart-icon');
              
              // Add white background circle for contrast
              const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              bgCircle.setAttribute('cx', '0');
              bgCircle.setAttribute('cy', '0');
              bgCircle.setAttribute('r', markerStyles.HEART_ICON.backgroundCircle.radius);
              bgCircle.setAttribute('fill', markerStyles.HEART_ICON.backgroundCircle.fill);
              bgCircle.setAttribute('stroke', markerStyles.HEART_ICON.backgroundCircle.stroke);
              bgCircle.setAttribute('stroke-width', markerStyles.HEART_ICON.backgroundCircle.strokeWidth);
              
              // Add heart path
              const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              heartPath.setAttribute('d', 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5');
              heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
              heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);
              
              heartGroup.appendChild(bgCircle);
              heartGroup.appendChild(heartPath);
              svg.appendChild(heartGroup);
            } else {
              // Heart without background
              const heartPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              heartPath.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314');
              heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
              heartPath.setAttribute('transform', `${markerStyles.HEART_ICON.simpleMarkerTransform} scale(0.5)`);
              heartPath.setAttribute('class', 'marker-heart-icon');
              heartPath.style.filter = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
              
              svg.appendChild(heartPath);
            }
          }
        } else {
          // Remove heart if it exists and not liked
          if (existingHeart) {
            existingHeart.remove();
          }
        }
        
        return;
      }
      
      // Handle custom price bubble markers (when ≤30 listings)
      if (isFullscreenRef.current && selectedMarker?.listing.id === id) {
        el.style.backgroundColor = markerStyles.PRICE_BUBBLE_COLORS.HOVER.background;
        el.style.color = markerStyles.PRICE_BUBBLE_COLORS.HOVER.text;
        el.style.border = `1px solid ${markerStyles.PRICE_BUBBLE_COLORS.HOVER.border}`;
        el.style.zIndex = '2';

        // Handle heart icon for selected marker in fullscreen
        if (correspondingMarker?.listing.isLiked) {
          // Only add heart if it doesn't exist
          if (!el.querySelector('svg')) {
            const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
            const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
            
            el.innerHTML = `
              <span style="position: relative;">
                ${formattedPrice}
                <svg style="
                  position: absolute;
                  top: ${markerStyles.HEART_ICON.priceBubblePosition.top};
                  right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
                  width: ${markerStyles.HEART_ICON.size};
                  height: ${markerStyles.HEART_ICON.size};
                  fill: ${markerStyles.HEART_ICON.color};
                  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
                " viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                </svg>
              </span>
            `;
          }
        } else {
          // Remove heart if it exists and not liked
          const svg = el.querySelector('svg');
          if (svg) {
            const price = correspondingMarker?.listing.calculatedPrice || correspondingMarker?.listing.price;
            const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
            el.textContent = formattedPrice; // Resets to just price
          }
        }
      } else if (hoveredListing?.id === id || (!isFullscreenRef.current && clickedMarkerId === id)) {
        el.style.backgroundColor = markerStyles.PRICE_BUBBLE_COLORS.HOVER.background;
        el.style.color = markerStyles.PRICE_BUBBLE_COLORS.HOVER.text;
        el.style.border = `1px solid ${markerStyles.PRICE_BUBBLE_COLORS.HOVER.border}`;
        el.style.zIndex = '2';
        
        // If also liked, add the heart icon while maintaining hover state
        if (correspondingMarker?.listing.isLiked) {
          // Only add heart if it doesn't exist
          if (!el.querySelector('svg')) {
            const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
            const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
            
            // Create elements instead of using innerHTML to preserve state
            const span = document.createElement('span');
            span.style.position = 'relative';
            span.textContent = formattedPrice;
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 16 16');
            svg.style.cssText = `
              position: absolute;
              top: ${markerStyles.HEART_ICON.priceBubblePosition.top};
              right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
              width: ${markerStyles.HEART_ICON.size};
              height: ${markerStyles.HEART_ICON.size};
              fill: ${markerStyles.HEART_ICON.color};
              filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
            `;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill-rule', 'evenodd');
            path.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314');
            
            svg.appendChild(path);
            span.appendChild(svg);
            
            // Clear and append to preserve hover state
            el.textContent = '';
            el.appendChild(span);
          }
        } else {
          // Remove heart if it exists when not liked
          const svg = el.querySelector('svg');
          if (svg) {
            svg.remove();
            const price = correspondingMarker?.listing.calculatedPrice || correspondingMarker?.listing.price;
            const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
            // Just update the text content of the span
            const span = el.querySelector('span');
            if (span) {
              span.textContent = formattedPrice;
            } else {
              el.textContent = formattedPrice;
            }
          }
        }
      } else if (correspondingMarker?.listing.isLiked) {
        // Keep default colors for liked listings - only the heart indicates liked status
        el.style.backgroundColor = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.background;
        el.style.color = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.text;
        el.style.border = `1px solid ${markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.border}`;
        el.style.zIndex = '1';
        
        // Update the heart icon if needed
        if (!el.querySelector('svg')) {
          const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
          const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
          el.innerHTML = `
            <span style="position: relative;">
              ${formattedPrice}
              <svg style="
                position: absolute;
                top: ${markerStyles.HEART_ICON.priceBubblePosition.top};
                right: ${markerStyles.HEART_ICON.priceBubblePosition.right};
                width: ${markerStyles.HEART_ICON.size};
                height: ${markerStyles.HEART_ICON.size};
                fill: ${markerStyles.HEART_ICON.color};
                filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
              " viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
              </svg>
            </span>
          `;
        }
      } else if (correspondingMarker?.listing.isDisliked) {
        el.style.backgroundColor = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED.background;
        el.style.color = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED.text;
        el.style.border = `1px solid ${markerStyles.PRICE_BUBBLE_COLORS.DISLIKED.border}`;
        el.style.zIndex = '0';
        
        // Remove heart icon if it exists
        const heartIcon = el.querySelector('svg');
        if (heartIcon) {
          heartIcon.remove();
          const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
          const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
          // Just update the text content of the span
          const span = el.querySelector('span');
          if (span) {
            span.textContent = formattedPrice;
          } else {
            el.textContent = formattedPrice;
          }
        }
      } else {
        el.style.backgroundColor = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.background;
        el.style.color = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.text;
        el.style.border = `1px solid ${markerStyles.PRICE_BUBBLE_COLORS.DEFAULT.border}`;
        el.style.zIndex = '';
        
        // Remove heart icon if it exists
        const heartIcon = el.querySelector('svg');
        if (heartIcon) {
          heartIcon.remove();
          const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
          const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
          // Just update the text content of the span
          const span = el.querySelector('span');
          if (span) {
            span.textContent = formattedPrice;
          } else {
            el.textContent = formattedPrice;
          }
        }
      }
    });
  };

  // **Map Initialization and Event Handlers** 
  // Only initialize map once and never re-create it on prop changes
  useEffect(() => {
    // Return early if we don't have what we need to initialize
    if (!mapContainerRef.current || !center) return;
    if (mapRef.current) return; // Map already initialized
    if (mapInitFailed) return; // Don't retry if we've already failed

    const retryDelays = [200, 400, 600]; // Retry delays in ms
    let mapRenderZoom = currentZoom || zoom || 12;

    const initializeMap = () => {
      try {
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://tiles.openfreemap.org/styles/bright',
          center: center || [0, 0], // Provide fallback center
          zoom: mapRenderZoom,
          scrollZoom: true,
          failIfMajorPerformanceCaveat: false, // Try to render even on low-end devices
        });
        
        mapRef.current = map;
        setMapLoaded(true);
        
        // Handle map load errors
        map.on('error', (e) => {
          console.error('MapLibre GL error:', e);
        });

        // Define updateMarkers function - used in multiple event handlers
        const updateMarkers = (skipRender = false) => {
          if (!mapRef.current) return;
          
          const newZoom = mapRef.current.getZoom();
          setCurrentZoom(newZoom);
          
          // Only update visible markers if we don't have a clicked marker
          if (isFullscreenRef.current || !clickedMarkerIdRef.current) {
            updateVisibleMarkers();
          }
          
          // Only render markers if not skipping render
          if (!skipRender) {
            renderMarkers();
          }
          
          updateMarkerColors();
        };
        
        // On initial load, just update the visible markers and render them
        map.on('load', () => {
          if (!mapRef.current) return; // Safety check
          
          // Only update visible markers if we don't have a clicked marker
          if (isFullscreenRef.current || !clickedMarkerIdRef.current) {
            updateVisibleMarkers();
          }
          const newZoom = mapRef.current.getZoom();
          setCurrentZoom(newZoom);
          renderMarkers();
          updateMarkerColors();
          
          // Make sure we set this to true
          setMapLoaded(true);
        });
        
        // On zoom, update markers but preserve center
        map.on('zoomend', () => {
          // Get current center before updating
          const currentCenter = mapRef.current!.getCenter();
          updateMarkers();
          // Re-center the map if needed - this ensures user interactions are preserved
          if (mapRef.current) {
            mapRef.current.setCenter(currentCenter);
          }
        });
        
        // On move, only update visible listings without re-rendering the whole map
        map.on('moveend', () => {
          if (!mapRef.current) return;
          
          // Report center change to parent
          const newCenter = mapRef.current.getCenter();
          onCenterChanged(newCenter.lng, newCenter.lat);
          
          // Update visible listings only if we don't have a clicked marker
          if (isFullscreenRef.current || !clickedMarkerIdRef.current) {
            updateVisibleMarkers();
          }
          // Update markers but skip rendering to prevent flashy behavior
          updateMarkers(true);
        });
        
        map.on('click', () => {
          if (isFullscreenRef.current) {
            setSelectedMarker(null);
          }
          setClickedCluster(null);
          if (!isFullscreenRef.current) {
            setClickedMarkerId(null);
            // Update visible markers to show all listings in bounds
            updateVisibleMarkers();
          }
        });
        
        // Add idle event for synchronized updates
        map.on('idle', () => {
          // Only update if we don't have a clicked marker in non-fullscreen mode
          if (isFullscreenRef.current || !clickedMarkerIdRef.current) {
            updateVisibleMarkers();
          }
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
        console.error('Map center:', center);
        console.error('Map container:', mapContainerRef.current);
        console.error('Retry count:', retryCount);
        
        // If we have retries left, schedule the next attempt
        if (retryCount < retryDelays.length) {
          const delay = retryDelays[retryCount];
          console.log(`Retrying map initialization in ${delay}ms...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          // No more retries, mark as failed
          console.error('Map initialization failed after all retries');
          setMapLoaded(false);
          setMapInitFailed(true);
        }
      }
    };

    // Attempt to initialize the map
    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      clusterMarkersRef.current.clear();
    };
  }, [retryCount]); // Add retryCount as dependency to trigger retries

  // Update center when center prop changes without reinitializing the map
  useEffect(() => {
    if (!mapRef.current || !center || !mapLoaded) return;
    
    // Get the current view bounds
    const bounds = mapRef.current.getBounds();
    const currentCenter = mapRef.current.getCenter();
    
    // Check if we should update center based on:
    // 1. This appears to be the initial load (center way off)
    // 2. The center point is not within the current view bounds
    // 3. User hasn't manually moved the map
    const isInitialLoad = Math.abs(currentCenter.lng - center[0]) > 1 || 
                         Math.abs(currentCenter.lat - center[1]) > 1;
    
    const centerPoint = new maplibregl.LngLat(center[0], center[1]);
    const isOutsideView = !bounds.contains(centerPoint) && !mapRef.current.isMoving();
    
    // Only fly to a new center if one of the conditions is met
    if (isInitialLoad || isOutsideView) {
      // Use flyTo with a short duration to smoothly transition
      mapRef.current.flyTo({
        center: center,
        duration: 500,
        essential: true
      });
    }
  }, [center, mapLoaded]); // Include center in dependencies to respond to prop changes

  // **State Sync Effects**
  useEffect(() => {
    setSelectedMarker(null);
    setClickedMarkerId(null);
    setClickedCluster(null);
    setTimeout(updateVisibleMarkers, 300);
  }, [filters, searchRadius, queryParams]);

  useEffect(updateMarkerColors, [hoveredListing, clickedMarkerId, selectedMarker, clickedCluster, isFullscreen]);

  // Store previous markers to detect real changes
  const prevMarkersRef = useRef<MapMarker[]>([]);
  
  // Update markers data ref whenever markers prop changes
  useEffect(() => {
    markersDataRef.current = markers;
  }, [markers]);

  // Effect to update map's zoom when the zoom prop changes
  useEffect(() => {
    if (mapRef.current && mapLoaded && zoom !== undefined) {
      if (mapRef.current.getZoom() !== zoom) {
        mapRef.current.setZoom(zoom);
      }
    }
  }, [zoom, mapLoaded]);
  
  // Handle marker changes using debouncing to prevent frequent re-renders
  useEffect(() => {
    // Only proceed if we have a loaded map
    if (!mapRef.current || !mapLoaded) return;
    
    // Don't re-render if map is being dragged
    try {
      if (mapRef.current.isEasing() || mapRef.current.isMoving() || mapRef.current.isZooming()) {
        return;
      }
    } catch (e) {
      console.error("Error checking map state:", e);
      return;
    }
    
    // Create a map of previous markers by ID for efficient lookup
    const prevMarkersMap = new Map(
      prevMarkersRef.current.map(m => [m.listing.id, m])
    );
    
    // Check if markers have actually changed position or count
    const markersChanged = markers.length !== prevMarkersRef.current.length ||
      markers.some((marker) => {
        const prevMarker = prevMarkersMap.get(marker.listing.id);
        return !prevMarker || 
               marker.lat !== prevMarker.lat ||
               marker.lng !== prevMarker.lng;
      });
    
    
    // Debounce marker updates to reduce flickering
    const safelyUpdateMarkers = () => {
      if (!mapRef.current) return;
      
      try {
        updateVisibleMarkers();
        
        // Only re-render markers if positions/count changed
        if (markersChanged) {
          renderMarkers();
          prevMarkersRef.current = [...markers];
        } else {
          // Just update colors if only like/dislike states changed
          updateMarkerColors();
        }
      } catch (e) {
        console.error("Error updating markers:", e);
      }
    };
    
    // Use a longer delay to prevent too frequent updates
    const timeoutId = setTimeout(safelyUpdateMarkers, 200);
    return () => clearTimeout(timeoutId);
  }, [markers, mapLoaded, currentZoom]);
  
  // Handle fullscreen toggle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    // Define a function to safely update the map after fullscreen toggle
    const safelyHandleFullscreenChange = () => {
      if (!mapRef.current) return;
      
      try {
        if (!isFullscreen) {
          updateVisibleMarkers();
          renderMarkers();
        }
        
        // Ensure map resizes properly after fullscreen toggle
        mapRef.current.resize();
      } catch (e) {
        console.error("Error handling fullscreen change:", e);
      }
    };
    
    // Small delay to ensure the container has resized
    const timeoutId = setTimeout(safelyHandleFullscreenChange, 200);
    return () => clearTimeout(timeoutId);
  }, [isFullscreen, mapLoaded, currentZoom]);


  const handleFullscreen = () => {
    // Don't adjust zoom when toggling fullscreen - just toggle the state
    setIsFullscreen(!isFullscreen);
    
    // Clear selections when switching modes
    if (!isFullscreen) {
      // Entering fullscreen - clear non-fullscreen selection
      setClickedMarkerId(null);
      useVisibleListingsStore.getState().setVisibleListingIds(null);
    } else {
      // Exiting fullscreen - clear fullscreen selection
      setSelectedMarker(null);
    }
    
    // Schedule a resize after the state change is processed
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 50);
  }

  // **Render**
  return (
    <div style={{ height }} ref={mapContainerRef}>
      {mapLoaded === true && mapRef.current && (
        <>
          <div className="absolute top-2 right-2 z-10 flex flex-col">
            <button onClick={() => mapRef.current?.zoomIn()} className="bg-white p-2 rounded-md shadow mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button onClick={() => mapRef.current?.zoomOut()} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 12H6" />
              </svg>
            </button>
          </div>
          <div className="absolute top-2 left-2 z-10">
            <button onClick={handleFullscreen} className="bg-white p-2 rounded-md shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={isFullscreen ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"}
                />
              </svg>
            </button>
          </div>
          {selectedMarker && isFullscreen && center && (
            <>
              <div className="hidden md:block">
                <DesktopListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
                  customSnapshot={markers[0]?.listing?.customSnapshot} // Pass the custom snapshot from markers
                />
              </div>
              <div className="block md:hidden">
                <ListingCard
                  listing={{ ...selectedMarker.listing, price: selectedMarker.listing.price ?? 0 }}
                  distance={calculateDistance(center[1], center[0], selectedMarker.lat, selectedMarker.lng)}
                  onClose={() => setSelectedMarker(null)}
                  className="top-4 left-1/2 transform -translate-x-1/2 w-96"
                  customSnapshot={markers[0]?.listing?.customSnapshot} // Pass the custom snapshot from markers
                />
              </div>
            </>
          )}
        </>
      )}
      
      {/* Fallback UI when map fails to load */}
      {mapInitFailed && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-700 mb-3">Unable to load map</div>
          <div className="text-sm text-gray-500 max-w-md text-center px-4">
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

export default SearchMap;
