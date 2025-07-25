"use client";

import React, { useState, useEffect } from "react";
import { OnboardingPopup } from "./onboarding-popup";

interface HostsPageWrapperProps {
  children: React.ReactNode;
}

export const HostsPageWrapper: React.FC<HostsPageWrapperProps> = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkAndShowPopup = () => {
      try {
        const lastDismissed = localStorage.getItem('onboarding-popup-dismissed');
        const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours * 60 minutes * 60 seconds * 1000 milliseconds
        
        if (!lastDismissed || Date.now() - parseInt(lastDismissed) > twoHoursInMs) {
          setShowPopup(true);
        }
      } catch {
        // Safari private browsing or localStorage unavailable - show popup
        setShowPopup(true);
      }
    };

    // Show popup after 1000ms delay to let page load
    const timer = setTimeout(checkAndShowPopup, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinueToSite = () => {
    try {
      localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
    } catch {
      // Safari private browsing - ignore localStorage error
    }
    setShowPopup(false);
  };

  const handleListProperty = () => {
    try {
      localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
    } catch {
      // Safari private browsing - ignore localStorage error
    }
    setShowPopup(false);
    // Since we're already on the hosts page, just scroll to the list property section
    const listPropertySection = document.querySelector('[data-section="list-property"]');
    if (listPropertySection) {
      listPropertySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClosePopup = () => {
    try {
      localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
    } catch {
      // Safari private browsing - ignore localStorage error
    }
    setShowPopup(false);
  };

  return (
    <>
      {children}
      <OnboardingPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        onContinueToSite={handleContinueToSite}
        onListProperty={handleListProperty}
      />
    </>
  );
};