import React, { Suspense } from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
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
import { ListingDashboardProvider } from './listing-dashboard-context';

interface ListingLayoutProps {
  children: React.ReactNode;
  params: { listingId: string };
}

async function ListingDataWrapper({ children, listingId }: { children: React.ReactNode; listingId: string }) {
  // Fetch all data in parallel to minimize database round trips
  const [listing, housingRequests, bookings] = await Promise.all([
    getListingById(listingId),
    getHousingRequestsByListingId(listingId),
    getBookingsByListingId(listingId)
  ]);

  if (!listing) return notFound();

  const user = await currentUser();

  // Create a serializable user object
  const serializableUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  const dashboardData = {
    listing,
    housingRequests,
    bookings
  };

  const listingItems = [
    {
      title: "Applications",
      url: `/app/host/${listingId}/applications`,
      icon: "Users",
    },
    {
      title: "Bookings",
      url: `/app/host/${listingId}/bookings`,
      icon: "Calendar",
    },
    {
      title: "Reviews",
      url: `/app/host/${listingId}/reviews`,
      icon: "MessageSquare",
    },
    {
      title: "Listing Details",
      url: `/app/host/${listingId}/payments`,
      icon: "CreditCard",
    },
    {
      title: "Payments",
      url: `/app/host/${listingId}/summary`,
      icon: "Settings",
    },
  ];

  const hostDashboardItems = [
    {
      title: "Host Dashboard",
      url: "/app/host/dashboard",
      icon: "PieChart",
    },
  ];

  const otherItems = [
    {
      title: "Settings",
      url: "/app/host/settings",
      icon: "Settings",
    },
  ];

  const sidebarGroups = [
    { 
      title: "",
      items: hostDashboardItems 
    },
    { 
      title: listing.streetAddress1 || listing.title || 'Listing',
      items: listingItems 
    },
    { 
      title: "Other",
      items: otherItems 
    }
  ];


  return (
    <ListingDashboardProvider data={dashboardData}>
      <SidebarProvider>
        <HostSidebar groups={sidebarGroups} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center justify-between w-full px-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <HostBreadcrumb groups={sidebarGroups} breadcrumbTitle={listing.streetAddress1} />
              </div>
              <UserMenu isSignedIn={!!user?.id} user={serializableUser} color="#000" mode="header" />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ListingDashboardProvider>
  );
}

export default async function ListingLayout({ children, params }: ListingLayoutProps) {
  const { listingId } = params;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex">
        <div className="w-64 bg-gray-100 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-16 bg-gray-200 animate-pulse border-b"></div>
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ListingDataWrapper listingId={listingId}>
        {children}
      </ListingDataWrapper>
    </Suspense>
  );
}
