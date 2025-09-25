'use client';

import { useState, useEffect } from 'react';

interface ResponsivePDFConfig {
  minWidth: number;
  maxWidth: number;
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  mobilePadding: number;
  desktopPadding: number;
}

const defaultConfig: ResponsivePDFConfig = {
  minWidth: 320,
  maxWidth: 800,
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  mobilePadding: 32, // 16px padding on each side
  desktopPadding: 64, // 32px padding on each side
};

export const useResponsivePDFWidth = (config: Partial<ResponsivePDFConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [pdfWidth, setPdfWidth] = useState(finalConfig.maxWidth);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const calculateWidth = () => {
      const windowWidth = window.innerWidth;
      const isMobileDevice = windowWidth <= finalConfig.mobileBreakpoint;
      const isTablet = windowWidth <= finalConfig.tabletBreakpoint && windowWidth > finalConfig.mobileBreakpoint;

      setIsMobile(isMobileDevice);

      let calculatedWidth: number;

      if (isMobileDevice) {
        // On mobile, use most of screen width minus padding
        calculatedWidth = Math.max(
          windowWidth - finalConfig.mobilePadding,
          finalConfig.minWidth
        );
      } else if (isTablet) {
        // On tablet, use a percentage of screen width
        calculatedWidth = Math.min(
          windowWidth * 0.85, // 85% of screen width on tablet
          finalConfig.maxWidth
        );
      } else {
        // On desktop, use standard width with some padding consideration
        calculatedWidth = Math.min(
          windowWidth - finalConfig.desktopPadding,
          finalConfig.maxWidth
        );
      }

      setPdfWidth(Math.round(calculatedWidth));
    };

    // Calculate initial width
    calculateWidth();

    // Add resize listener
    window.addEventListener('resize', calculateWidth);

    // Add orientation change listener for mobile devices
    window.addEventListener('orientationchange', () => {
      // Delay calculation to allow for orientation change to complete
      setTimeout(calculateWidth, 100);
    });

    return () => {
      window.removeEventListener('resize', calculateWidth);
      window.removeEventListener('orientationchange', calculateWidth);
    };
  }, [finalConfig]);

  return {
    pdfWidth,
    isMobile,
    isTablet: window.innerWidth <= finalConfig.tabletBreakpoint && window.innerWidth > finalConfig.mobileBreakpoint,
  };
};