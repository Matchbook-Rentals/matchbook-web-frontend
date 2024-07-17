'use client'
//Imports
import React, { useContext } from 'react';
import TabSelector from '@/components/ui/tab-selector';
import CardWithHeader from '@/components/ui/card-with-header';
import TripCardSmall from '../(trips-components)/trip-card-small';
import { TripContext } from '@/contexts/trip-context-provider';
import NewPossibilitiesTab from './(tabs)/new-possibilities-tab';
import PropertiesYouLoveTab from './(tabs)/properties-you-love';
import DislikedProperties from './(tabs)/disliked-properties';
import ApplicationTab from './(tabs)/application-tab';

const TripIdPage: React.FC = ({ params }) => {
  const tripContext = useContext(TripContext);
  if (!tripContext) {
    throw new Error('TripContext must be used within a TripContextProvider');
  }

  const { trip } = tripContext;



  let tabTextSize = 'text-lg'
const tabs = [
  {
    value: "new-possibilities",
    label: "New Possibilities",
    content: <NewPossibilitiesTab />,
    textSize: tabTextSize,
  },
  {
    value: "properties-you-love",
    label: "Properties You Love",
    content: <PropertiesYouLoveTab />,
    textSize: tabTextSize,
  },
  {
    value: "matches",
    label: "Matches",
    content: (
      <CardWithHeader
        title="Matches"
        content={<div>Matches content goes here.</div>}
      />
    ),
    textSize: tabTextSize,
  },
  {
    value: "dislikes",
    label: "Dislikes",
    content: <DislikedProperties />,
    textSize: tabTextSize,
  },
  {
    value: "trip-editor",
    label: "Trip Editor",
    content: (
      <CardWithHeader
        title="Trip Editor"
        content={<div>Trip Editor content goes here.</div>}
      />
    ),
    textSize: tabTextSize,
  },
  {
    value: "applications",
    label: "Application",
    content: (
    <ApplicationTab />
    ),
    textSize: tabTextSize,
  },
];

  return (
    <div className='px-1 sm:px-2 md:px-4 lg:px-6 xl:px-6 w-[95%] mx-auto'>
      <TripCardSmall trip={trip} stateCode={(trip?.locationString && trip.locationString.slice(-2)) || 'ut'} />
      <TabSelector tabs={tabs} className='' useUrlParams />
      {/* Add more details as needed */}
    </div>
  );
};

export default TripIdPage;
