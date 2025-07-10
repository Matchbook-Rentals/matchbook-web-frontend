import React from "react";
import { HostSidebar } from "../components/host-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const hostDashboardItems = [
  {
    title: "Overview",
    url: "/app/host/dashboard",
    icon: "📊",
  },
  {
    title: "Listings",
    url: "/app/host/dashboard/listings",
    icon: "🏠",
  },
  {
    title: "All Applications",
    url: "/app/host/dashboard/applications",
    icon: "👥",
    isActive: true,
  },
  {
    title: "All Bookings",
    url: "/app/host/dashboard/bookings",
    icon: "📅",
  },
  {
    title: "All Reviews",
    url: "/app/host/reviews",
    icon: "💬",
  },
  {
    title: "Payments",
    url: "/app/host/payments",
    icon: "💳",
  },
];

const otherItems = [
  {
    title: "Settings",
    url: "/app/host/settings",
    icon: "⚙️",
  },
];

const sidebarGroups = [
  { items: hostDashboardItems },
  { items: otherItems }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <HostSidebar groups={sidebarGroups} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}