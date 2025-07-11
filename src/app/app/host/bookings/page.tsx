import React from "react";
import { getAllHostBookings, getHostDashboardData } from "@/app/actions/bookings";
import HostDashboardBookingsTab from "../host-dashboard-bookings-tab";

export default async function HostBookingsPage() {
  console.log('HostBookingsPage: Starting data fetch...');
  
  // Fetch bookings and listings (with matches) - mirrors dashboard approach
  const dashboardData = await getAllHostBookings();

  console.log('HostBookingsPage: Data fetched successfully');
  console.log('- bookings count:', dashboardData.bookings.length);

  return (
    <HostDashboardBookingsTab 
      bookings={dashboardData.bookings} 
      matches={dashboardData.readyMatches}
    />
  );
}
