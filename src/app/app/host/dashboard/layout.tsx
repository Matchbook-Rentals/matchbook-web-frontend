import React from "react";
import { HostSidebar } from "../components/host-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { headers } from "next/headers";
import {
  BarChart3,
  Home,
  Users,
  Calendar,
  MessageSquare,
  CreditCard,
  Settings
} from "lucide-react";
import UserMenu from "@/components/userMenu";
import { auth, currentUser } from "@clerk/nextjs/server";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await currentUser();
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || new URL(headersList.get('referer') || '').pathname;

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
      url: "/app/host/dashboard",
      icon: "BarChart3",
      isActive: pathname === "/app/host/dashboard/overview",
    },
    {
      title: "Listings",
      url: "/app/host/dashboard/listings",
      icon: "Home",
      isActive: pathname === "/app/host/dashboard/listings",
    },
    {
      title: "All Applications",
      url: "/app/host/dashboard/applications",
      icon: "Users",
      isActive: pathname === "/app/host/dashboard/applications",
    },
    {
      title: "All Bookings",
      url: "/app/host/dashboard/bookings",
      icon: "Calendar",
      isActive: pathname === "/app/host/dashboard/bookings",
    },
    {
      title: "All Reviews",
      url: "/app/host/dashboard/reviews",
      icon: "MessageSquare",
      isActive: pathname === "/app/host/dashboard/reviews",
    },
    {
      title: "Payments",
      url: "/app/host/dashboard/payments",
      icon: "CreditCard",
      isActive: pathname === "/app/host/dashboard/payments",
    },
  ];

  const otherItems = [
    {
      title: "Settings",
      url: "/app/host/dashboard/settings",
      icon: "Settings",
      isActive: pathname === "/app/host/dashboard/settings",
    },
  ];

  const sidebarGroups = [
    { 
      title: "Host Dashboard",
      items: hostDashboardItems 
    },
    { 
      title: "Other",
      items: otherItems 
    }
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
      icon: "BarChart3"
    };
  };

  const breadcrumb = getCurrentBreadcrumb();

  const getIconComponent = (iconName: string) => {
    const icons = {
      BarChart3,
      Home,
      Users,
      Calendar,
      MessageSquare,
      CreditCard,
      Settings
    };
    return icons[iconName as keyof typeof icons] || BarChart3;
  };

  const BreadcrumbIcon = getIconComponent(breadcrumb.icon);

  return (
    <SidebarProvider>
      <HostSidebar groups={sidebarGroups} breadcrumb={breadcrumb} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center justify-between w-full px-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                <BreadcrumbIcon className="h-4 w-4" />
                <span className="font-medium">{breadcrumb.title}</span>
              </div>
            </div>
            <UserMenu isSignedIn={!!user?.id} user={serializableUser} color="#000" mode="header" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
