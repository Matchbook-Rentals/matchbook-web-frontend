'use client';
//Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import MatchmakerTab from '../../searches/(tabs)/search-matchmaker-tab';
import ShortListTab from '../../searches/(tabs)/search-short-list-tab';
import ApplicationTab from './(tabs)/application-tab';
import { SearchMatchbookTab } from '../../searches/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { APP_PAGE_MARGIN } from '@/constants/styles';

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

  const tabTriggerTextStyles = 'text-md xxs:text-[16px] sm:text-xl'
  const tabTriggerStyles = 'p-0 xxs:px-1 sm:px-2 '
  const tabs: Tab[] = [
    {
      label: 'Matchmaker',
      value: 'matchmaker',
      content: state.trip ? <MatchmakerTab /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,

    },
    // {
    //   label: 'Map View',
    //   value: 'map-view',
    //   content: state.trip ? <MapView /> : null,
    //   textSize: tabTriggerTextStyles,
    //   className: tabTriggerStyles,
    // },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <ShortListTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Matchbook',
      value: 'matchbook',
      content: <SearchMatchbookTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Application',
      value: 'application',
      content: <ApplicationTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      <div className="flex w-full ">
        <TabSelector
          useUrlParams
          tabs={tabs}
          className='mx-auto w-full'
          tabsClassName='w-full md:w-[90vw] lg:w-[95vw] px-2 md:px-0 mx-auto'
          tabsListClassName='flex justify-between xs:justify-center px-1 space-x-0 md:space-x-2 md:gap-x-4 w-full mx-auto'
        />
      </div>
    </div>
  );
};

export default TripsPage;
