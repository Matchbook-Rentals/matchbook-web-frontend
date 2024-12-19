'use client';
//Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import MatchmakerTab from '../../searches/(tabs)/search-matchmaker-tab';
import ShortListTab from '../../searches/(tabs)/search-short-list-tab';
import MapView from '../../searches/(tabs)/search-map-tab';
import { SearchMatchbookTab } from '../../searches/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';
import { useSearchParams } from 'next/navigation';
import OverviewTab from './(tabs)/overview-tab';
import { Button } from '@/components/ui/button';
import FilterOptionsDialog from '../../searches/(tabs)/filter-options-dialog';
import { FilterOptions } from '@/lib/consts/options';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';

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

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterOptions>({
    ...DEFAULT_FILTER_OPTIONS,
    moveInDate: state.trip?.startDate || new Date(),
    moveOutDate: state.trip?.endDate || new Date(),
    flexibleMoveInStart: state.trip?.startDate || new Date(),
    flexibleMoveInEnd: state.trip?.startDate || new Date(),
    flexibleMoveOutStart: state.trip?.endDate || new Date(),
    flexibleMoveOutEnd: state.trip?.endDate || new Date(),
  });

  // Updated handleFilterChange function to handle all filter changes, including arrays
  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | number | boolean | string[] | Date
  ) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const tabTriggerTextStyles = 'text-[10px] xs:text-[12px] md:text-[16px]'
  const tabTriggerStyles = 'p-0'
  const tabs: Tab[] = [
    {
      label: 'Overview',
      value: 'overview',
      content: state.trip ? <OverviewTab /> : null,
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
      content: <MapView />,
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

  const marginClass = APP_PAGE_MARGIN;

  return (
    <div className={`flex flex-col ${marginClass} mx-auto`}>
      <h1 className=" text-[#404040] font-montserrat text-[16px] leading-normal">
        <span className="cursor-pointer hover:underline  ">
          <a href="/platform/trips">Searches</a>
        </span>
        <span className="mx-2">&gt;</span>
        <span className="cursor-pointer hover:underline">
          {state.trip.locationString}
        </span>
      </h1>
      <div className="flex w-full pb-0">
        <TabSelector
          useUrlParams
          tabs={tabs}
          defaultTab={currentTab || 'overview'}
          className='mx-auto w-full pb-0 mb-0'
          tabsClassName='w-full mx-auto'
          tabsListClassName='flex justify-between space-x-2 md:space-x-2 md:gap-x-4'
          secondaryButton={
            ['matchmaker', 'map'].includes(currentTab) ? (
              <FilterOptionsDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
};

export default TripsPage;
