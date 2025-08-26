import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// Constants
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HEART_PATH_SIMPLE = 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5';
const HEART_PATH_REGULAR = 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314';
const HEART_SCALE_SIMPLE = 'scale(0.5)';
const HEART_FILTER = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';
const BORDER_WIDTH = '0.5px';
const BOX_SHADOW = '0 2px 4px rgba(0,0,0,0.3)';
const SIMPLE_MARKER_SCALE = 0.7;
const STYLE_UPDATE_DELAY = 50;

// Utility functions for marker creation
const createSVGElement = (tag: string, attributes: Record<string, string> = {}): SVGElement => {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

const createHeartPath = (pathData: string, heartColor: string, attributes: Record<string, string> = {}): SVGPathElement => {
  const path = createSVGElement('path', {
    d: pathData,
    fill: heartColor,
    ...attributes
  }) as SVGPathElement;
  path.style.filter = HEART_FILTER;
  return path;
};

const createHeartGroup = (markerStyles: any, isSimpleMarker = false): SVGGElement => {
  const heartGroup = createSVGElement('g') as SVGGElement;
  
  if (isSimpleMarker) {
    if (markerStyles.HEART_ICON.withBackground) {
      // Simple marker with background circle
      const bgCircle = createSVGElement('circle', {
        cx: '0',
        cy: '0',
        r: markerStyles.HEART_ICON.backgroundCircle.radius,
        fill: markerStyles.HEART_ICON.backgroundCircle.fill,
        stroke: markerStyles.HEART_ICON.backgroundCircle.stroke,
        'stroke-width': markerStyles.HEART_ICON.backgroundCircle.strokeWidth
      });
      heartGroup.appendChild(bgCircle);
      
      const heartPath = createHeartPath(HEART_PATH_SIMPLE, markerStyles.HEART_ICON.color);
      heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);
      heartGroup.appendChild(heartPath);
    } else {
      // Simple marker without background
      const heartPath = createHeartPath(HEART_PATH_REGULAR, markerStyles.HEART_ICON.color, {
        transform: `${markerStyles.HEART_ICON.simpleMarkerTransform} ${HEART_SCALE_SIMPLE}`
      });
      heartGroup.appendChild(heartPath);
    }
  } else {
    // Price bubble marker
    const heartPath = createHeartPath(HEART_PATH_REGULAR, markerStyles.HEART_ICON.color);
    heartGroup.appendChild(heartPath);
  }
  
  return heartGroup;
};

const applyMarkerStylesUtility = (element: HTMLElement, styles: Record<string, string>) => {
  // Store intended styles as data attributes first
  Object.entries(styles).forEach(([key, value]) => {
    element.dataset[`style${key.charAt(0).toUpperCase() + key.slice(1)}`] = value;
  });
  
  // Apply styles after next frame to ensure DOM is ready
  requestAnimationFrame(() => {
    Object.entries(styles).forEach(([key, value]) => {
      (element.style as any)[key] = value;
    });
  });
};

interface UseMapMarkerFactoryProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  markerStyles: any;
  verifyAndFixMarkerStyles: (element: HTMLElement) => boolean;
}

