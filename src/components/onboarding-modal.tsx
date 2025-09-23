"use client";

import React from "react";
import BrandModal from "./BrandModal";
import { OnboardingChecklistCard, HostUserData } from "@/app/app/host/components/onboarding-checklist-card";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostUserData: HostUserData | null;
  isAdminDev?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  hostUserData,
  isAdminDev = false,
}) => {
  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Header/Subheader */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Onboarding
          </h2>
          <p className="text-gray-600">
            Cannot access application details until you finish onboarding.
          </p>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklistCard
          hostUserData={hostUserData}
          isAdminDev={isAdminDev}
          hideHeader={true}
        />
      </div>
    </BrandModal>
  );
};