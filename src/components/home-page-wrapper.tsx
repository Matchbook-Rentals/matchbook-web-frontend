"use client";

import React, { useState, useEffect } from "react";
import { OnboardingPopup } from "./onboarding-popup";
import { useRouter } from "next/navigation";

interface HomePageWrapperProps {
  children: React.ReactNode;
}

export const HomePageWrapper: React.FC<HomePageWrapperProps> = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAndShowPopup = () => {
      const lastDismissed = localStorage.getItem('onboarding-popup-dismissed');
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours * 60 minutes * 60 seconds * 1000 milliseconds
      
      if (!lastDismissed || Date.now() - parseInt(lastDismissed) > twoHoursInMs) {
        setShowPopup(true);
      }
    };

    // Show popup after 1000ms delay to let page load
    const timer = setTimeout(checkAndShowPopup, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinueToSite = () => {
    localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
    setShowPopup(false);
  };

  const handleListProperty = () => {
    localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
    setShowPopup(false);
    router.push("/app/host/add-property");
  };

  const handleClosePopup = () => {
    localStorage.setItem('onboarding-popup-dismissed', Date.now().toString());
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
