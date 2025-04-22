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
// Overview tab removed
import FilterOptionsDialog from '../../searches/(tabs)/filter-options-dialog';
import { FilterOptions } from '@/lib/consts/options';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { Montserrat, Public_Sans } from 'next/font/google';
import { ALlListingsIcon, BrandHeartOutline, FavoritesIcon, ManageSearchIcon, MapViewIcon, MatchesIcon, RecommendedIcon } from '@/components/icons';
import MobileTabSelector from '@/components/ui/mobile-tab-selector';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useState, useEffect } from 'react'; // Import useState and useEffect

const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });
const publicSans = Public_Sans({ subsets: ["latin"], variable: '--font-public-sans' });

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
  const { state } = useTripContext();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'recommended';
  const [activeTab, setActiveTab] = useState(initialTab); // State to track active tab

  // Effect to update activeTab when URL search parameter changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'recommended';
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab]); // Depend on searchParams and activeTab

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
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

  // Handler for tab changes, update local state and URL
  const handleTabSelect = (tabValue: string) => {
    setActiveTab(tabValue);
    // Update URL search parameter to reflect the new tab
    // Use window.history.pushState for client-side update without page reload
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('tab', tabValue);
    window.history.pushState({}, '', currentUrl.toString());
  };

  const tabTriggerTextStyles = 'text-[9px] px-4 pb-1 font-medium sm:text-[15px] md:text-[15px] sm:font-normal font-public-sans'
  const tabTriggerStyles = 'pt-1 sm:p-0 '
  const tabs: Tab[] = [
    //{
    //  label: 'Manage Search',
    //  value: 'overview',
    //  content: state.trip ? <OverviewTab /> : null,
    //  textSize: tabTriggerTextStyles,
    //  className: tabTriggerStyles,
    //  Icon: <SettingsIcon className='mt-1' />,
    //  iconClassName: ""
    //},
    {
      label: 'Recommended',
      value: 'recommended',
      content: state.trip ? <MatchViewTab setIsFilterOpen={setIsFilterOpen} /> : null,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <RecommendedIcon className="mt-1" />,
      iconClassName: ""
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <MapView setIsFilterOpen={setIsFilterOpen} />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <ALlListingsIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <SearchFavoritesTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <FavoritesIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Matches',
      value: 'matchbook',
      content: <SearchMatchbookTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <MatchesIcon className="mt-1" />,
      iconClassName: ""
    },
  ];

  const marginClass = PAGE_MARGIN;

  const { width } = useWindowSize();
  const isMobile = width ? width < 640 : false; // 640px is the 'sm' breakpoint in Tailwind

  return (
    <div className={`flex flex-col scrollbar-none ${marginClass} mx-auto ${publicSans.variable}`}>
      {/* Conditionally render based on local activeTab state */}
      <div className='flex justify-end items-center sm:justify-start'>
        {isMobile && (
          <div className='flex gap-x-4 items-center'>
            {['recommended', 'allListings'].includes(activeTab) && (
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
          tabs={tabs}
          activeTabValue={activeTab} // Control the active tab
          onTabChange={handleTabSelect} // Handle tab changes initiated by the component
          useUrlParams={false} // Disable internal URL handling as parent manages it
          className='mx-auto w-full pb-0 mb-0 border-none'
          tabsClassName='w-full mx-auto  '
          tabsListClassName='flex py-0  justify-start w-full space-x-2  md:gap-x-2 '
          secondaryButton={
            // Conditionally render based on local activeTab state
            ['recommended', 'allListings'].includes(activeTab) ? (
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
          tabs={tabs}
          activeTabValue={activeTab} // Control the active tab
          onTabChange={handleTabSelect} // Handle tab changes initiated by the component
          useUrlParams={false} // Disable internal URL handling as parent manages it
          className='mx-auto w-full'
          tabsClassName='w-full mx-auto pb-0'
        />
      )}
    </div>
  );
};

export default TripsPage;
