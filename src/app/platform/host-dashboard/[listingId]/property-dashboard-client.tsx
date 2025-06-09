"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PAGE_MARGIN } from "@/constants/styles";
import TabSelector from "@/components/ui/tab-selector";
import { ListingAndImages, RequestWithUser } from '@/types';
import ApplicationsTab from './(tabs)/host-applications-tab';
import BookingsTab from './(tabs)/bookings-tab';
import SummaryTab from './(tabs)/summary-tab';

const ReviewsContent = (): JSX.Element => {
  return <div className="mt-8">Reviews Content</div>;
};

interface PropertyDashboardClientProps {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  bookings: any[];
}

export default function PropertyDashboardClient({ 
  listing, 
  housingRequests, 
  bookings 
}: PropertyDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize active tab from URL params or default to 'applications'
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['applications', 'bookings', 'reviews', 'listing'];
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'applications';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update active tab when URL params change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['applications', 'bookings', 'reviews', 'listing'];
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('applications');
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

  const tabs = [
    {
      value: "applications",
      label: "Applications",
      content: <ApplicationsTab listing={listing} housingRequests={housingRequests} />,
    },
    {
      value: "bookings",
      label: "Bookings",
      content: <BookingsTab bookings={bookings} listingId={listing.id} />,
    },
    {
      value: "reviews",
      label: "Reviews",
      content: <ReviewsContent />,
    },
    {
      value: "listing",
      label: "Listing",
      content: <SummaryTab listing={listing} />,
    },
  ];

  return (
    <div className={`${PAGE_MARGIN} min-h-screen pt-6`}>
      <div className="w-full">
        <TabSelector
          tabs={tabs}
          defaultTab="applications"
          useUrlParams={false}
          activeTabValue={activeTab}
          onTabChange={handleTabChange}
          tabsListClassName="mb-0"
        />
      </div>
    </div>
  );
}
