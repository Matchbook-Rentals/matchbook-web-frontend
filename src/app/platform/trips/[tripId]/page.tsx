'use client';
//Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import MatchViewTab from '../../searches/(tabs)/search-match-tab';
import SearchFavoritesTab from '../../searches/(tabs)/search-favorites-tab';
import MapView from '../../searches/(tabs)/search-map-tab';
import { SearchMatchbookTab } from '../../searches/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';
import { useSearchParams } from 'next/navigation';
import OverviewTab from './(tabs)/overview-tab';
import FilterOptionsDialog from '../../searches/(tabs)/filter-options-dialog';
import { FilterOptions } from '@/lib/consts/options';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import { BrandHeartOutline, MapViewIcon, MatchmakerTabIcon, OverviewTabIcon } from '@/components/icons';
import MobileTabSelector from '@/components/ui/mobile-tab-selector';
import { BookIcon, ShareIcon } from 'lucide-react';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useWindowSize } from '@/hooks/useWindowSize';

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

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

  const tabTriggerTextStyles = 'text-[12px] font-medium sm:text-[16px] sm:font-normal'
  const tabTriggerStyles = 'p-0'
  const tabs: Tab[] = [
    {
      label: 'Overview',
      value: 'overview',
      content: state.trip ? <OverviewTab /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: OverviewTabIcon
    },
    {
      label: 'Matchmaker',
      value: 'matchmaker',
      content: state.trip ? <MatchViewTab setIsFilterOpen={setIsFilterOpen} /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: MatchmakerTabIcon

    },
    {
      label: 'Map',
      value: 'map',
      content: <MapView setIsFilterOpen={setIsFilterOpen} />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: MapViewIcon
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <SearchFavoritesTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: BrandHeartOutline
    },
    {
      label: 'Matchbook',
      value: 'matchbook',
      content: <SearchMatchbookTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: BookIcon
    },
  ];

  const marginClass = PAGE_MARGIN;

  const breadcrumbLinks = [
    {
      label: 'Searches',
      url: '/platform/trips'
    },
    {
      label: state.trip.locationString,
      url: undefined // or remove the url property entirely
    }
  ];

  const { width } = useWindowSize();
  const isMobile = width ? width < 640 : false; // 640px is the 'sm' breakpoint in Tailwind

  return (
    <div className={`flex flex-col ${marginClass} mx-auto ${montserrat.className}`}>
      <div className='flex justify-between items-center sm:justify-start'>
        <Breadcrumbs links={breadcrumbLinks} />
        {isMobile && ['matchmaker', 'map'].includes(currentTab) && (
          <div className='flex gap-x-4 items-center'>
            <button className='flex items-end gap-x-1 hover:bg-gray-100 p-1 rounded-[5px] text-[15px] group'>
              <ShareIcon className='' />
              <p className='hidden xxs:block'>Share</p>
            </button>
            <FilterOptionsDialog
              isOpen={isFilterOpen}
              onOpenChange={setIsFilterOpen}
              filters={filters}
              onFilterChange={handleFilterChange}
              className=''
            />
          </div>
        )}
      </div>

      {!isMobile ? (
        <TabSelector
          useUrlParams
          tabs={tabs}
          defaultTab={currentTab || 'matchmaker'}
          className='mx-auto w-full pb-0 mb-0  '
          tabsClassName='w-full mx-auto '
          tabsListClassName='flex py-0 justify-start w-2/3 md:w-full space-x-2 md:space-x-2 md:gap-x-4'
          secondaryButton={
            ['matchmaker', 'map'].includes(currentTab) ? (
              <div className='flex gap-x-4 items-center'>
                <button className='flex items-end gap-x-1 hover:bg-gray-100 p-1 rounded-[5px] text-[15px] group'>
                  <ShareIcon className='' />
                  <p className='underline '>Share</p>
                </button>
                <FilterOptionsDialog
                  isOpen={isFilterOpen}
                  onOpenChange={setIsFilterOpen}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  className=''
                />
              </div>
            ) : undefined
          }
        />
      ) : (
        <MobileTabSelector
          useUrlParams
          tabs={tabs}
          defaultTab={currentTab || 'matchmaker'}
          className='mx-auto w-full'
          tabsClassName='w-full mx-auto pb-28'
        />
      )}
    </div>
  );
};

export default TripsPage;
