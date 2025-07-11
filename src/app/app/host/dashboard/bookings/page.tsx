import React from "react";
import { getHostDashboardData } from "@/app/actions/bookings";
import HostDashboardBookingsTab from "../../host-dashboard-bookings-tab";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";

export default async function HostDashboardBookingsPage() {
  console.log('HostDashboardBookingsPage: Starting data fetch...');
  
  // Fetch bookings and listings (with matches) - mirrors listing page approach
  const dashboardData = await getHostDashboardData();

  console.log('HostDashboardBookingsPage: Data fetched successfully');
  console.log('- bookings count:', dashboardData.bookings.length);
  console.log('- listings count:', dashboardData.listings.length);

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle title="All Bookings" subtitle="View and manage all of your property bookings" />
      <HostDashboardBookingsTab 
        bookings={dashboardData.bookings} 
        listings={dashboardData.listings}
      />
    </div>
  );
}