"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TabSelector from "@/components/ui/tab-selector";
import MobileTabSelector from "@/components/ui/mobile-tab-selector";
import HostDashboardListingsTab from "./host-dashboard-listings-tab";
import HostDashboardBookingsTab from "./host-dashboard-bookings-tab";
import HostDashboardApplicationsTab from "./host-dashboard-applications-tab";
import { PAGE_MARGIN } from "@/constants/styles";
import { ListingAndImages, RequestWithUser } from "@/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Home, FileText, Calendar } from "lucide-react";

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface HostDashboardClientProps {
  listings: ListingAndImages[];
  listingsPagination?: PaginationInfo;
  bookings: any[]; // Using any for now since we need to define the proper type
  housingRequests: RequestWithUser[];
}

export default function HostDashboardClient({ 
  listings, 
  listingsPagination,
  bookings, 
  housingRequests 
}: HostDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  
  // Initialize active tab from URL params or default to 'listings'
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['listings', 'bookings', 'applications'];
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'listings';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Debug logging
  console.log('HostDashboardClient received data:');
  console.log('- listings:', listings?.length || 0);
  console.log('- bookings:', bookings?.length || 0);
  console.log('- housingRequests:', housingRequests?.length || 0);
  console.log('- housingRequests data:', housingRequests);

  // Update active tab when URL params change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['listings', 'bookings', 'applications'];
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('listings');
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    
    // Update URL immediately using native browser API
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
    
    // Then update tab state
    setActiveTab(value);
  };

  // Define tabs with mobile icons
  const tabs = [
    {
      value: 'listings',
      label: isMobile ? 'Listings' : 'Your Listings',
      Icon: isMobile ? <Home className="h-5 w-5" /> : undefined,
      content: <HostDashboardListingsTab listings={listings} paginationInfo={listingsPagination} />
    },
    {
      value: 'bookings',
      label: isMobile ? 'Bookings' : 'Your Bookings',
      Icon: isMobile ? <Calendar className="h-5 w-5" /> : undefined,
      content: <HostDashboardBookingsTab bookings={bookings} />
    },
    {
      value: 'applications',
      label: isMobile ? 'Applications' : 'Your Applications',
      Icon: isMobile ? <FileText className="h-5 w-5" /> : undefined,
      content: <HostDashboardApplicationsTab housingRequests={housingRequests} />
    }
  ];

  if (isMobile) {
    return (
      <MobileTabSelector
        tabs={tabs}
        useUrlParams={false}
        activeTabValue={activeTab}
        onTabChange={handleTabChange}
        className="bg-background"
      />
    );
  }

  return (
    <div className={`bg-background ${PAGE_MARGIN} flex flex-row justify-center w-full`}>
      <div className="bg-background  overflow-hidden w-full max-w-[1920px] relative">
        <div className="max-w-[1373px] mx-auto">
          <TabSelector
            tabs={tabs}
            defaultTab="listings"
            useUrlParams={false}
            activeTabValue={activeTab}
            onTabChange={handleTabChange}
            tabsListClassName="border-0"
            className="border-0"
          />
        </div>
      </div>
    </div>
  );
}
