import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { notFound } from 'next/navigation';
import ApplicationsTab from '../(tabs)/host-applications-tab';

interface ApplicationsPageProps {
  params: { listingId: string };
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { listingId } = params;
  
  console.log('ApplicationsPage: Starting data fetch...');
  
  // Fetch data in parallel
  const [listing, housingRequests] = await Promise.all([
    getListingById(listingId),
    getHousingRequestsByListingId(listingId)
  ]);

  if (!listing) return notFound();

  console.log('ApplicationsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- housingRequests count:', housingRequests.length);
  
  return (
    <ApplicationsTab listing={listing} housingRequests={housingRequests} />
  );
}