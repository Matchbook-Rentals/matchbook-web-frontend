import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';

// Constants
const EARTH_RADIUS_MILES = 3958.8;
const PI_OVER_180 = Math.PI / 180;
const COORDINATE_TOLERANCE = 1;
const COORDINATE_PRECISION = 0.001;
const BATCH_UPDATE_DELAY = 10;

interface UseMapUtilitiesProps {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
}

export const useMapUtilities = ({ mapRef }: UseMapUtilitiesProps) => {
  
  // Calculate pixel distance between two points on the map
  const calculatePixelDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!mapRef.current) return Infinity;
    const point1 = mapRef.current.project([lng1, lat1]);
    const point2 = mapRef.current.project([lng2, lat2]);
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  }, [mapRef]);

  // Calculate real-world distance in miles
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = EARTH_RADIUS_MILES;
    const dLat = (lat2 - lat1) * PI_OVER_180;
    const dLon = (lon2 - lon1) * PI_OVER_180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * PI_OVER_180) * Math.cos(lat2 * PI_OVER_180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Check if coordinates have changed significantly
  const hasCoordinateChanged = useCallback((oldLat: number, oldLng: number, newLat: number, newLng: number): boolean => {
    return Math.abs(oldLat - newLat) > COORDINATE_PRECISION || Math.abs(oldLng - newLng) > COORDINATE_PRECISION;
  }, []);

  // Check if two coordinates are within tolerance
  const areCoordinatesClose = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): boolean => {
    return calculatePixelDistance(lat1, lng1, lat2, lng2) < COORDINATE_TOLERANCE;
  }, [calculatePixelDistance]);

  // Style update scheduler utility
  const createStyleUpdateScheduler = useCallback(() => {
    const styleUpdateTimer = { current: null as NodeJS.Timeout | null };
    const scheduledStyleUpdates = { current: new Map<HTMLElement, Record<string, string>>() };
    
    const scheduleStyleUpdate = (element: HTMLElement, styles: Record<string, string>) => {
      scheduledStyleUpdates.current.set(element, styles);
      
      if (styleUpdateTimer.current) clearTimeout(styleUpdateTimer.current);
      
      styleUpdateTimer.current = setTimeout(() => {
        requestAnimationFrame(() => {
          scheduledStyleUpdates.current.forEach((styles, el) => {
            Object.entries(styles).forEach(([key, value]) => {
              (el.style as any)[key] = value;
            });
          });
          scheduledStyleUpdates.current.clear();
        });
      }, BATCH_UPDATE_DELAY);
    };
    
    return { scheduleStyleUpdate, styleUpdateTimer, scheduledStyleUpdates };
  }, []);

  // Marker style verifier utility
  const createMarkerStyleVerifier = useCallback(() => {
    const verifyAndFixMarkerStyles = (element: HTMLElement): boolean => {
      // Skip verification if element is being created
      if (element.dataset.creating === 'true') {
        return false;
      }
      
      let stylesFixed = false;
      
      // First check if element has lost its class
      if (element.dataset.styleBackgroundColor && !element.className.includes('price-bubble-marker')) {
        element.className = 'price-bubble-marker';
        stylesFixed = true;
      }
      
      // Get expected styles from data attributes
      const criticalStyles = ['backgroundColor', 'color', 'border', 'padding', 'borderRadius', 'display'];
      
      Object.keys(element.dataset)
        .filter(attr => attr.startsWith('style'))
        .forEach(attr => {
          const styleProp = attr.replace('style', '').charAt(0).toLowerCase() + attr.slice(6);
          const expectedValue = element.dataset[attr]!;
          const currentValue = (element.style as any)[styleProp];
          
          // Only fix critical styles immediately, defer others
          const isCritical = criticalStyles.includes(styleProp);
          
          if (currentValue !== expectedValue) {
            if (isCritical || !currentValue) {
              // Fix critical styles or missing styles immediately
              (element.style as any)[styleProp] = expectedValue;
              stylesFixed = true;
            }
          }
        });
      
      // Ensure element is visible if styles were fixed
      if (stylesFixed && element.style.display === 'none') {
        element.style.display = 'flex';
      }
      
      return stylesFixed;
    };
    
    const verifyAllMarkerStyles = (markersRef: React.MutableRefObject<Map<string, maplibregl.Marker>>) => {
      // Use immediate execution for critical style recovery
      markersRef.current.forEach((marker) => {
        const el = marker.getElement();
        if (el.className === 'price-bubble-marker' || el.dataset.styleBackgroundColor) {
          verifyAndFixMarkerStyles(el);
        }
      });
      
      // Schedule a secondary check after next paint
      requestAnimationFrame(() => {
        markersRef.current.forEach((marker) => {
          const el = marker.getElement();
          if (el.className === 'price-bubble-marker') {
            verifyAndFixMarkerStyles(el);
          }
        });
      });
    };
    
    return { verifyAndFixMarkerStyles, verifyAllMarkerStyles };
  }, []);

  return {
    calculatePixelDistance,
    calculateDistance,
    hasCoordinateChanged,
    areCoordinatesClose,
    createStyleUpdateScheduler,
    createMarkerStyleVerifier
  };
};