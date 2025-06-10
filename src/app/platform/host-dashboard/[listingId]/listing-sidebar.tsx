"use client";

import React from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Calendar, Star, Home, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingSidebarProps {
  listingId: string;
}

export default function ListingSidebar({ listingId }: ListingSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
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
      label: "Listing",
      icon: Home,
    },
    {
      href: `/platform/host-dashboard/${listingId}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="w-64 flex-shrink-0">
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {/* Additional Navigation Links */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            href="/platform/host-dashboard/applications"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            All Applications
          </Link>
          <Link
            href="/platform/host-dashboard/bookings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            All Bookings
          </Link>
          <Link
            href="/platform/host-dashboard/listings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            All Listings
          </Link>
        </div>
      </div>
    </div>
  );
}