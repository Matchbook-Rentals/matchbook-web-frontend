"use client";

import React from "react";
import TabSelector from "@/components/ui/tab-selector";
import HostDashboardListingsTab from "./host-dashboard-listings-tab";
import HostDashboardBookingsTab from "./host-dashboard-bookings-tab";
import HostDashboardApplicationsTab from "./host-dashboard-applications-tab";
import { PAGE_MARGIN } from "@/constants/styles";
import { ListingAndImages, RequestWithUser } from "@/types";

interface HostDashboardClientProps {
  listings: ListingAndImages[];
  bookings: any[]; // Using any for now since we need to define the proper type
  housingRequests: RequestWithUser[];
}

export default function HostDashboardClient({ 
  listings, 
  bookings, 
  housingRequests 
}: HostDashboardClientProps) {
  // Debug logging
  console.log('HostDashboardClient received data:');
  console.log('- listings:', listings?.length || 0);
  console.log('- bookings:', bookings?.length || 0);
  console.log('- housingRequests:', housingRequests?.length || 0);
  console.log('- housingRequests data:', housingRequests);

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
  };

  // Define tabs
  const tabs = [
    {
      value: 'listings',
      label: 'Your Listings',
      content: <HostDashboardListingsTab listings={listings} />
    },
    {
      value: 'bookings',
      label: 'Your Bookings',
      content: <HostDashboardBookingsTab bookings={bookings} />
    },
    {
      value: 'applications',
      label: 'Your Applications',
      content: <HostDashboardApplicationsTab housingRequests={housingRequests} />
    }
  ];

  return (
    <div className={`bg-background ${PAGE_MARGIN} flex flex-row justify-center w-full`}>
      <div className="bg-background  overflow-hidden w-full max-w-[1920px] relative">
        <div className="max-w-[1373px] mx-auto">
          <TabSelector
            tabs={tabs}
            defaultTab="listings"
            useUrlParams={false}
            onTabChange={handleTabChange}
            tabsListClassName="border-0"
            className="border-0"
          />
        </div>
      </div>
    </div>
  );
}