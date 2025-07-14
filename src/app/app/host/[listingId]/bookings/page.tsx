import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getAllListingBookings } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import HostDashboardBookingsTab from '../../host-dashboard-bookings-tab';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { getListingDisplayName } from '@/utils/listing-helpers';

interface BookingsPageProps {
  params: { listingId: string };
}

export default async function BookingsPage({ params }: BookingsPageProps) {
  const { listingId } = params;
  
  console.log('BookingsPage: Starting data fetch...');
  
  // Fetch data in parallel
  const [listing, { bookings, readyMatches }] = await Promise.all([
    getListingById(listingId),
    getAllListingBookings(listingId)
  ]);

  if (!listing) return notFound();

  console.log('BookingsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- bookings count:', bookings.length);
  console.log('- ready matches count:', readyMatches.length);
  
  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Bookings" 
        subtitle={`Bookings for ${getListingDisplayName(listing)}`} 
      />
      <HostDashboardBookingsTab bookings={bookings} matches={readyMatches} />
    </div>
  );
}