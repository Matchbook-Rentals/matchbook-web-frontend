"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HostApplicationCard } from "./components/host-application-card";
import { useIsMobile } from "@/hooks/useIsMobile";
import { OnboardingModal } from "@/components/onboarding-modal";
import { HostUserData } from "@/app/app/host/components/onboarding-checklist-card";

// Helper function to transform application data for the HostApplicationCard component
const transformApplicationForCard = (app: any, isMobile: boolean) => {
  const listing = app.listing;
  const addressDisplay = isMobile 
    ? (listing?.streetAddress1 || `Property in ${listing?.state || 'Unknown Location'}`)
    : `${listing?.streetAddress1 || ''} ${listing?.city || ''}, ${listing?.state || ''} ${listing?.postalCode || ''}`;

  // Parse occupants string to create occupant objects
  const occupantsParts = app.occupants.split(', ');
  const occupants = [
    { type: "Adult", count: parseInt(occupantsParts[0]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/adult.svg" },
    { type: "Kid", count: parseInt(occupantsParts[1]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/kid.svg" },
    { type: "pet", count: parseInt(occupantsParts[2]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/pet.svg" },
  ];

  return {
    name: app.name,
    status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
    dates: app.period,
    address: addressDisplay,
    description: `${listing?.title || 'this property'}`,
    price: app.price,
    occupants,
    profileImage: app.user?.imageUrl,
  };
};

interface HostApplicationCardsProps {
  applications: any[];
  loadingApplicationId: string | null;
  onViewApplicationDetails: (listingId: string, applicationId: string) => void;
  onMessageGuest?: (appName: string) => void;
  hostUserData: HostUserData | null;
  isAdminDev?: boolean;
}

export default function HostApplicationCards({
  applications,
  loadingApplicationId,
  onViewApplicationDetails,
  onMessageGuest,
  hostUserData,
  isAdminDev = false
}: HostApplicationCardsProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  console.log('📋 HostApplicationCards - Received applications:', applications.length);

  // Check if host onboarding is complete
  const isOnboardingComplete = (userData: HostUserData | null): boolean => {
    if (!userData) return false;

    const hasStripeAccount = !!userData.stripeAccountId;
    const stripeComplete = userData.stripeChargesEnabled && userData.stripeDetailsSubmitted;
    const hostTermsAgreed = !!userData.agreedToHostTerms;
    const identityVerified = !!userData.medallionIdentityVerified;

    return hasStripeAccount && stripeComplete && hostTermsAgreed && identityVerified;
  };

  const onboardingComplete = isOnboardingComplete(hostUserData);

  const handleApplicationDetailsClick = (listingId: string, applicationId: string) => {
    if (!onboardingComplete) {
      setShowOnboardingModal(true);
      return;
    }
    onViewApplicationDetails(listingId, applicationId);
  };

  // Return null if no applications to ensure TabLayout shows empty state
  if (!applications || applications.length === 0) {
    console.log('📋 HostApplicationCards - No applications, returning null');
    return null;
  }

  return (
    <>
      {applications.map((app) => {
        const cardData = transformApplicationForCard(app, isMobile);

        return (
          <div key={app.id} className="mb-8">
            <HostApplicationCard
              {...cardData}
              onApplicationDetails={() => handleApplicationDetailsClick(app.listingId, app.id)}
              onMessageGuest={() => {
                if (onMessageGuest) {
                  onMessageGuest(app.name);
                } else {
                  console.log('Message guest:', app.name);
                }
              }}
              onManageListing={() => router.push(`/app/host/${app.listingId}/summary`)}
              className="border border-solid border-[#6e504933]"
              isLoading={loadingApplicationId === app.id}
            />
          </div>
        );
      })}

      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        hostUserData={hostUserData}
        isAdminDev={isAdminDev}
      />
    </>
  );
}
