"use client";

import React from "react";
import BookingsTab from '../(tabs)/bookings-tab';
import { useListingDashboard } from '../listing-dashboard-context';

export default function BookingsPage() {
  const { data } = useListingDashboard();
  
  return (
    <BookingsTab bookings={data.bookings} listingId={data.listing.id} />
  );
}