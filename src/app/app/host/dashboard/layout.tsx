"use client";

import React from "react";
import { HostSidebar } from "../components/host-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  const hostDashboardItems = [
    {
      title: "Overview",
      url: "/app/host/dashboard",
      icon: "📊",
      isActive: pathname === "/app/host/dashboard",
    },
    {
      title: "Listings",
      url: "/app/host/dashboard/listings",
      icon: "🏠",
      isActive: pathname === "/app/host/dashboard/listings",
    },
    {
      title: "All Applications",
      url: "/app/host/dashboard/applications",
      icon: "👥",
      isActive: pathname === "/app/host/dashboard/applications",
    },
    {
      title: "All Bookings",
      url: "/app/host/dashboard/bookings",
      icon: "📅",
      isActive: pathname === "/app/host/dashboard/bookings",
    },
    {
      title: "All Reviews",
      url: "/app/host/reviews",
      icon: "💬",
      isActive: pathname === "/app/host/reviews",
    },
    {
      title: "Payments",
      url: "/app/host/payments",
      icon: "💳",
      isActive: pathname === "/app/host/payments",
    },
  ];

  const otherItems = [
    {
      title: "Settings",
      url: "/app/host/settings",
      icon: "⚙️",
      isActive: pathname === "/app/host/settings",
    },
  ];

  const sidebarGroups = [
    { items: hostDashboardItems },
    { items: otherItems }
  ];

  // Find current breadcrumb based on pathname
  const getCurrentBreadcrumb = () => {
    const allItems = [...hostDashboardItems, ...otherItems];
    const currentItem = allItems.find(item => item.url === pathname);
    
    if (currentItem) {
      return {
        title: currentItem.title,
        icon: currentItem.icon
      };
    }
    
    // Default to Overview if no match
    return {
      title: "Overview",
      icon: "📊"
    };
  };

  const breadcrumb = getCurrentBreadcrumb();
  
  return (
    <SidebarProvider>
      <HostSidebar groups={sidebarGroups} breadcrumb={breadcrumb} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <span className="text-base">{breadcrumb.icon}</span>
              <span className="font-medium">{breadcrumb.title}</span>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}