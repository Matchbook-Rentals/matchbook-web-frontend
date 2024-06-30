'use client'
//Imports
import React, { useContext } from 'react';
import TabSelector from '@/components/ui/tab-selector';
import CardWithHeader from '@/components/ui/card-with-header';
import TripCardSmall from '../(trips-components)/trip-card-small';
import { TripContext } from '@/contexts/trip-context-provider';
import { Trip } from '@prisma/client';
import NewPossibilitiesTab from './(tabs)/new-possibilities-tab';

const TripIdPage: React.FC = ({ params }) => {
  const tripContext = useContext(TripContext);
  if (!tripContext) {
    throw new Error('TripContext must be used within a TripContextProvider');
  }

  const { trip, setTrip, headerText, setHeaderText, listings, setListings, getUpdatedTrip } = tripContext;
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

  const tabs = [
    { value: "new-possibilities", label: "New Possibilities", content: <NewPossibilitiesTab trip={trip} listings={listings} setListings={setListings} />},
    { value: "properties-you-love", label: "Properties You Love", content: <CardWithHeader title="Properties You Love" content={<div>Properties You Love content goes here.</div>} /> },
    { value: "matches", label: "Matches", content: <CardWithHeader title="Matches" content={<div>Matches content goes here.</div>} /> },
    { value: "trip-editor", label: "Trip Editor", content: <CardWithHeader title="Trip Editor" content={<div>Trip Editor content goes here.</div>} /> },
    { value: "applications", label: "Applications", content: <CardWithHeader title="Application for Now" content={<div>Application for Now content goes here.</div>} /> },
  ]

  return (
    <div className='px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8 w-[90%] mx-auto'>
      <TripCardSmall trip={trip || placeholderTrip} stateCode={(trip.locationString && trip.locationString.slice(-2)) || 'ut'} />
      <TabSelector tabs={tabs} />
      {/* Add more details as needed */}
    </div>
  );
};

export default TripIdPage;
