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
const TRANSITION_CLEANUP_DELAY = 100;

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
  
  // Track markers currently being transitioned to prevent race conditions
  const transitioningMarkers = new Set<string>();

  // ============================================
  // Marker State Helpers
  // ============================================
  
  const isMapAvailable = () => {
    return mapRef.current !== null;
  };

  const getMarkerThreshold = useCallback(() => {
    return isFullscreenRef.current 
      ? markerStyles.FULLSCREEN_SIMPLE_MARKER_THRESHOLD 
      : markerStyles.SIMPLE_MARKER_THRESHOLD;
  }, [isFullscreenRef, markerStyles]);

  const shouldUseSimpleMarkers = useCallback(() => {
    const visibleMarkers = getVisibleMarkers();
    const threshold = getMarkerThreshold();
    return visibleMarkers.length > threshold;
  }, [getVisibleMarkers, getMarkerThreshold]);

  const isMarkerHovered = useCallback((marker: any) => {
    const isHoveredInList = hoveredListing?.id === marker.listing.id;
    const isClickedInNormalMode = !isFullscreenRef?.current && clickedMarkerId === marker.listing.id;
    const isSelectedInFullscreen = isFullscreenRef?.current && selectedMarker?.listing.id === marker.listing.id;
    
    return isHoveredInList || isClickedInNormalMode || isSelectedInFullscreen;
  }, [hoveredListing, isFullscreenRef, clickedMarkerId, selectedMarker]);

  // ============================================
  // Click Handler Management
  // ============================================
  
  const handleFullscreenMarkerClick = useCallback((marker: any) => {
    const isSameMarker = selectedMarker?.listing.id === marker.listing.id;
    setSelectedMarker(isSameMarker ? null : marker);
  }, [selectedMarker, setSelectedMarker]);

  const handleNormalMarkerClick = useCallback((marker: any) => {
    const isSameMarker = clickedMarkerId === marker.listing.id;
    
    if (isSameMarker) {
      clearVisibleListings();
      setClickedMarkerId(null);
    } else {
      filterToSingleListing(marker.listing.id);
      setClickedMarkerId(marker.listing.id);
    }
  }, [clickedMarkerId, setClickedMarkerId]);

  const clearVisibleListings = () => {
    useVisibleListingsStore.getState().setVisibleListingIds(null);
  };

  const filterToSingleListing = (listingId: string) => {
    useVisibleListingsStore.getState().setVisibleListingIds([listingId]);
  };

  const createMarkerClickHandler = useCallback((marker: any) => {
    return (e: Event) => {
      e.stopPropagation();
      
      if (isFullscreenRef?.current) {
        handleFullscreenMarkerClick(marker);
      } else {
        handleNormalMarkerClick(marker);
      }
    };
  }, [isFullscreenRef, handleFullscreenMarkerClick, handleNormalMarkerClick]);

  // ============================================
  // Single Marker Creation
  // ============================================
  
  const selectMarkerFactory = useCallback((shouldUseSimple: boolean) => {
    return shouldUseSimple ? createSimpleMarker : createPriceBubbleMarker;
  }, [createSimpleMarker, createPriceBubbleMarker]);

  const storeMarkerReference = useCallback((markerId: string, mapMarker: maplibregl.Marker) => {
    if (mapMarker) {
      markersRef.current.set(markerId, mapMarker);
    }
  }, [markersRef]);

  const createSingleMarker = useCallback((marker: any) => {
    if (!isMapAvailable()) return;

    const isHovered = isMarkerHovered(marker);
    const clickHandler = createMarkerClickHandler(marker);
    const shouldUseSimple = shouldUseSimpleMarkers();
    
    const markerFactory = selectMarkerFactory(shouldUseSimple);
    const mapMarker = markerFactory(marker, isHovered, clickHandler);
    
    storeMarkerReference(marker.listing.id, mapMarker);
  }, [
    isMarkerHovered,
    createMarkerClickHandler,
    shouldUseSimpleMarkers,
    selectMarkerFactory,
    storeMarkerReference
  ]);

  // ============================================
  // Marker Removal
  // ============================================
  
  const getRequiredMarkerIds = useCallback(() => {
    return new Set(markersDataRef.current.map(m => m.listing.id));
  }, [markersDataRef]);

  const findObsoleteMarkers = useCallback(() => {
    const requiredIds = getRequiredMarkerIds();
    const obsoleteMarkers: string[] = [];
    
    markersRef.current.forEach((marker, id) => {
      if (!requiredIds.has(id)) {
        obsoleteMarkers.push(id);
      }
    });
    
    return obsoleteMarkers;
  }, [markersRef, getRequiredMarkerIds]);

  const removeMarker = useCallback((markerId: string) => {
    const marker = markersRef.current.get(markerId);
    if (marker) {
      marker.remove();
      markersRef.current.delete(markerId);
    }
  }, [markersRef]);

  const removeObsoleteMarkers = useCallback(() => {
    const obsoleteMarkers = findObsoleteMarkers();
    obsoleteMarkers.forEach(removeMarker);
  }, [findObsoleteMarkers, removeMarker]);

  // ============================================
  // Marker Type Transition
  // ============================================
  
  const isMarkerTransitioning = (markerId: string) => {
    return transitioningMarkers.has(markerId);
  };

  const markTransitionStart = (markerId: string) => {
    transitioningMarkers.add(markerId);
  };

  const markTransitionEnd = (markerId: string) => {
    setTimeout(() => {
      transitioningMarkers.delete(markerId);
    }, TRANSITION_CLEANUP_DELAY);
  };

  const isElementBeingCreated = (element: HTMLElement) => {
    return element.dataset.creating === 'true';
  };

  const getCurrentMarkerType = (element: HTMLElement) => {
    const hasCircle = element.querySelector('svg circle') !== null;
    const hasPriceBubbleClass = element.className.includes('price-bubble-marker');
    
    return {
      isSimple: hasCircle,
      isPriceBubble: hasPriceBubbleClass
    };
  };

  const needsMarkerTypeChange = useCallback((element: HTMLElement) => {
    const shouldUseSimple = shouldUseSimpleMarkers();
    const { isSimple, isPriceBubble } = getCurrentMarkerType(element);
    
    const needsChangeToSimple = shouldUseSimple && isPriceBubble;
    const needsChangeToPriceBubble = !shouldUseSimple && isSimple;
    
    return needsChangeToSimple || needsChangeToPriceBubble;
  }, [shouldUseSimpleMarkers]);

  const transitionMarkerType = useCallback((mapMarker: maplibregl.Marker, markerData: any) => {
    markTransitionStart(markerData.listing.id);
    
    mapMarker.remove();
    markersRef.current.delete(markerData.listing.id);
    
    Promise.resolve().then(() => {
      createSingleMarker(markerData);
      markTransitionEnd(markerData.listing.id);
    });
  }, [markersRef, createSingleMarker]);

  // ============================================
  // Style Updates for Existing Markers
  // ============================================
  
  const updateSimpleMarkerStyles = useCallback((element: HTMLElement, markerData: any, isHovered: boolean) => {
    updateSimpleMarkerColors(element, markerData, isHovered);
    updateSimpleMarkerHeart(element, markerData);
  }, [markerStyles]);

  const updateSimpleMarkerColors = (element: HTMLElement, markerData: any, isHovered: boolean) => {
    const svg = element.querySelector('svg');
    const innerCircle = element.querySelector('svg circle:last-child');
    
    if (!svg || !innerCircle) return;
    
    const colors = getSimpleMarkerColors(markerData, isHovered);
    updateCircleColors(svg, innerCircle, colors);
  };

  const getSimpleMarkerColors = (markerData: any, isHovered: boolean) => {
    if (isHovered) return markerStyles.MARKER_COLORS.HOVER;
    if (markerData.listing.isDisliked) return markerStyles.MARKER_COLORS.DISLIKED;
    if (markerData.listing.isLiked) return markerStyles.MARKER_COLORS.DEFAULT;
    return markerStyles.MARKER_COLORS.DEFAULT;
  };

  const updateCircleColors = (svg: SVGElement, innerCircle: Element, colors: any) => {
    const outerCircle = svg.querySelector('circle:first-child');
    if (outerCircle) {
      outerCircle.setAttribute('fill', colors.primary);
    }
    innerCircle.setAttribute('fill', colors.secondary);
  };

  const updateSimpleMarkerHeart = (element: HTMLElement, markerData: any) => {
    const svg = element.querySelector('svg');
    if (!svg) return;
    
    const heartIcon = svg.querySelector('.marker-heart-icon');
    const shouldHaveHeart = markerData.listing.isLiked;
    
    if (shouldHaveHeart && !heartIcon) {
      addHeartToSimpleMarker(svg);
    } else if (!shouldHaveHeart && heartIcon) {
      heartIcon.remove();
    }
  };

  const addHeartToSimpleMarker = (svg: Element) => {
    const heartPath = createHeartPathElement();
    svg.appendChild(heartPath);
  };

  const createHeartPathElement = () => {
    const heartPath = document.createElementNS(SVG_NAMESPACE, 'path');
    heartPath.setAttribute('class', 'marker-heart-icon');
    heartPath.setAttribute('fill-rule', 'evenodd');
    heartPath.setAttribute('d', HEART_PATH_REGULAR);
    heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
    heartPath.setAttribute('transform', 
      `${markerStyles.HEART_ICON.simpleMarkerTransform} ${markerStyles.HEART_ICON.simpleMarkerScale}`
    );
    heartPath.style.filter = HEART_FILTER;
    return heartPath;
  };

  const updatePriceBubbleStyles = useCallback((element: HTMLElement, markerData: any, isHovered: boolean) => {
    const colors = getPriceBubbleColors(markerData, isHovered);
    applyPriceBubbleStyles(element, colors);
    updatePriceBubbleContent(element, markerData);
  }, [markerStyles]);

  const getPriceBubbleColors = (markerData: any, isHovered: boolean) => {
    if (isHovered) return markerStyles.PRICE_BUBBLE_COLORS.HOVER;
    if (markerData.listing.isDisliked) return markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
    return markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
  };

  const applyPriceBubbleStyles = (element: HTMLElement, colors: any) => {
    Object.assign(element.style, {
      backgroundColor: colors.background,
      color: colors.text,
      border: `${BORDER_WIDTH} solid ${colors.border}`,
      zIndex: markerStyles.Z_INDEX.DEFAULT
    });
  };

  const updatePriceBubbleContent = (element: HTMLElement, markerData: any) => {
    const price = markerData.listing.calculatedPrice || markerData.listing.price;
    const formattedPrice = formatPrice(price);
    
    if (markerData.listing.isLiked) {
      updatePriceBubbleWithHeart(element, formattedPrice);
    } else {
      updatePriceBubbleWithoutHeart(element, formattedPrice);
    }
  };

  const formatPrice = (price: number | null | undefined): string => {
    return (price !== null && price !== undefined) 
      ? `$${price.toLocaleString()}` 
      : 'N/A';
  };

  const updatePriceBubbleWithHeart = (element: HTMLElement, formattedPrice: string) => {
    if (!element.querySelector('svg')) {
      element.innerHTML = createPriceWithHeartHtml(formattedPrice);
    }
  };

  const updatePriceBubbleWithoutHeart = (element: HTMLElement, formattedPrice: string) => {
    const svg = element.querySelector('svg');
    if (svg) {
      svg.remove();
      updateElementText(element, formattedPrice);
    }
  };

  const updateElementText = (element: HTMLElement, text: string) => {
    const span = element.querySelector('span');
    if (span) {
      span.textContent = text;
    } else {
      element.textContent = text;
    }
  };

  const createPriceWithHeartHtml = (formattedPrice: string): string => {
    return `
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
  };

  // ============================================
  // Update Existing Marker
  // ============================================
  
  const updateMarkerPosition = (mapMarker: maplibregl.Marker, markerData: any) => {
    mapMarker.setLngLat([markerData.lng, markerData.lat]);
  };

  const updateExistingMarker = useCallback((mapMarker: maplibregl.Marker, markerData: any) => {
    if (isMarkerTransitioning(markerData.listing.id)) {
      return;
    }
    
    updateMarkerPosition(mapMarker, markerData);
    
    const element = mapMarker.getElement();
    
    if (isElementBeingCreated(element)) {
      return;
    }
    
    if (needsMarkerTypeChange(element)) {
      transitionMarkerType(mapMarker, markerData);
      return;
    }
    
    updateMarkerInPlace(element, markerData);
  }, [needsMarkerTypeChange, transitionMarkerType]);

  const updateMarkerInPlace = (element: HTMLElement, markerData: any) => {
    const isHovered = isMarkerHovered(markerData);
    const isSimple = shouldUseSimpleMarkers();
    
    if (isSimple) {
      updateSimpleMarkerStyles(element, markerData, isHovered);
    } else {
      updatePriceBubbleStyles(element, markerData, isHovered);
    }
  };

  // ============================================
  // Main Render Function
  // ============================================
  
  const updateOrCreateMarkers = useCallback(() => {
    markersDataRef.current.forEach(markerData => {
      const existingMarker = markersRef.current.get(markerData.listing.id);
      
      if (existingMarker) {
        updateExistingMarker(existingMarker, markerData);
      } else {
        createSingleMarker(markerData);
      }
    });
  }, [markersDataRef, markersRef, updateExistingMarker, createSingleMarker]);

  const scheduleStyleVerification = useCallback(() => {
    setTimeout(() => verifyAllMarkerStyles(markersRef), STYLE_UPDATE_DELAY);
  }, [verifyAllMarkerStyles, markersRef]);

  const renderMarkers = useCallback(() => {
    if (!isMapAvailable()) return;
    
    removeObsoleteMarkers();
    updateOrCreateMarkers();
    scheduleStyleVerification();
  }, [removeObsoleteMarkers, updateOrCreateMarkers, scheduleStyleVerification]);

  // ============================================
  // Public API
  // ============================================
  
  return {
    renderMarkers,
    updateExistingMarker,
    createSingleMarker
  };
};