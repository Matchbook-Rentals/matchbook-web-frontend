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
import { Montserrat } from 'next/font/google';
import { BrandHeartOutline, ManageSearchIcon, MapViewIcon, MatchesIcon, RecommendedIcon } from '@/components/icons';
import MobileTabSelector from '@/components/ui/mobile-tab-selector';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useWindowSize } from '@/hooks/useWindowSize';

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

interface Tab {
  value: string;
  label: string;
  Icon?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
  iconClassName?: string;
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

  const tabTriggerTextStyles = 'text-[9px] font-medium sm:text-[15px] md:text-[16px]  sm:font-normal'
  const tabTriggerStyles = 'pt-1 sm:p-0 '
  const tabs: Tab[] = [
    {
      label: 'Manage Search',
      value: 'overview',
      content: state.trip ? <OverviewTab /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <ManageSearchIcon className="h-[35px] scale-110 -translate-y-[5px] " />,
      iconClassName: ""
    },
    {
      label: 'Recommended',
      value: 'recommended',
      content: state.trip ? <MatchViewTab setIsFilterOpen={setIsFilterOpen} /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <RecommendedIcon className="h-[35px]" />,
      iconClassName: ""
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <MapView setIsFilterOpen={setIsFilterOpen} />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <MapViewIcon className="h-[35px] -translate-y-[6px]" />,
      iconClassName: ""
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <SearchFavoritesTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <BrandHeartOutline className="h-[35px]" stroke='black' />,
      iconClassName: ""
    },
    {
      label: 'Matches',
      value: 'matchbook',
      content: <SearchMatchbookTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <MatchesIcon className="h-[35px] -translate-y-[4px]" />,
      iconClassName: ""
    },
  ];

  const marginClass = PAGE_MARGIN;

  const breadcrumbLinks = [
    {
      label: 'Searches',
      url: '/platform/trips'
    },
    {
      label: state.trip?.locationString || 'Location',
      url: undefined // or remove the url property entirely
    }
  ];

  const { width } = useWindowSize();
  const isMobile = width ? width < 640 : false; // 640px is the 'sm' breakpoint in Tailwind

  return (
    <div className={`flex flex-col ${marginClass}  mx-auto `}>
      <div className='flex justify-between items-center sm:justify-start'>
        <Breadcrumbs links={breadcrumbLinks} />
        {isMobile && (
          <div className='flex gap-x-4 items-center'>

            {['recommended', 'allListings'].includes(currentTab) && (
              <FilterOptionsDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                filters={filters}
                onFilterChange={handleFilterChange}
                className=''
              />
            )}
          </div>
        )}
      </div>

      {!isMobile ? (
        <TabSelector
          useUrlParams
          tabs={tabs}
          defaultTab={currentTab || 'recommended'}
          className='mx-auto w-full pb-0 mb-0 border-none'
          tabsClassName='w-full mx-auto  '
          tabsListClassName='flex py-0 justify-start w-full space-x-4  md:gap-x-4 '
          secondaryButton={
            ['recommended', 'allListings'].includes(currentTab) ? (
              <FilterOptionsDialog
                isOpen={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                filters={filters}
                onFilterChange={handleFilterChange}
                className=''
              />
            ) : undefined
          }
        />
      ) : (
        <MobileTabSelector
          useUrlParams
          tabs={tabs}
          defaultTab={currentTab || 'recommended'}
          className='mx-auto w-full'
          tabsClassName='w-full mx-auto pb-28'
        />
      )}
    </div>
  );
};

export default TripsPage;
