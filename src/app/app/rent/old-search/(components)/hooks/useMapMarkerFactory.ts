import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// SVG Constants
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const HEART_PATH_SIMPLE = 'M0 -2.5C-1.5 -4.5 -4.5 -3.5 -4.5 -1.5C-4.5 0.5 0 4.5 0 4.5C0 4.5 4.5 0.5 4.5 -1.5C4.5 -3.5 1.5 -4.5 0 -2.5';
const HEART_PATH_REGULAR = 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314';
const HEART_SCALE_SIMPLE = 'scale(0.5)';
const HEART_FILTER = 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))';

// Style Constants
const BORDER_WIDTH = '0.5px';
const BOX_SHADOW = '0 2px 4px rgba(0,0,0,0.3)';
const SIMPLE_MARKER_SCALE = 0.7;
const STYLE_UPDATE_DELAY = 50;
const CRITICAL_STYLES = ['backgroundColor', 'color', 'border', 'padding', 'borderRadius', 'display'];

// Price Bubble Constants
const PRICE_BUBBLE_PADDING = '6px 10px';
const PRICE_BUBBLE_BORDER_RADIUS = '16px';
const PRICE_BUBBLE_FONT_SIZE = '12px';
const PRICE_BUBBLE_MIN_WIDTH = '40px';

// ============================================
// SVG Creation Utilities
// ============================================

const createSVGElement = (tag: string, attributes: Record<string, string> = {}): SVGElement => {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  setElementAttributes(element, attributes);
  return element;
};

const setElementAttributes = (element: Element, attributes: Record<string, string>) => {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const createHeartPath = (pathData: string, heartColor: string, attributes: Record<string, string> = {}): SVGPathElement => {
  const path = createSVGElement('path', {
    d: pathData,
    fill: heartColor,
    ...attributes
  }) as SVGPathElement;
  applyHeartFilter(path);
  return path;
};

const applyHeartFilter = (path: SVGPathElement) => {
  path.style.filter = HEART_FILTER;
};

// ============================================
// Heart Icon Creation
// ============================================

const createBackgroundCircle = (markerStyles: any) => {
  const { backgroundCircle } = markerStyles.HEART_ICON;
  return createSVGElement('circle', {
    cx: '0',
    cy: '0',
    r: backgroundCircle.radius,
    fill: backgroundCircle.fill,
    stroke: backgroundCircle.stroke,
    'stroke-width': backgroundCircle.strokeWidth
  });
};

const createSimpleHeartWithBackground = (markerStyles: any, heartGroup: SVGGElement) => {
  const bgCircle = createBackgroundCircle(markerStyles);
  const heartPath = createHeartPath(HEART_PATH_SIMPLE, markerStyles.HEART_ICON.color);
  heartPath.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerScale);
  
  heartGroup.appendChild(bgCircle);
  heartGroup.appendChild(heartPath);
};

const createSimpleHeartWithoutBackground = (markerStyles: any, heartGroup: SVGGElement) => {
  const heartPath = createHeartPath(HEART_PATH_REGULAR, markerStyles.HEART_ICON.color, {
    transform: `${markerStyles.HEART_ICON.simpleMarkerTransform} ${HEART_SCALE_SIMPLE}`
  });
  heartGroup.appendChild(heartPath);
};

const createRegularHeart = (markerStyles: any, heartGroup: SVGGElement) => {
  const heartPath = createHeartPath(HEART_PATH_REGULAR, markerStyles.HEART_ICON.color);
  heartGroup.appendChild(heartPath);
};

const createHeartGroup = (markerStyles: any, isSimpleMarker = false): SVGGElement => {
  const heartGroup = createSVGElement('g') as SVGGElement;
  
  if (isSimpleMarker) {
    if (shouldHaveBackgroundCircle(markerStyles)) {
      createSimpleHeartWithBackground(markerStyles, heartGroup);
    } else {
      createSimpleHeartWithoutBackground(markerStyles, heartGroup);
    }
  } else {
    createRegularHeart(markerStyles, heartGroup);
  }
  
  return heartGroup;
};

const shouldHaveBackgroundCircle = (markerStyles: any) => {
  return markerStyles.HEART_ICON.withBackground;
};

// ============================================
// Style Application Utilities
// ============================================

