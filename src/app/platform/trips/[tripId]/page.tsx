'use client';
//Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import MatchmakerTab from '../../searches/(tabs)/search-matchmaker-tab';
import ShortListTab from '../../searches/(tabs)/search-short-list-tab';
import ApplicationTab from './(tabs)/application-tab';
import { SearchMatchbookTab } from '../../searches/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const tabTriggerTextStyles = 'text-md xxs:text-[16px] sm:text-xl'
  const tabTriggerStyles = 'p-0 '
  const tabs: Tab[] = [
    {
      label: 'Overview',
      value: 'overview',
      content: state.trip ? (<h1>OVERVIEW </h1>) : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,

    },
    {
      label: 'Matchmaker',
      value: 'matchmaker',
      content: state.trip ? <MatchmakerTab /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,

    },
    {
      label: 'Map',
      value: 'map',
      content: <ApplicationTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
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
  ];

  const marginClass = ['map', 'favorites'].includes(currentTab)
    ? APP_PAGE_MARGIN
    : PAGE_MARGIN;

  return (
    <div className={`flex flex-col ${marginClass} mx-auto`}>
      <h1>
        <h1 className="text-black font-montserrat text-[32px] font-medium leading-normal">
          <span className="cursor-pointer hover:underline">
            <a href="/platform/trips">Searches</a>
          </span>
          <span className="mx-2">&gt;</span>
          <span className="cursor-pointer hover:underline">
            {state.trip.locationString}
          </span>
        </h1>
      </h1>
      <div className="flex w-full">
        <TabSelector
          useUrlParams
          tabs={tabs}
          className='mx-auto w-full'
          tabsClassName='w-full mx-auto'
          tabsListClassName='flex justify-start w-full space-x-0 md:space-x-2 md:gap-x-4'
        />
      </div>
    </div>
  );
};

export default TripsPage;
