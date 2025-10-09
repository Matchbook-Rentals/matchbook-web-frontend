'use client';
//Imports
import React from 'react';
import { SearchTabSelector } from '@/components/ui/search-tab-selector';
import MatchViewTab from '../../old-search/(tabs)/search-match-tab';
import SearchFavoritesTab from '../../old-search/(tabs)/search-favorites-tab';
import MapView from '../../old-search/(tabs)/search-map-tab';
import { SearchMatchbookTab } from '../../old-search/(tabs)/search-matchbook-tab';
import { useTripContext } from '@/contexts/trip-context-provider';
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';
import { useSearchParams } from 'next/navigation';
// Overview tab removed
import FilterOptionsDialog from '../../old-search/(tabs)/filter-options-dialog';
import SearchUndoButton from '../../old-search/(components)/search-undo-button';
import { FilterOptions } from '@/lib/consts/options';
import { DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { Montserrat, Public_Sans } from 'next/font/google';
import { ALlListingsIcon, BrandHeartOutline, FavoritesIcon, ManageSearchIcon, MapViewIcon, MatchesIcon, RecommendedIcon } from '@/components/icons';
import { useState, useEffect, useCallback, useRef } from 'react'; // Import useState and useEffect
import { useIsMobile } from '@/hooks/useIsMobile';

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

  const tabTriggerTextStyles = 'text-[9px] px-0 md:px-4 pb-1 font-medium sm:text-[15px] md:text-[15px] sm:font-normal font-public-sans'
  const tabTriggerStyles = 'pt-1 sm:p-0 '

  const tabContentRef = useRef<HTMLDivElement>(null);
  const [tabContentHeight, setTabContentHeight] = useState<number | null>(null);

  const updateTabContentHeight = useCallback(() => {
    if (typeof window === 'undefined' || !tabContentRef.current) {
      return;
    }

    const rect = tabContentRef.current.getBoundingClientRect();
    const nextHeight = Math.max(window.innerHeight - rect.top, 0);

    setTabContentHeight(prev => {
      if (prev === null || Math.abs(prev - nextHeight) > 1) {
        return nextHeight;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    updateTabContentHeight();
    window.addEventListener('resize', updateTabContentHeight);
    return () => {
      window.removeEventListener('resize', updateTabContentHeight);
    };
  }, [updateTabContentHeight]);

  useEffect(() => {
    updateTabContentHeight();
  }, [activeTab, isFilterOpen, updateTabContentHeight]);

  const resolvedTabHeight =
    tabContentHeight !== null ? `${Math.floor(tabContentHeight)}px` : undefined;

  const tabs: Tab[] = [
    //{
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
      content: <MapView setIsFilterOpen={setIsFilterOpen} contentHeight={tabContentHeight} />,
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

  const marginClass = APP_PAGE_MARGIN;
  const isMobile = useIsMobile(768); // 768px is the 'md' breakpoint

  return (
    <div className={`flex flex-col scrollbar-none ${marginClass} mx-auto ${publicSans.variable}`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between w-full gap-2 md:gap-4">
        <SearchTabSelector
          activeValue={activeTab}
          onValueChange={handleTabSelect}
          className="mx-0"
        />
        <div className="flex items-center gap-2">
          {activeTab === 'recommended' && (
            <SearchUndoButton className="md:hidden pl-4" />
          )}
          {(activeTab === 'recommended' || activeTab === 'allListings') && (
            <FilterOptionsDialog
              isOpen={isFilterOpen}
              onOpenChange={setIsFilterOpen}
              filters={filters}
              onFilterChange={handleFilterChange}
              className='md:self-end w-fit ml-auto text-[clamp(10px,2.5vw,14px)] sm:text-[14px]'
            />
          )}
        </div>
      </div>
      <div
        ref={tabContentRef}
        className="mt-4 w-full flex-1"
        style={
          resolvedTabHeight
            ? { minHeight: resolvedTabHeight, height: resolvedTabHeight, maxHeight: resolvedTabHeight }
            : undefined
        }
      >
        <div className="flex h-full min-h-0 flex-1 flex-col">
          {tabs.find(tab => tab.value === activeTab)?.content}
        </div>
      </div>
    </div>
  );
};

export default TripsPage;
