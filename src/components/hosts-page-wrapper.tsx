"use client";

import React, { useState, useEffect } from "react";
import { OnboardingPopup } from "./onboarding-popup";

interface HostsPageWrapperProps {
  children: React.ReactNode;
}

export const HostsPageWrapper: React.FC<HostsPageWrapperProps> = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after 1000ms delay to let page load
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinueToSite = () => {
    setShowPopup(false);
  };

  const handleListProperty = () => {
    setShowPopup(false);
    // Since we're already on the hosts page, just scroll to the list property section
    const listPropertySection = document.querySelector('[data-section="list-property"]');
    if (listPropertySection) {
      listPropertySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClosePopup = () => {
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