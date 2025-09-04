import { useRef, useCallback } from 'react';

// Constants for debouncing and timing
const DEBOUNCE_DELAY = 100;
const STYLE_UPDATE_DELAY = 50;
const BATCH_UPDATE_DELAY = 10;
const BATCH_STYLE_DELAY = 30;

// Constants for SVG elements
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HEART_PATH_SIMPLE = 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5';
const HEART_PATH_REGULAR = 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314';
const HEART_SCALE_SIMPLE = 'scale(0.5)';
const HEART_FILTER = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
const BORDER_WIDTH = '0.5px';

interface MarkerStyles {
  SIMPLE_MARKER_THRESHOLD: number;
  FULLSCREEN_SIMPLE_MARKER_THRESHOLD: number;
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
  Z_INDEX: {
    HOVER: string;
    SELECTED: string;
    LIKED: string;
    DEFAULT: string;
    DISLIKED: string;
  };
}

interface UseMapMarkerStylesProps {
  markerStyles: MarkerStyles;
  isFullscreenRef: React.MutableRefObject<boolean>;
  hoveredListing: any;
  clickedMarkerId: string | null;
  selectedMarker: any;
  markersRef: React.MutableRefObject<Map<string, any>>;
  markersDataRef: React.MutableRefObject<any[]>;
  getVisibleMarkers: () => any[];
  verifyAndFixMarkerStyles: (element: HTMLElement) => boolean;
}

