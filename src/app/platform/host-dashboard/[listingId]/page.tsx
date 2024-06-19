'use client'
import React from 'react';
import ListingHorizontalCard from '@/components/ui/listing-horizontal-card';
import TabSelector from '@/components/ui/tab-selector';
import { useHostProperties } from '../../../../contexts/host-properties-provider';
import { OverviewIcon, ListingIcon, ApplicationsIcon, PaymentsIcon, BookingsIcon, AnalyticsIcon } from '@/components/svgs/svg-components';

const PropertyDetails: React.FC = ({ params }) => {
  const { listings } = useHostProperties();
  const { listingId } = params;

  const listing = listings.find(listing => listing.id === listingId);

  if (!listing) {
    return <div>Property not found</div>;
  }


  const tabs = [
    { value: "overview", label: "Overview", icon: OverviewIcon, content: <div>Overview content goes here.</div> },
    { value: "listing", label: "Listing", icon: ListingIcon, content: <div>Listing content goes here.</div> },
    { value: "applications", label: "Applications", icon: ApplicationsIcon, content: <div>Applications content goes here.</div> },
    { value: "payments", label: "Payments", icon: PaymentsIcon, content: <div>Payments content goes here.</div> },
    { value: "analytics", label: "Analytics", icon: AnalyticsIcon, content: <div>Analytics content goes here.</div> },
    { value: "calendar", label: "Calendar", icon: BookingsIcon, content: <div>Calendar content goes here.</div> },
  ]

  return (
    <div className='px-4'>
      <ListingHorizontalCard imgSrc={listing.listingImages[0].url} title={listing.title} status={listing.status} address={listing.locationString} />
      <TabSelector tabs={tabs} />
      {/* Add more details as needed */}
    </div>
  );
};

export default PropertyDetails;
