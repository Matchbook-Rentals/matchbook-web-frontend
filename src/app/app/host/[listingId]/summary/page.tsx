import React from 'react';
import { notFound } from 'next/navigation';
import { getListingById } from '@/app/actions/listings';
import SummaryTab from '../(tabs)/summary-tab';
import { HostPageTitle } from '../(components)/host-page-title';
import { ListingActiveSwitch } from '../(components)/listing-active-switch';
import { HospitableConnectButton } from '../(components)/hospitable-connect-button';
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

  let titleCasedBreadcrumbText = ((listing.streetAddress1 || listing.title || 'Listing') as string)
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase()) 

  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Listing Summary" 
        subtitle={`Summary for ${titleCasedBreadcrumbText}`}
        rightContent={
          <div className="flex items-center gap-4">
            <HospitableConnectButton listing={listing} />
            <ListingActiveSwitch listing={listing} />
          </div>
        }
      />
      <SummaryTab listing={listing} />
    </div>
  );
}
