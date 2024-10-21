'use client';
//Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import MatchmakerTab from '../../searches/(tabs)/search-matchmaker-tab';
import ShortListTab from '../../searches/(tabs)/search-short-list-tab';
import ApplicationTab from './(tabs)/application-tab';
import { SearchMatchbookTab } from '../../searches/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

const TripsPage: React.FC = () => {
  const { state, actions } = useTripContext();

  const tabSize = 'text-lg sm:text-xl'
  const tabs: Tab[] = [
    {
      label: 'Matchmaker',
      value: 'matchmaker',
      content: state.trip ? <MatchmakerTab /> : null,
      textSize: tabSize
    },
    // {
    //   label: 'Map View',
    //   value: 'map-view',
    //   content: state.trip ? <MapView /> : null,
    //   textSize: tabSize
    // },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <ShortListTab />,
      textSize: tabSize
    },
    {
      label: 'Matchbook',
      value: 'matchbook',
      content: <SearchMatchbookTab />,
      textSize: tabSize
    },
    {
      label: 'Application',
      value: 'application',
      content: <ApplicationTab />,
      textSize: tabSize
    },
  ];

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      <div className="flex w-full ">
        <TabSelector
          useUrlParams
          tabs={tabs}
          className='mx-auto w-full'
          tabsClassName='w-full md:w-[90vw] lg:w-[80vw] px-2 md:px-0 mx-auto'
          tabsListClassName='flex justify-center md:gap-x-4 w-full  mx-auto'
        />
      </div>
    </div>
  );
};

export default TripsPage;
