'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { handleSessionTracking } from '@/app/actions/session-tracking';

/**
 * App-wide session tracker that only runs once per authenticated session
 * This component should be included in authenticated layouts
 */
export default function AppSessionTracker() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const trackSession = async () => {
      // Only track session if user is authenticated
      if (isLoaded && isSignedIn) {
        try {
          await handleSessionTracking();
        } catch (error) {
          // Silently handle errors - session tracking is not critical for UX
          console.error('Session tracking error:', error);
        }
      }
    };

    // Track session when component mounts and user is authenticated
    trackSession();
  }, [isLoaded, isSignedIn]);

  // This component doesn't render anything
  return null;
}