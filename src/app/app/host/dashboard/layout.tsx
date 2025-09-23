import React from "react";
import { HostSidebar } from "../components/host-sidebar";
import { HostBreadcrumb } from "../components/host-breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import UserMenu from "@/components/userMenu";
import { currentUser } from "@clerk/nextjs/server";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error('Error fetching current user:', error);
    user = null;
  }

  // Create a serializable user object
  const serializableUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  const hostDashboardItems = [
    {
      title: "Overview",
      url: "/app/host/dashboard/overview",
      icon: "PieChart",
    },
    {
      title: "All Listings",
      url: "/app/host/dashboard/listings",
      icon: "Home",
    },
    {
      title: "All Applications",
      url: "/app/host/dashboard/applications",
      icon: "Users",
    },
    {
      title: "All Bookings",
      url: "/app/host/dashboard/bookings",
      icon: "Calendar",
    },
    {
      title: "All Reviews",
      url: "/app/host/dashboard/reviews",
      icon: "MessageSquare",
    },
    {
      title: "All Payments",
      url: "/app/host/dashboard/payments",
      icon: "CreditCard",
    },
  ];

  const otherItems = [
    // {
    //   title: "Settings",
    //   url: "/app/host/dashboard/settings",
    //   icon: "Settings",
    // },
  ];

  const sidebarGroups = [
    { 
      title: "Host Dashboard",
      items: hostDashboardItems 
    },
    // { 
    //   title: "Other",
    //   items: otherItems 
    // }
  ];


  return (
    <SidebarProvider>
      <HostSidebar groups={sidebarGroups} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center justify-between w-full px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <HostBreadcrumb groups={sidebarGroups} breadcrumbTitle="Host Dashboard" />
            </div>
            {/* hasListings={undefined} because host-side menu shows "Switch to Renting", not affected by listing count */}
            <UserMenu isSignedIn={!!user?.id} user={serializableUser} color="#000" mode="header" hasListings={undefined} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
