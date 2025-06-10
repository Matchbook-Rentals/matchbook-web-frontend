import React, { Suspense } from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import { APP_PAGE_MARGIN } from "@/constants/styles";
import ListingSidebar from './listing-sidebar';
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

  const dashboardData = {
    listing,
    housingRequests,
    bookings
  };

  return (
    <ListingDashboardProvider data={dashboardData}>
      <div className={`${APP_PAGE_MARGIN} min-h-screen pt-6`}>
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <ListingSidebar listingId={listingId} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </ListingDashboardProvider>
  );
}

export default async function ListingLayout({ children, params }: ListingLayoutProps) {
  const { listingId } = params;

  return (
    <Suspense fallback={
      <div className={`${APP_PAGE_MARGIN} min-h-screen pt-6`}>
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
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