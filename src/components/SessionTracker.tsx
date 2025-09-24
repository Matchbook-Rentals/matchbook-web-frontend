'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { handleSessionTracking } from '@/app/actions/session-tracking';

export default function SessionTracker() {
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

    trackSession();
  }, [isLoaded, isSignedIn]);

  // This component doesn't render anything
  return null;
}