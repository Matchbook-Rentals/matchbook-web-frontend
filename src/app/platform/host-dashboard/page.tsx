"use client";

import React from "react";
import { useHostProperties } from "@/contexts/host-properties-provider";
import TabSelector from "@/components/ui/tab-selector";
import HostDashboardListingsTab from "./host-dashboard-listings-tab";
import HostDashboardBookingsTab from "./host-dashboard-bookings-tab";
import { PAGE_MARGIN } from "@/constants/styles";

export default function HostDashboard() {
  const { listings } = useHostProperties();
  
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
  };


  // Your Applications tab content (placeholder)
  const yourApplicationsContent = (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center text-gray-500">
        <h3 className="text-lg font-semibold mb-2">Your Applications</h3>
        <p>Your tenant applications will appear here</p>
      </div>
    </div>
  );

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
      content: <HostDashboardBookingsTab />
    },
    {
      value: 'applications',
      label: 'Your Applications',
      content: (
        <div key="applications-content">
          {yourApplicationsContent}
        </div>
      )
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
