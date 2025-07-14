"use client";

import React from "react";
import SummaryTab from '../(tabs)/summary-tab';
import { useListingDashboard } from '../listing-dashboard-context';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { getListingDisplayName } from '@/utils/listing-helpers';

export default function ListingPage() {
  const { data, updateListing } = useListingDashboard();
  
  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Listing" 
        subtitle={`Listing for ${getListingDisplayName(data.listing)}`} 
      />
      <SummaryTab listing={data.listing} onListingUpdate={updateListing} />
    </div>
  );
}