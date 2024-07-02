'use client'
import React from 'react';
import ListingHorizontalCard from '@/components/ui/listing-horizontal-card';
import TabSelector from '@/components/ui/tab-selector';
import CardWithHeader from '@/components/ui/card-with-header';
import { useHostProperties } from '../../../../contexts/host-properties-provider';
import { OverviewIcon, ListingIcon, ApplicationsIcon, PaymentsIcon, BookingsIcon, AnalyticsIcon } from '@/components/svgs/svg-components';
import TripCardSmall from '../(trips-components)/trip-card-small';
import { Trip } from '@prisma/client';

const TripIdClient: React.FC = ({ params }) => {
  //const { listings } = useHostProperties();
  //const { listingId } = params;
  //
  //const listing = listings.find(listing => listing.id === listingId);
  //
  //if (!listing) {
  //  return <div>Property not found</div>;
  //}

  const placeholderTrip: Trip = {
    id: "1",
    cityState: "New York, NY",
    numChildrenPets: "2 children, 1 pet",
    dateRange: "Jan 15 - Mar 20",
    // Add other required fields from the Trip type
  };

  // Updating textSize in tabs to use the variable
  let textSize = 'text-md'
  const tabs = [
    { value: "new-possibilities", label: "New Possibilities", content: <CardWithHeader title="New Possibilities" content={<div>New Possibilities content goes here.</div>} />, textSize: textSize },
    { value: "properties-you-love", label: "Properties You Love", content: <CardWithHeader title="Properties You Love" content={<div>Properties You Love content goes here.</div>} />, textSize: textSize },
    { value: "matches", label: "Matches", content: <CardWithHeader title="Matches" content={<div>Matches content goes here.</div>} />, textSize: textSize },
    { value: "trip-editor", label: "Trip Editor", content: <CardWithHeader title="Trip Editor" content={<div>Trip Editor content goes here.</div>} />, textSize: textSize },
    { value: "application-for-now", label: "Application for Now", content: <CardWithHeader title="Application for Now" content={<div>Application for Now content goes here.</div>} />, textSize: textSize },
    { value: "analytics", label: "Analytics", content: <CardWithHeader title="Analytics" content={<div>Analytics content goes here.</div>} />, textSize: textSize }
  ]

  return (
    <div className='px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8'>
      <TripCardSmall trip={placeholderTrip} stateCode='ut' />
      <TabSelector tabs={tabs} />
      {/* Add more details as needed */}
    </div>
  );
};

export default TripIdClient;