export const useMapMarkerStyles = ({
  markerStyles,
  isFullscreenRef,
  hoveredListing,
  clickedMarkerId,
  selectedMarker,
  markersRef,
  markersDataRef,
  getVisibleMarkers,
  verifyAndFixMarkerStyles
}: UseMapMarkerStylesProps) => {
  const lastUpdateRef = useRef<number>(0);
  const styleUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  const scheduledStyleUpdates = useRef<Map<HTMLElement, Record<string, string>>>(new Map());

  // Style update scheduler
  const scheduleStyleUpdate = useCallback((element: HTMLElement, styles: Record<string, string>) => {
    scheduledStyleUpdates.current.set(element, styles);
    
    if (styleUpdateTimer.current) clearTimeout(styleUpdateTimer.current);
    
    styleUpdateTimer.current = setTimeout(() => {
      requestAnimationFrame(() => {
        scheduledStyleUpdates.current.forEach((styles, el) => {
          Object.entries(styles).forEach(([key, value]) => {
            // Update the style
            (el.style as any)[key] = value;
            // Also update the data attribute to prevent verifyAndFixMarkerStyles from reverting it
            const dataKey = `style${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            el.dataset[dataKey] = value;
          });
        });
        scheduledStyleUpdates.current.clear();
      });
    }, BATCH_UPDATE_DELAY);
  }, []);

  // Get marker state helper
  const getMarkerState = useCallback((id: string, correspondingMarker: any) => {
    const isSelected = isFullscreenRef.current && selectedMarker?.listing.id === id;
    const isHovered = hoveredListing?.id === id || (!isFullscreenRef.current && clickedMarkerId === id);
    const isLiked = correspondingMarker?.listing.isLiked;
    const isDisliked = correspondingMarker?.listing.isDisliked;


    if (isSelected) return { type: 'selected', isLiked, isDisliked };
    if (isHovered) return { type: 'hover', isLiked, isDisliked };
    if (isDisliked) return { type: 'disliked', isLiked, isDisliked };
    if (isLiked) return { type: 'liked', isLiked, isDisliked };
    return { type: 'default', isLiked, isDisliked };
  }, [isFullscreenRef, hoveredListing, clickedMarkerId, selectedMarker]);

  // Update simple marker colors
  const updateSimpleMarkerColors = useCallback((el: HTMLElement, state: any) => {
    const svg = el.querySelector('svg');
    const innerCircle = el.querySelector('svg circle:last-child');
    const markerShape = el.querySelector('svg g:nth-child(2)');
    if (!markerShape || !innerCircle || !svg) return;
    
    svg.style.overflow = 'visible';

    let colors, zIndex;
    switch (state.type) {
      case 'selected':
      case 'hover':
        colors = markerStyles.MARKER_COLORS.HOVER;
        zIndex = state.type === 'selected' ? markerStyles.Z_INDEX.SELECTED : markerStyles.Z_INDEX.HOVER;
        break;
      case 'disliked':
        colors = markerStyles.MARKER_COLORS.DISLIKED;
        zIndex = markerStyles.Z_INDEX.DISLIKED;
        break;
      default:
        colors = markerStyles.MARKER_COLORS.DEFAULT;
        zIndex = state.isLiked ? markerStyles.Z_INDEX.LIKED : markerStyles.Z_INDEX.DEFAULT;
    }

    markerShape.setAttribute('fill', colors.primary);
    innerCircle.setAttribute('fill', colors.secondary);
    el.style.zIndex = zIndex;
  }, [markerStyles]);

  // Manage simple marker heart
  const manageSimpleMarkerHeart = useCallback((svg: SVGElement, isLiked: boolean) => {
    const existingHeart = svg.querySelector('.marker-heart-icon');
    
    if (isLiked && !existingHeart) {
      if (markerStyles.HEART_ICON.withBackground) {
        const heartGroup = document.createElementNS(SVG_NAMESPACE, 'g');
        heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
        heartGroup.setAttribute('class', 'marker-heart-icon');

        // Add white background circle for contrast
        const bgCircle = document.createElementNS(SVG_NAMESPACE, 'circle');
        bgCircle.setAttribute('cx', '0');
        bgCircle.setAttribute('cy', '0');
        bgCircle.setAttribute('r', markerStyles.HEART_ICON.backgroundCircle.radius);
        bgCircle.setAttribute('fill', markerStyles.HEART_ICON.backgroundCircle.fill);
        bgCircle.setAttribute('stroke', markerStyles.HEART_ICON.backgroundCircle.stroke);
        bgCircle.setAttribute('stroke-width', markerStyles.HEART_ICON.backgroundCircle.strokeWidth);

        // Add heart path
        const heartPath = document.createElementNS(SVG_NAMESPACE, 'path');
        heartPath.setAttribute('d', HEART_PATH_SIMPLE);
        heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
        heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);

        heartGroup.appendChild(bgCircle);
        heartGroup.appendChild(heartPath);
        svg.appendChild(heartGroup);
      } else {
        // Heart without background
        const heartPath = document.createElementNS(SVG_NAMESPACE, 'path');
        heartPath.setAttribute('d', HEART_PATH_REGULAR);
        heartPath.setAttribute('fill', markerStyles.HEART_ICON.color);
        heartPath.setAttribute('transform', `${markerStyles.HEART_ICON.simpleMarkerTransform} ${HEART_SCALE_SIMPLE}`);
        heartPath.setAttribute('class', 'marker-heart-icon');
        heartPath.style.filter = HEART_FILTER;

        svg.appendChild(heartPath);
      }
    } else if (!isLiked && existingHeart) {
      existingHeart.remove();
    }
  }, [markerStyles]);

  // Get formatted price
  const getFormattedPrice = useCallback((correspondingMarker: any) => {
    if (!correspondingMarker) return 'N/A';
    const price = correspondingMarker.listing.calculatedPrice || correspondingMarker.listing.price;
    return (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';
  }, []);

  // Update price bubble colors
  const updatePriceBubbleColors = useCallback((el: HTMLElement, state: any) => {
    let colors, zIndex;
    switch (state.type) {
      case 'selected':
        colors = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
        zIndex = markerStyles.Z_INDEX.SELECTED;
        break;
      case 'hover':
        colors = markerStyles.PRICE_BUBBLE_COLORS.HOVER;
        zIndex = markerStyles.Z_INDEX.HOVER;
        break;
      case 'disliked':
        colors = markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
        zIndex = markerStyles.Z_INDEX.DISLIKED;
        break;
      default:
        colors = markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
        zIndex = state.isLiked ? markerStyles.Z_INDEX.LIKED : markerStyles.Z_INDEX.DEFAULT;
    }

    scheduleStyleUpdate(el, {
      backgroundColor: colors.background,
      color: colors.text,
      border: `${BORDER_WIDTH} solid ${colors.border}`,
      zIndex
    });
  }, [markerStyles, scheduleStyleUpdate]);

  // Manage price bubble heart
  const managePriceBubbleHeart = useCallback((el: HTMLElement, isLiked: boolean, formattedPrice: string) => {
    const existingHeart = el.querySelector('svg');
    const existingSpan = el.querySelector('span');
    
    if (isLiked) {
      // If heart already exists, don't recreate it
      if (existingHeart) {
        // Just update the price text if needed
        if (existingSpan && existingSpan.childNodes[0]?.nodeType === Node.TEXT_NODE) {
          existingSpan.childNodes[0].textContent = formattedPrice;
        }
        return;
      }
      
      // Create heart only if it doesn't exist
      const span = document.createElement('span');
      span.style.position = 'relative';
      span.textContent = formattedPrice;

      const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
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

      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', HEART_PATH_REGULAR);

      svg.appendChild(path);
      span.appendChild(svg);
      el.textContent = '';
      el.appendChild(span);
    } else if (!isLiked && existingHeart) {
      // Remove heart if it exists but shouldn't
      existingHeart.remove();
      const span = el.querySelector('span');
      if (span) {
        span.textContent = formattedPrice;
      } else {
        el.textContent = formattedPrice;
      }
    } else if (!isLiked && !existingHeart) {
      // No heart and shouldn't have one - just ensure price is shown
      if (!existingSpan || existingSpan.textContent !== formattedPrice) {
        el.textContent = formattedPrice;
      }
    }
  }, [markerStyles]);

  // Main update marker colors function
  const updateMarkerColors = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < DEBOUNCE_DELAY) {
      return;
    }
    lastUpdateRef.current = now;
    
    const visibleMarkers = getVisibleMarkers();
    const threshold = isFullscreenRef.current ? markerStyles.FULLSCREEN_SIMPLE_MARKER_THRESHOLD : markerStyles.SIMPLE_MARKER_THRESHOLD;
    const shouldUseSimpleMarkers = visibleMarkers.length > threshold;
    
    // Batch updates in requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      const updates: Array<() => void> = [];
      
      markersRef.current.forEach((marker, id) => {
        const el = marker.getElement();
        
        // Skip markers that are being created or transitioned
        if (el.dataset.creating === 'true') {
          return;
        }
        
        const correspondingMarker = markersDataRef.current.find(m => m.listing.id === id);
        
        if (!correspondingMarker) {
          return;
        }
        
        const state = getMarkerState(id, correspondingMarker);

        if (shouldUseSimpleMarkers) {
          // Handle simple markers (>threshold listings)
          updates.push(() => {
            updateSimpleMarkerColors(el, state);
            const svg = el.querySelector('svg');
            if (svg) {
              manageSimpleMarkerHeart(svg, state.isLiked);
            }
          });
        } else {
          // Handle price bubble markers (≤threshold listings)
          updates.push(() => {
            // Check if element contains the price-bubble-marker class (not exact match)
            if (el.className.includes('price-bubble-marker')) {
              updatePriceBubbleColors(el, state);
              const formattedPrice = getFormattedPrice(correspondingMarker);
              managePriceBubbleHeart(el, state.isLiked, formattedPrice);
              
              // Immediate style verification for price bubbles
              verifyAndFixMarkerStyles(el);
            }
          });
        }
      });
      
      // Execute all updates
      updates.forEach(update => update());
    });
  }, [
    getVisibleMarkers,
    isFullscreenRef,
    markerStyles,
    markersRef,
    markersDataRef,
    getMarkerState,
    updateSimpleMarkerColors,
    manageSimpleMarkerHeart,
    updatePriceBubbleColors,
    getFormattedPrice,
    managePriceBubbleHeart,
    verifyAndFixMarkerStyles
  ]);

  return {
    updateMarkerColors,
    scheduleStyleUpdate
  };
};