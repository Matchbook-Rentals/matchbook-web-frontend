"use client";

import React from "react";
import { useHostProperties } from "@/contexts/host-properties-provider";
import TabSelector from "@/components/ui/tab-selector";
import HostDashboardListingsTab from "./host-dashboard-listings-tab";
import HostDashboardBookingsTab from "./host-dashboard-bookings-tab";
import HostDashboardApplicationsTab from "./host-dashboard-applications-tab";
import { PAGE_MARGIN } from "@/constants/styles";

export default function HostDashboard() {
  const { listings } = useHostProperties();
  
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
      content: <HostDashboardBookingsTab />
    },
    {
      value: 'applications',
      label: 'Your Applications',
      content: <HostDashboardApplicationsTab />
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
