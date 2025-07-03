import React from "react";
import { getHostDashboardData } from "@/app/actions/bookings";
import HostDashboardBookingsTab from "../../host-dashboard-bookings-tab";

export default async function HostDashboardBookingsPage() {
  console.log('HostDashboardBookingsPage: Starting data fetch...');
  
  // Fetch bookings and listings (with matches) - mirrors listing page approach
  const dashboardData = await getHostDashboardData();

  console.log('HostDashboardBookingsPage: Data fetched successfully');
  console.log('- bookings count:', dashboardData.bookings.length);
  console.log('- listings count:', dashboardData.listings.length);

  return (
    <HostDashboardBookingsTab 
      bookings={dashboardData.bookings} 
      listings={dashboardData.listings}
    />
  );
}