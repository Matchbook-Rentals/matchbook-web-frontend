import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PAGE_MARGIN } from "@/constants/styles";
import { ListingAndImages, RequestWithUser } from '@/types';
import PropertyDashboardClient from './property-dashboard-client';




interface PropertyDashboardPageProps {
  params: { listingId: string }
}

const PropertyDashboardPage = async ({ params }: PropertyDashboardPageProps) => {
  const { listingId } = params;
  const listing = await getListingById(listingId);
  if (!listing) return notFound();
  
  const housingRequests = await getHousingRequestsByListingId(listingId);
  const bookings = await getBookingsByListingId(listingId);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDashboardClient 
        listing={listing} 
        housingRequests={housingRequests} 
        bookings={bookings} 
      />
    </Suspense>
  );
};

export default PropertyDashboardPage;