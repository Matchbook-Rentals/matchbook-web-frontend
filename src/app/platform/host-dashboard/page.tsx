import React from "react";
import { getHostListings } from "@/app/actions/listings";
import { getHostBookings } from "@/app/actions/bookings";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import HostDashboardClient from "./host-dashboard-client";

export default async function HostDashboard() {
  console.log('HostDashboard: Starting data fetch...');
  
  // Fetch all data server-side
  const [listings, bookings, housingRequests] = await Promise.all([
    getHostListings(),
    getHostBookings(),
    getHostHousingRequests()
  ]);

  console.log('HostDashboard: Data fetched successfully');
  console.log('- listings count:', listings.length);
  console.log('- bookings count:', bookings.length);
  console.log('- housingRequests count:', housingRequests.length);
  console.log('- housingRequests sample:', housingRequests[0]);

  return (
    <HostDashboardClient 
      listings={listings}
      bookings={bookings}
      housingRequests={housingRequests}
    />
  );
}
