"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HostApplicationCard } from "./components/host-application-card";
import { useIsMobile } from "@/hooks/useIsMobile";

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
    description: `for ${listing?.title || 'this property'}`,
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
}

export default function HostApplicationCards({ 
  applications, 
  loadingApplicationId, 
  onViewApplicationDetails,
  onMessageGuest 
}: HostApplicationCardsProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <>
      {applications.map((app) => {
        const cardData = transformApplicationForCard(app, isMobile);
        
        return (
          <div key={app.id} className="mb-8">
            <HostApplicationCard
              {...cardData}
              onApplicationDetails={() => onViewApplicationDetails(app.listingId, app.id)}
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
    </>
  );
}