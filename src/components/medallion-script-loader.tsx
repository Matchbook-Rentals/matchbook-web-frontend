"use client";

import { useEffect, useState } from 'react';

// Extend the Window interface to include the identify function
declare global {
  interface Window {
    identify?: (
      sdkKey: string,
      userConfig: {
        email: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        dob?: string;
        preferredWorkflowID?: string;
        redirectURL?: string;
      },
      errorHandler?: (error: { message: string }) => void
    ) => void;
  }
}

interface MedallionScriptLoaderProps {
  children: React.ReactNode;
}

export function MedallionScriptLoader({ children }: MedallionScriptLoaderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (window.identify) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script element already exists
    const existingScript = document.querySelector('script[src*="verifyUI/client.js"]');
    if (existingScript) {
      // Script exists but identify function might not be ready yet
      const checkForIdentify = () => {
        if (window.identify) {
          setIsScriptLoaded(true);
        } else {
          setTimeout(checkForIdentify, 100);
        }
      };
      checkForIdentify();
      return;
    }

    // Load the Medallion script
    const script = document.createElement('script');
    script.src = 'https://cdn.authenticating.com/public/verifyUI/client.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Medallion script loaded successfully');
      // Wait a moment for the identify function to be available
      setTimeout(() => {
        if (window.identify) {
          setIsScriptLoaded(true);
          console.log('✅ Medallion identify function is available');
        } else {
          console.error('❌ Medallion identify function not found after script load');
          setLoadError('Medallion identify function not available');
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Medallion script');
      setLoadError('Failed to load Medallion verification script');
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Don't remove script on cleanup to avoid reloading it unnecessarily
    };
  }, []);

  // Provide the script loading state to children
  return (
    <div data-medallion-script-loaded={isScriptLoaded} data-medallion-error={loadError}>
      {children}
    </div>
  );
}

export default MedallionScriptLoader;