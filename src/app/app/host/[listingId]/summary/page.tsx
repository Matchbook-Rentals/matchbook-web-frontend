import React from 'react';
import { notFound } from 'next/navigation';
import { getListingById } from '@/app/actions/listings';
import SummaryTab from '../(tabs)/summary-tab';
import { HostPageTitle } from '../(components)/host-page-title';
import { ListingActiveSwitch } from '../(components)/listing-active-switch';
import { HOST_PAGE_STYLE } from '@/constants/styles';

interface SummaryPageProps {
  params: { listingId: string };
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { listingId } = params;

  // Fetch the listing data at the page level
  const listing = await getListingById(listingId);

  if (!listing) {
    return notFound();
  }

  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Listing Summary" 
        subtitle={`Summary for ${listing.streetAddress1 || listing.title || 'this listing'}`}
        rightContent={<ListingActiveSwitch listing={listing} />}
      />
      <SummaryTab listing={listing} />
    </div>
  );
}