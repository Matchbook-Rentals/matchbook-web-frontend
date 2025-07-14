import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { notFound } from 'next/navigation';
import ApplicationsTab from '../(tabs)/host-applications-tab';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { getListingDisplayName } from '@/utils/listing-helpers';

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
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Applications" 
        subtitle={`Applications for ${getListingDisplayName(listing)}`} 
      />
      <ApplicationsTab listing={listing} housingRequests={housingRequests} />
    </div>
  );
}