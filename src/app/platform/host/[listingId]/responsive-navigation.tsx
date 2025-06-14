"use client";

import React from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Calendar, Star, Home, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListingDashboard } from './listing-dashboard-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import dynamic from 'next/dynamic';

// Dynamically import the mobile tab selector to avoid SSR issues
const MobileTabSelector = dynamic(() => import("@/components/ui/mobile-tab-selector"), {
  ssr: false,
  loading: () => <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-background border-t border-gray-200 animate-pulse" />
});

interface ResponsiveNavigationProps {
  listingId?: string;
}

export default function ResponsiveNavigation({ listingId }: ResponsiveNavigationProps) {
  const pathname = usePathname();
  
  // Safely get listing data with fallback
  let listingData;
  try {
    const context = useListingDashboard();
    listingData = context.data;
  } catch (error) {
    // Fallback if context is not available
    listingData = null;
  }

  const hostDashboardItems = [
    {
      href: "/platform/host/dashboard/listings",
      label: "All Listings",
      icon: Home,
    },
    {
      href: "/platform/host/dashboard/applications",
      label: "All Applications",
      icon: FileText,
    },
    {
      href: "/platform/host/dashboard/bookings",
      label: "All Bookings",
      icon: Calendar,
    },
  ];

  const listingSpecificItems = listingId ? [
    {
      href: `/platform/host/${listingId}/applications`,
      label: "Applications",
      icon: FileText,
    },
    {
      href: `/platform/host/${listingId}/bookings`,
      label: "Bookings", 
      icon: Calendar,
    },
    {
      href: `/platform/host/${listingId}/reviews`,
      label: "Reviews",
      icon: Star,
    },
    {
      href: `/platform/host/${listingId}/listing`,
      label: "Listing Details",
      icon: Home,
    },
    {
      href: `/platform/host/${listingId}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
  ] : [];

  // Determine which accordion should be open by default
  const isOnListingPage = listingId && pathname.includes(`/host/${listingId}`);
  const defaultValue = isOnListingPage ? "listing-specific" : "host-dashboard";

  // Create tabs for mobile view - use dashboard items if no listing, listing items if on listing page
  const mobileTabsData = (listingId ? listingSpecificItems : hostDashboardItems).map(item => ({
    value: item.href,
    label: item.label,
    Icon: <item.icon className="h-5 w-5" />,
    content: <div></div>, // Empty content since we're using navigation
  }));

  const currentTab = mobileTabsData.find(tab => tab.value === pathname)?.value || mobileTabsData[0]?.value;

  const handleMobileTabChange = (value: string) => {
    // Navigate to the selected route using Next.js router
    if (typeof window !== 'undefined') {
      window.location.href = value;
    }
  };

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block w-56 flex-shrink-0 sticky top-0 self-start">
        <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
          {/* Host Dashboard Section */}
          <AccordionItem value="host-dashboard" className="border-b">
            <AccordionTrigger className="hover:no-underline">
              <span className="text-sm font-medium text-gray-900">Host Dashboard</span>
            </AccordionTrigger>
            <AccordionContent>
              <nav className="space-y-1 pl-2">
                {hostDashboardItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-blue-50 text-blue-700" 
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </AccordionContent>
          </AccordionItem>

          {/* Listing Specific Section - only show when listingId is provided */}
          {listingId && (
            <AccordionItem value="listing-specific" className="border-b">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {listingData?.listing?.streetAddress1 || listingData?.listing?.title || 'Current Listing'}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <nav className="space-y-1 pl-2">
                  {listingSpecificItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-blue-50 text-blue-700" 
                            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {/* Mobile Tab Navigation - shown only on mobile */}
      <div className="md:hidden">
        <MobileTabSelector
          tabs={mobileTabsData}
          activeTabValue={currentTab}
          onTabChange={handleMobileTabChange}
          tabsListClassName="!overflow-hidden !justify-evenly"
        />
      </div>
    </>
  );
}