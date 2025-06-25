import React from "react";
import { getHostListings } from "@/app/actions/listings";
import { getHostBookings } from "@/app/actions/bookings";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import HostDashboardClient from "./host-dashboard-client";

interface PageProps {
  searchParams: {
    tab?: string;
    page?: string;
  };
}

export default async function HostDashboard({ searchParams }: PageProps) {
  console.log('HostDashboard: Starting data fetch...');
  
  // Get current page from URL params (default to 1)
  const currentPage = parseInt(searchParams.page || '1', 10);
  const itemsPerPage = 100; // Fetch 100 at a time from server
  
  // Fetch all data server-side
  const [listingsData, bookings, housingRequests] = await Promise.all([
    getHostListings(currentPage, itemsPerPage),
    getHostBookings(),
    getHostHousingRequests()
  ]);

  console.log('HostDashboard: Data fetched successfully');
  console.log('- listings count:', listingsData.listings.length, 'of total:', listingsData.totalCount);
  console.log('- bookings count:', bookings.length);
  console.log('- housingRequests count:', housingRequests.length);
  console.log('- housingRequests sample:', housingRequests[0]);

  return (
    <HostDashboardClient 
      listings={listingsData.listings}
      listingsPagination={{
        totalCount: listingsData.totalCount,
        totalPages: listingsData.totalPages,
        currentPage: listingsData.currentPage,
        itemsPerPage
      }}
      bookings={bookings}
      housingRequests={housingRequests}
    />
  );
}
