'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobilePDFWrapperProps {
  children: React.ReactNode;
  isMobile: boolean;
  onZoomChange?: (zoomLevel: number) => void;
}

const getMobileZoomPreference = (): number => {
  if (typeof window === 'undefined') return 1.0;
  const saved = localStorage.getItem('mobile-pdf-zoom');
  return saved ? parseFloat(saved) : 1.0;
};

const setMobileZoomPreference = (zoomLevel: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mobile-pdf-zoom', zoomLevel.toString());
};

const clampZoomLevel = (zoom: number): number => {
  return Math.min(Math.max(zoom, 0.5), 3.0);
};


export const MobilePDFWrapper: React.FC<MobilePDFWrapperProps> = ({
  children,
  isMobile,
  onZoomChange
}) => {
  const [zoomLevel, setZoomLevel] = useState(() => {
    // Start with fit-to-width by default on mobile
    return isMobile ? 1.0 : getMobileZoomPreference();
  });
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{
    startDistance: number;
    startZoom: number;
    touches: TouchList;
  } | null>(null);

  // Set initial zoom on mobile mount (removed fit-to-width auto-sizing)
  useEffect(() => {
    // No longer auto-fitting to width - users can manually zoom as needed
  }, [isMobile]);

  // Notify parent of zoom changes
  useEffect(() => {
    onZoomChange?.(zoomLevel);
  }, [zoomLevel, onZoomChange]);

  const updateZoomLevel = (newZoom: number) => {
    const clampedZoom = clampZoomLevel(newZoom);
    setZoomLevel(clampedZoom);
    setMobileZoomPreference(clampedZoom);
  };

  const handleZoomIn = () => {
    updateZoomLevel(zoomLevel + 0.25);
  };

  const handleZoomOut = () => {
    updateZoomLevel(zoomLevel - 0.25);
  };

  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      touchRef.current = {
        startDistance: distance,
        startZoom: zoomLevel,
        touches: e.touches
      };
      setIsPinching(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current && isPinching) {
      e.preventDefault(); // Prevent page zoom

      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / touchRef.current.startDistance;
      const newZoom = touchRef.current.startZoom * scale;

      updateZoomLevel(newZoom);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchRef.current = null;
      setIsPinching(false);
    }
  };

  // If not mobile, just render children without wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full">
      {/* Fixed Zoom Controls Bar at Top */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm mb-2">
        <div className="flex items-center justify-center gap-2 p-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-2 h-8 w-8"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          {/* Zoom Level Indicator */}
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoomLevel * 100)}%
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.0}
            className="p-2 h-8 w-8"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Container with scroll and mobile height constraint */}
      <div
        ref={containerRef}
        className="relative w-full overflow-x-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: isPinching ? 'none' : 'pan-x pan-y'
        }}
      >
        {/* PDF Content with Transform */}
        <div
          ref={contentRef}
          className="pdf-zoom-container-mobile"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: isPinching ? 'none' : 'transform 0.2s ease-out',
            width: zoomLevel > 1 ? `${100 * zoomLevel}%` : '100%',
            minWidth: 'fit-content'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};