import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { useMapSelectionStore } from '@/store/map-selection-store';
import { useVisibleListingsStore } from '@/store/visible-listings-store';

// Constants
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HEART_PATH_REGULAR = 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314';
const HEART_FILTER = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
const BORDER_WIDTH = '0.5px';
const STYLE_UPDATE_DELAY = 50;

interface UseMapMarkerManagerProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  markersRef: React.MutableRefObject<Map<string, maplibregl.Marker>>;
  markersDataRef: React.MutableRefObject<any[]>;
  isFullscreenRef: React.MutableRefObject<boolean>;
  hoveredListing: any;
  selectedMarker: any;
  clickedMarkerId: string | null;
  markerStyles: any;
  setSelectedMarker: (marker: any) => void;
  setClickedMarkerId: (id: string | null) => void;
  getVisibleMarkers: () => any[];
  createSimpleMarker: (marker: any, isHovered: boolean, clickHandler: (e: Event) => void) => maplibregl.Marker | null;
  createPriceBubbleMarker: (marker: any, isHovered: boolean, clickHandler: (e: Event) => void) => maplibregl.Marker | null;
  verifyAllMarkerStyles: (markersRef: React.MutableRefObject<Map<string, maplibregl.Marker>>) => void;
}

export const useMapMarkerManager = ({
  mapRef,
  markersRef,
  markersDataRef,
  isFullscreenRef,
  hoveredListing,
  selectedMarker,
  clickedMarkerId,
  markerStyles,
  setSelectedMarker,
  setClickedMarkerId,
  getVisibleMarkers,
  createSimpleMarker,
  createPriceBubbleMarker,
  verifyAllMarkerStyles
}: UseMapMarkerManagerProps) => {

  // Create a single marker using unified factory - DEFINE FIRST to avoid circular dependency
  const createSingleMarker = useCallback((marker: any) => {
    if (!mapRef.current) return;

    // Get current visible markers count for threshold decision
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? markerStyles.FULLSCREEN_SIMPLE_MARKER_THRESHOLD : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    // Check if this marker is currently hovered or selected
    const isHovered = hoveredListing?.id === marker.listing.id ||
      (!isFullscreenRef?.current && clickedMarkerId === marker.listing.id) ||
      (isFullscreenRef?.current && selectedMarker?.listing.id === marker.listing.id);

    // Create click handler
    const clickHandler = (e: Event) => {
      e.stopPropagation();
      if (isFullscreenRef?.current) {
        setSelectedMarker(prev => (prev?.listing.id === marker.listing.id ? null : marker));
      } else {
        setClickedMarkerId(prev => {
          if (prev === marker.listing.id) {
            useVisibleListingsStore.getState().setVisibleListingIds(null);
            return null;
          } else {
            useVisibleListingsStore.getState().setVisibleListingIds([marker.listing.id]);
            return marker.listing.id;
          }
        });
      }
    };

    // Create marker using appropriate factory method
    const mapMarker = shouldUseSimpleMarkers 
      ? createSimpleMarker(marker, isHovered, clickHandler)
      : createPriceBubbleMarker(marker, isHovered, clickHandler);
    
    if (mapMarker) {
      markersRef.current.set(marker.listing.id, mapMarker);
    }
  }, [
    mapRef,
    getVisibleMarkers,
    isFullscreenRef,
    markerStyles,
    hoveredListing,
    clickedMarkerId,
    selectedMarker,
    setSelectedMarker,
    setClickedMarkerId,
    createSimpleMarker,
    createPriceBubbleMarker,
    markersRef
  ]);

  // Render markers with pooling - reuse existing markers instead of recreating
  const renderMarkers = useCallback(() => {
    if (!mapRef.current) return;
    
    // Get visible markers count for threshold decision
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? markerStyles.FULLSCREEN_SIMPLE_MARKER_THRESHOLD : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    // Create a set of required marker IDs from current data
    const requiredMarkerIds = new Set(markersDataRef.current.map(m => m.listing.id));
    
    // Remove markers that are no longer needed
    const markersToRemove: string[] = [];
    markersRef.current.forEach((marker, id) => {
      if (!requiredMarkerIds.has(id)) {
        marker.remove();
        markersToRemove.push(id);
      }
    });
    markersToRemove.forEach(id => markersRef.current.delete(id));
    
    // Update existing markers and create new ones only as needed
    markersDataRef.current.forEach(markerData => {
      const existingMarker = markersRef.current.get(markerData.listing.id);
      if (existingMarker) {
        // Update existing marker position and style
        updateExistingMarker(existingMarker, markerData);
      } else {
        // Create new marker only if it doesn't exist
        createSingleMarker(markerData);
      }
    });
    
    // Verify all marker styles after rendering
    setTimeout(() => verifyAllMarkerStyles(markersRef), STYLE_UPDATE_DELAY);
  }, [mapRef, getVisibleMarkers, isFullscreenRef, markerStyles, markersDataRef, markersRef, verifyAllMarkerStyles, createSingleMarker]);

  // Update existing marker position and style without recreation
  const updateExistingMarker = useCallback((mapMarker: maplibregl.Marker, markerData: any) => {
    // Update marker position
    mapMarker.setLngLat([markerData.lng, markerData.lat]);
    
    // Get the marker element and check what type it currently is
    const el = mapMarker.getElement();
    
    // Use same visible markers calculation as renderMarkers for consistency
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? markerStyles.FULLSCREEN_SIMPLE_MARKER_THRESHOLD : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    // Check current marker type
    const isCurrentlySimple = el.querySelector('svg circle') !== null;
    const isCurrentlyPriceBubble = el.className.includes('price-bubble-marker');
    
    // If marker type needs to change, remove and recreate it
    if ((shouldUseSimpleMarkers && isCurrentlyPriceBubble) || (!shouldUseSimpleMarkers && isCurrentlySimple)) {
      // Remove the old marker and create a new one with the correct type
      mapMarker.remove();
      markersRef.current.delete(markerData.listing.id);
      createSingleMarker(markerData);
      return;
    }
    
    // Same marker type, just update styles
    if (shouldUseSimpleMarkers) {
      // Handle simple marker updates
      const svg = el.querySelector('svg');
      const innerCircle = el.querySelector('svg circle:last-child');
      
      if (svg && innerCircle) {
        const isHovered = hoveredListing?.id === markerData.listing.id ||
          (!isFullscreenRef?.current && clickedMarkerId === markerData.listing.id) ||
          (isFullscreenRef?.current && selectedMarker?.listing.id === markerData.listing.id);
        
        let colors;
        if (isHovered) {
          colors = markerStyles.MARKER_COLORS.HOVER;
        } else if (markerData.listing.isLiked) {
          colors = markerStyles.MARKER_COLORS.DEFAULT;
        } else if (markerData.listing.isDisliked) {
          colors = markerStyles.MARKER_COLORS.DISLIKED;
        } else {
          colors = markerStyles.MARKER_COLORS.DEFAULT;
        }
        
        // Update colors without recreation
        const outerCircle = svg.querySelector('circle:first-child');
        if (outerCircle) outerCircle.setAttribute('fill', colors.primary);
        innerCircle.setAttribute('fill', colors.secondary);
        
        // Handle heart icon for liked markers
        let heartIcon = svg.querySelector('.marker-heart-icon');
        if (markerData.listing.isLiked && !heartIcon) {
          // Add heart icon
          const heartPath = document.createElementNS(SVG_NAMESPACE, 'path');
          heartPath.setAttribute('class', 'marker-heart-icon');
          heartPath.setAttribute('fill-rule', 'evenodd');
          heartPath.setAttribute('d', HEART_PATH_REGULAR);
          heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
          heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform + ' ' + markerStyles.HEART_ICON.simpleMarkerScale);
          heartPath.style.filter = HEART_FILTER;
          svg.appendChild(heartPath);
        } else if (!markerData.listing.isLiked && heartIcon) {
          // Remove heart icon
          heartIcon.remove();
        }
      }
    } else {
      // Handle price bubble marker updates
      const isHovered = hoveredListing?.id === markerData.listing.id ||
        (!isFullscreenRef?.current && clickedMarkerId === markerData.listing.id) ||
        (isFullscreenRef?.current && selectedMarker?.listing.id === markerData.listing.id);
      
      let colors;
      if (isHovered) {
        colors = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
      } else if (markerData.listing.isDisliked) {
        colors = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
      } else {
        colors = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
      }
      
      // Update price bubble styles
      const markerElementStyles = {
        backgroundColor: colors.background,
        color: colors.text,
        border: `${BORDER_WIDTH} solid ${colors.border}`,
        zIndex: (isHovered ? markerStyles.Z_INDEX.HOVER : markerData.listing.isLiked ? markerStyles.Z_INDEX.LIKED : markerStyles.Z_INDEX.DEFAULT),
      };
      
      // Apply styles without recreating element
      Object.assign(el.style, markerElementStyles);
      
      // Update price text and heart icon
      const price = markerData.listing.calculatedPrice || markerData.listing.price;
      const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
      
      if (markerData.listing.isLiked) {
        // Add heart if not present
        if (!el.querySelector('svg')) {
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
                <path fill-rule="evenodd" d="${HEART_PATH_REGULAR}" />
              </svg>
            </span>
          `;
        }
      } else {
        // Remove heart and update text
        const svg = el.querySelector('svg');
        if (svg) {
          svg.remove();
          const span = el.querySelector('span');
          if (span) {
            span.textContent = formattedPrice;
          } else {
            el.textContent = formattedPrice;
          }
        } else {
          el.textContent = formattedPrice;
        }
      }
    }
  }, [
    getVisibleMarkers,
    isFullscreenRef,
    markerStyles,
    hoveredListing,
    clickedMarkerId,
    selectedMarker,
    markersRef,
    createSingleMarker
  ]);

  return {
    renderMarkers,
    updateExistingMarker,
    createSingleMarker
  };
};