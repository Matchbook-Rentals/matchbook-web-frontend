"use client";

import React from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Calendar, Star, Home, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListingDashboard } from './listing-dashboard-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ListingSidebarProps {
  listingId: string;
}

export default function ListingSidebar({ listingId }: ListingSidebarProps) {
  const pathname = usePathname();
  const { data } = useListingDashboard();

  const hostDashboardItems = [
    {
      href: "/platform/host-dashboard/listings",
      label: "All Listings",
      icon: Home,
    },
    {
      href: "/platform/host-dashboard/applications",
      label: "All Applications",
      icon: FileText,
    },
    {
      href: "/platform/host-dashboard/bookings",
      label: "All Bookings",
      icon: Calendar,
    },
  ];

  const listingSpecificItems = [
    {
      href: `/platform/host-dashboard/${listingId}/applications`,
      label: "Applications",
      icon: FileText,
    },
    {
      href: `/platform/host-dashboard/${listingId}/bookings`,
      label: "Bookings", 
      icon: Calendar,
    },
    {
      href: `/platform/host-dashboard/${listingId}/reviews`,
      label: "Reviews",
      icon: Star,
    },
    {
      href: `/platform/host-dashboard/${listingId}/listing`,
      label: "Listing Details",
      icon: Home,
    },
    {
      href: `/platform/host-dashboard/${listingId}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
  ];

  // Determine which accordion should be open by default
  const isOnListingPage = pathname.includes(`/host-dashboard/${listingId}`);
  const defaultValue = isOnListingPage ? "listing-specific" : "host-dashboard";

  return (
    <div className="w-64 flex-shrink-0">
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

        {/* Listing Specific Section */}
        <AccordionItem value="listing-specific" className="border-b">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-medium text-gray-900 truncate">
              {data.listing.title || 'Current Listing'}
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
      </Accordion>
    </div>
  );
}