export const useMapMarkerFactory = ({
  mapRef,
  markerStyles,
  verifyAndFixMarkerStyles
}: UseMapMarkerFactoryProps) => {

  // Create price bubble marker content with heart if liked
  const createPriceBubbleContent = useCallback((marker: any, formattedPrice: string): string => {
    if (marker.listing.isLiked) {
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
    }
    return formattedPrice;
  }, [markerStyles]);

  // Get marker colors based on state
  const getMarkerColors = useCallback((marker: any, isHovered: boolean) => {
    if (isHovered) {
      return markerStyles.PRICE_BUBBLE_COLORS.HOVER;
    } else if (marker.listing.isDisliked) {
      return markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
    } else {
      return markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
    }
  }, [markerStyles]);

  // Create simple marker (for high density views)
  const createSimpleMarker = useCallback((marker: any, isHovered: boolean, clickHandler: (e: Event) => void): maplibregl.Marker | null => {
    if (!mapRef.current) return null;

    const mapMarker = new maplibregl.Marker({
      color: isHovered ? markerStyles.MARKER_COLORS.HOVER.primary : markerStyles.MARKER_COLORS.DEFAULT.primary,
      scale: SIMPLE_MARKER_SCALE
    })
      .setLngLat([marker.lng, marker.lat])
      .addTo(mapRef.current);

    const markerElement = mapMarker.getElement();
    markerElement.style.cursor = 'pointer';
    markerElement.style.overflow = 'visible';
    
    // Apply z-index based on state
    if (isHovered) {
      markerElement.style.zIndex = markerStyles.Z_INDEX.HOVER;
    } else if (marker.listing.isLiked) {
      markerElement.style.zIndex = markerStyles.Z_INDEX.LIKED;
    } else {
      markerElement.style.zIndex = markerStyles.Z_INDEX.DEFAULT;
    }

    // Customize inner circle
    const innerCircle = markerElement.querySelector('svg circle:last-child');
    if (innerCircle) {
      innerCircle.setAttribute('fill', isHovered ? markerStyles.MARKER_COLORS.HOVER.secondary : markerStyles.MARKER_COLORS.DEFAULT.secondary);
    }

    // Add heart icon if liked
    if (marker.listing.isLiked) {
      const svg = markerElement.querySelector('svg');
      if (svg) {
        svg.style.overflow = 'visible';
        const heartGroup = createHeartGroup(markerStyles, true);
        heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
        heartGroup.setAttribute('class', 'marker-heart-icon');
        svg.appendChild(heartGroup);
      }
    }

    markerElement.addEventListener('click', clickHandler);
    return mapMarker;
  }, [mapRef, markerStyles]);

  // Create price bubble marker (for normal density views)
  const createPriceBubbleMarker = useCallback((marker: any, isHovered: boolean, clickHandler: (e: Event) => void): maplibregl.Marker | null => {
    if (!mapRef.current) return null;

    const el = document.createElement('div');
    el.className = 'price-bubble-marker';

    const colors = getMarkerColors(marker, isHovered);
    const price = marker.listing.calculatedPrice || marker.listing.price;
    const formattedPrice = (price !== null && price !== undefined) ? `$${price.toLocaleString()}` : 'N/A';

    // Set content with unified heart creation
    el.innerHTML = createPriceBubbleContent(marker, formattedPrice);

    // Define styles
    const markerElementStyles = {
      padding: '6px 10px',
      borderRadius: '16px',
      backgroundColor: colors.background,
      color: colors.text,
      fontWeight: 'bold',
      fontSize: '12px',
      boxShadow: BOX_SHADOW,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      minWidth: '40px',
      textAlign: 'center',
      border: `${BORDER_WIDTH} solid ${colors.border}`,
      zIndex: (isHovered ? markerStyles.Z_INDEX.HOVER : marker.listing.isLiked ? markerStyles.Z_INDEX.LIKED : markerStyles.Z_INDEX.DEFAULT),
      overflow: 'visible'
    };

    const mapMarker = new maplibregl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([marker.lng, marker.lat])
      .addTo(mapRef.current);

    // Apply styles after DOM insertion
    applyMarkerStylesUtility(el, markerElementStyles);

    // Verify styles after DOM insertion
    setTimeout(() => verifyAndFixMarkerStyles(el), STYLE_UPDATE_DELAY);

    el.addEventListener('click', clickHandler);
    return mapMarker;
  }, [mapRef, markerStyles, getMarkerColors, createPriceBubbleContent, verifyAndFixMarkerStyles]);

  return {
    createSimpleMarker,
    createPriceBubbleMarker,
    getMarkerColors,
    createPriceBubbleContent
  };
};