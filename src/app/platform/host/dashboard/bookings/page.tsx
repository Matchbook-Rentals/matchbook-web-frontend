import React from "react";
import { getHostBookings } from "@/app/actions/bookings";
import HostDashboardBookingsTab from "../../host-dashboard-bookings-tab";

export default async function HostDashboardBookingsPage() {
  console.log('HostDashboardBookingsPage: Starting data fetch...');
  
  // Fetch bookings
  const bookings = await getHostBookings();

  console.log('HostDashboardBookingsPage: Data fetched successfully');
  console.log('- bookings count:', bookings.length);

  return (
    <HostDashboardBookingsTab bookings={bookings} />
  );
}