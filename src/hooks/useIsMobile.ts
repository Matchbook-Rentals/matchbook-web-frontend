'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current viewport is mobile-sized
 * @param mobileBreakpoint - The width in pixels below which is considered mobile (default: 768)
 * @returns Boolean indicating if viewport is mobile width
 */
export function useIsMobile(mobileBreakpoint = 768) {
  // Initialize to null on server to prevent hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < mobileBreakpoint);
    
    // Handler to call on window resize
    function handleResize() {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);
  
  // Return false as fallback for SSR
  return isMobile === null ? false : isMobile;
}