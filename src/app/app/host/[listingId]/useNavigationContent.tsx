"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Calendar, Star, Home, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListingDashboard } from './listing-dashboard-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface UseNavigationContentProps {
  listingId?: string;
  onNavigate?: () => void; // Callback for when navigation happens (e.g., to close mobile menu)
}

export function useNavigationContent({ listingId, onNavigate }: UseNavigationContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  
  // Safely get listing data with fallback
  let listingData;
  try {
    const context = useListingDashboard();
    listingData = context.data;
  } catch (error) {
    // Fallback if context is not available
    listingData = null;
  }

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingHref(null);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    // Only show loading for cross-section navigation (listing dashboard to host dashboard)
    const isCurrentlyOnListingPage = listingId && pathname.includes(`/host/${listingId}`);
    const isNavigatingToHostDashboard = href.includes('/host/dashboard');
    
    if (isCurrentlyOnListingPage && isNavigatingToHostDashboard) {
      setLoadingHref(href);
      router.push(href);
    } else {
      router.push(href);
    }
    
    // Call the onNavigate callback if provided (for closing mobile menu)
    onNavigate?.();
  };

  const hostDashboardItems = [
    {
      href: "/app/host/dashboard/listings",
      label: "All Listings",
      icon: Home,
    },
    {
      href: "/app/host/dashboard/applications",
      label: "All Applications",
      icon: FileText,
    },
    {
      href: "/app/host/dashboard/bookings",
      label: "All Bookings",
      icon: Calendar,
    },
  ];

  // Function to get current application renter name if on application page
  const getCurrentApplicationGuestName = () => {
    const pathParts = pathname.split('/');
    const isOnApplicationPage = pathParts.includes('applications');
    
    if (isOnApplicationPage && listingData?.housingRequests) {
      const housingRequestId = pathParts[pathParts.length - 1];
      const currentRequest = listingData.housingRequests.find(request => request.id === housingRequestId);
      
      if (currentRequest?.user) {
        const user = currentRequest.user;
        if (user.firstName && user.lastName) {
          return `${user.firstName} ${user.lastName}`;
        }
        return user.email || 'Guest';
      }
    }
    return null;
  };

  const currentGuestName = getCurrentApplicationGuestName();

  const listingSpecificItems = listingId ? [
    {
      href: `/app/host/${listingId}/applications`,
      label: "Applications",
      icon: FileText,
    },
    {
      href: `/app/host/${listingId}/bookings`,
      label: "Bookings", 
      icon: Calendar,
    },
    {
      href: `/app/host/${listingId}/reviews`,
      label: "Reviews",
      icon: Star,
    },
    {
      href: `/app/host/${listingId}/listing`,
      label: "Listing Details",
      icon: Home,
    },
    {
      href: `/app/host/${listingId}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
  ] : [];

  // Determine which accordion should be open by default
  const isOnListingPage = listingId && pathname.includes(`/host/${listingId}`);
  const defaultValue = isOnListingPage ? "listing-specific" : "host-dashboard";

  // Custom NavigationLink component
  const NavigationLink = ({ 
    href, 
    icon: Icon, 
    label, 
    isActive 
  }: { 
    href: string; 
    icon: any; 
    label: string; 
    isActive: boolean;
  }) => {
    const isLoading = loadingHref === href;
    
    return (
      <button
        onClick={() => handleNavigation(href)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
          isActive 
            ? "bg-blue-50 text-blue-700" 
            : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
        )}
        disabled={isLoading}
      >
        <Icon className="h-4 w-4" />
        {label}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
        )}
      </button>
    );
  };

  const NavigationContent = () => (
    <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
      {/* Host Dashboard Section */}
      <AccordionItem value="host-dashboard" className="border-b">
        <AccordionTrigger className="hover:no-underline">
          <span className="text-sm font-medium text-gray-900">Host Dashboard</span>
        </AccordionTrigger>
        <AccordionContent>
          <nav className="space-y-1 pl-2">
            {hostDashboardItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                />
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
                const isActive = pathname === item.href;
                const isApplicationsItem = item.label === "Applications";
                const isOnApplicationDetailsPage = pathname.includes('/applications/');
                
                return (
                  <div key={item.href}>
                    <NavigationLink
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      isActive={isActive && !isOnApplicationDetailsPage || (isApplicationsItem && isOnApplicationDetailsPage && !currentGuestName)}
                    />
                    {/* Show renter name as active item when on application details page */}
                    {isApplicationsItem && currentGuestName && isOnApplicationDetailsPage && (
                      <div className="pl-7 py-1">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-blue-50 text-blue-700">
                          <div className="h-4 w-4" /> {/* Spacer to align with icon */}
                          {currentGuestName}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );

  return {
    NavigationContent,
    listingData
  };
}