const storeStylesAsDataAttributes = (element: HTMLElement, styles: Record<string, string>) => {
  Object.entries(styles).forEach(([key, value]) => {
    const dataKey = `style${capitalizeFirstLetter(key)}`;
    element.dataset[dataKey] = value;
  });
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const applyCriticalStyles = (element: HTMLElement, styles: Record<string, string>) => {
  Object.entries(styles).forEach(([key, value]) => {
    if (isCriticalStyle(key)) {
      setElementStyle(element, key, value);
    }
  });
};

const isCriticalStyle = (styleName: string) => {
  return CRITICAL_STYLES.includes(styleName);
};

const setElementStyle = (element: HTMLElement, key: string, value: string) => {
  (element.style as any)[key] = value;
};

const scheduleNonCriticalStyles = (element: HTMLElement, styles: Record<string, string>) => {
  requestAnimationFrame(() => {
    applyNonCriticalStyles(element, styles);
  });
};

const applyNonCriticalStyles = (element: HTMLElement, styles: Record<string, string>) => {
  Object.entries(styles).forEach(([key, value]) => {
    if (!isCriticalStyle(key)) {
      setElementStyle(element, key, value);
    }
  });
};

const applyMarkerStylesUtility = (element: HTMLElement, styles: Record<string, string>) => {
  storeStylesAsDataAttributes(element, styles);
  applyCriticalStyles(element, styles);
  scheduleNonCriticalStyles(element, styles);
};

// ============================================
// Main Hook
// ============================================

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

  // ============================================
  // Price Formatting
  // ============================================
  
  const formatPrice = useCallback((price: number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price.toLocaleString()}`;
  }, []);

  const extractPrice = useCallback((marker: any): number | null => {
    return marker.listing.calculatedPrice || marker.listing.price || null;
  }, []);

  // ============================================
  // Heart Icon HTML Creation
  // ============================================
  
  const createHeartSvgHtml = useCallback((markerStyles: any): string => {
    const { HEART_ICON } = markerStyles;
    return `
      <svg style="
        position: absolute;
        top: ${HEART_ICON.priceBubblePosition.top};
        right: ${HEART_ICON.priceBubblePosition.right};
        width: ${HEART_ICON.size};
        height: ${HEART_ICON.size};
        fill: ${HEART_ICON.color};
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
      " viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="${HEART_PATH_REGULAR}" />
      </svg>
    `;
  }, []);
  
  const wrapPriceWithHeart = useCallback((formattedPrice: string, markerStyles: any): string => {
    return `
      <span style="position: relative;">
        ${formattedPrice}
        ${createHeartSvgHtml(markerStyles)}
      </span>
    `;
  }, [createHeartSvgHtml]);
  
  const createPriceBubbleContent = useCallback((marker: any, formattedPrice: string): string => {
    if (isMarkerLiked(marker)) {
      return wrapPriceWithHeart(formattedPrice, markerStyles);
    }
    return formattedPrice;
  }, [markerStyles, wrapPriceWithHeart]);

  const isMarkerLiked = (marker: any): boolean => {
    return marker.listing.isLiked === true;
  };

  // ============================================
  // Color Selection
  // ============================================
  
  const getMarkerColors = useCallback((marker: any, isHovered: boolean) => {
    if (isHovered) {
      return markerStyles.PRICE_BUBBLE_COLORS.HOVER;
    }
    if (isMarkerDisliked(marker)) {
      return markerStyles.PRICE_BUBBLE_COLORS.DISLIKED;
    }
    return markerStyles.PRICE_BUBBLE_COLORS.DEFAULT;
  }, [markerStyles]);

  const isMarkerDisliked = (marker: any): boolean => {
    return marker.listing.isDisliked === true;
  };

  // ============================================
  // Simple Marker Creation
  // ============================================
  
  const createMapLibreMarker = useCallback((options: any) => {
    if (!mapRef.current) return null;
    return new maplibregl.Marker(options)
      .setLngLat([options.lng || 0, options.lat || 0])
      .addTo(mapRef.current);
  }, [mapRef]);
  
  const getSimpleMarkerColor = useCallback((marker: any, isHovered: boolean) => {
    return isHovered 
      ? markerStyles.MARKER_COLORS.HOVER.primary 
      : markerStyles.MARKER_COLORS.DEFAULT.primary;
  }, [markerStyles]);
  
  const configureSimpleMarkerElement = useCallback((element: HTMLElement, marker: any, isHovered: boolean) => {
    element.style.cursor = 'pointer';
    element.style.overflow = 'visible';
    applyZIndexToElement(element, marker, isHovered);
  }, [markerStyles]);
  
  const applyZIndexToElement = (element: HTMLElement, marker: any, isHovered: boolean) => {
    if (isHovered) {
      element.style.zIndex = markerStyles.Z_INDEX.HOVER;
    } else if (isMarkerLiked(marker)) {
      element.style.zIndex = markerStyles.Z_INDEX.LIKED;
    } else {
      element.style.zIndex = markerStyles.Z_INDEX.DEFAULT;
    }
  };
  
  const customizeInnerCircle = useCallback((element: HTMLElement, isHovered: boolean) => {
    const innerCircle = element.querySelector('svg circle:last-child');
    if (!innerCircle) return;
    
    const fillColor = isHovered 
      ? markerStyles.MARKER_COLORS.HOVER.secondary 
      : markerStyles.MARKER_COLORS.DEFAULT.secondary;
    innerCircle.setAttribute('fill', fillColor);
  }, [markerStyles]);
  
  const addHeartToSimpleMarker = useCallback((element: HTMLElement, marker: any) => {
    if (!isMarkerLiked(marker)) return;
    
    const svg = element.querySelector('svg');
    if (!svg) return;
    
    svg.style.overflow = 'visible';
    const heartGroup = createHeartGroup(markerStyles, true);
    heartGroup.setAttribute('transform', markerStyles.HEART_ICON.simpleMarkerTransform);
    heartGroup.setAttribute('class', 'marker-heart-icon');
    svg.appendChild(heartGroup);
  }, [markerStyles]);
  
  const attachClickHandler = (element: HTMLElement, clickHandler: (e: Event) => void) => {
    element.addEventListener('click', clickHandler);
  };
  
  const createSimpleMarker = useCallback((marker: any, isHovered: boolean, clickHandler: (e: Event) => void): maplibregl.Marker | null => {
    const mapMarker = createMapLibreMarker({
      color: getSimpleMarkerColor(marker, isHovered),
      scale: SIMPLE_MARKER_SCALE,
      lng: marker.lng,
      lat: marker.lat
    });
    
    if (!mapMarker) return null;
    
    const element = mapMarker.getElement();
    configureSimpleMarkerElement(element, marker, isHovered);
    customizeInnerCircle(element, isHovered);
    addHeartToSimpleMarker(element, marker);
    attachClickHandler(element, clickHandler);
    
    return mapMarker;
  }, [mapRef, markerStyles, createMapLibreMarker, getSimpleMarkerColor, configureSimpleMarkerElement, customizeInnerCircle, addHeartToSimpleMarker]);

  // ============================================
  // Price Bubble Marker Creation
  // ============================================
  
  const createPriceBubbleElement = () => {
    const element = document.createElement('div');
    element.className = 'price-bubble-marker';
    return element;
  };
  
  const markElementAsCreating = (element: HTMLElement) => {
    element.dataset.creating = 'true';
  };
  
  const markElementAsCreated = (element: HTMLElement) => {
    delete element.dataset.creating;
  };
  
  const buildPriceBubbleStyles = useCallback((colors: any, isHovered: boolean, isLiked: boolean) => {
    return {
      padding: PRICE_BUBBLE_PADDING,
      borderRadius: PRICE_BUBBLE_BORDER_RADIUS,
      backgroundColor: colors.background,
      color: colors.text,
      fontWeight: 'bold',
      fontSize: PRICE_BUBBLE_FONT_SIZE,
      boxShadow: BOX_SHADOW,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      minWidth: PRICE_BUBBLE_MIN_WIDTH,
      textAlign: 'center',
      border: `${BORDER_WIDTH} solid ${colors.border}`,
      zIndex: calculateZIndex(isHovered, isLiked),
      overflow: 'visible'
    };
  }, [markerStyles]);
  
  const calculateZIndex = (isHovered: boolean, isLiked: boolean) => {
    if (isHovered) return markerStyles.Z_INDEX.HOVER;
    if (isLiked) return markerStyles.Z_INDEX.LIKED;
    return markerStyles.Z_INDEX.DEFAULT;
  };
  
  const addMarkerToMap = useCallback((element: HTMLElement, marker: any) => {
    if (!mapRef.current) return null;
    
    return new maplibregl.Marker({
      element: element,
      anchor: 'center'
    })
      .setLngLat([marker.lng, marker.lat])
      .addTo(mapRef.current);
  }, [mapRef]);
  
  const scheduleStyleVerification = useCallback((element: HTMLElement) => {
    requestAnimationFrame(() => {
      markElementAsCreated(element);
      verifyAndFixMarkerStyles(element);
      scheduleSecondaryVerification(element);
    });
  }, [verifyAndFixMarkerStyles]);
  
  const scheduleSecondaryVerification = useCallback((element: HTMLElement) => {
    setTimeout(() => verifyAndFixMarkerStyles(element), STYLE_UPDATE_DELAY);
  }, [verifyAndFixMarkerStyles]);
  
  const createPriceBubbleMarker = useCallback((marker: any, isHovered: boolean, clickHandler: (e: Event) => void): maplibregl.Marker | null => {
    if (!mapRef.current) return null;

    const element = createPriceBubbleElement();
    markElementAsCreating(element);

    const colors = getMarkerColors(marker, isHovered);
    const price = extractPrice(marker);
    const formattedPrice = formatPrice(price);
    const content = createPriceBubbleContent(marker, formattedPrice);
    
    element.innerHTML = content;

    const styles = buildPriceBubbleStyles(colors, isHovered, isMarkerLiked(marker));
    applyMarkerStylesUtility(element, styles);

    const mapMarker = addMarkerToMap(element, marker);
    if (!mapMarker) return null;
    
    scheduleStyleVerification(element);
    attachClickHandler(element, clickHandler);
    
    return mapMarker;
  }, [
    mapRef, 
    markerStyles, 
    getMarkerColors, 
    extractPrice,
    formatPrice,
    createPriceBubbleContent, 
    buildPriceBubbleStyles,
    addMarkerToMap,
    scheduleStyleVerification
  ]);

  // ============================================
  // Public API
  // ============================================
  
  return {
    createSimpleMarker,
    createPriceBubbleMarker,
    getMarkerColors,
    createPriceBubbleContent
  };
};