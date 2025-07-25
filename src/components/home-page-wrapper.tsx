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
    router.push("/app/host/add-property");
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
