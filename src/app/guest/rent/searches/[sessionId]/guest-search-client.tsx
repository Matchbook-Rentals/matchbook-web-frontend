'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchTabSelector } from '@/components/ui/search-tab-selector';
import { GuestTripContextProvider } from '@/contexts/guest-trip-context-provider';
import GuestSearchMatchTab from '../components/guest-search-match-tab';
import GuestSearchMapTab from '../components/guest-search-map-tab';
import GuestFavoritesTab from '../components/guest-favorites-tab';
import GuestSearchMatchbookTab from '../components/guest-search-matchbook-tab';
import GuestSearchNavbar from '@/components/marketing-landing-components/guest-search-navbar';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import { ALlListingsIcon, FavoritesIcon, MatchesIcon, RecommendedIcon } from '@/components/icons';
import { Montserrat, Public_Sans } from 'next/font/google';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ListingAndImages } from '@/types';
import { GuestSession } from '@/utils/guest-session';
import GuestFilterOptionsDialog from '../components/guest-filter-options-dialog';

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

interface GuestSearchClientProps {
  sessionId: string;
  sessionData: GuestSession;
  listings: ListingAndImages[];
  initialTab: string;
}

export default function GuestSearchClient({
  sessionId,
  sessionData,
  listings,
  initialTab
}: GuestSearchClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile(768);

  // Effect to update activeTab when URL search parameter changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab') || 'recommended';
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [activeTab]);

  // Handler for tab changes, update local state and URL
  const handleTabSelect = (tabValue: string) => {
    setActiveTab(tabValue);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('tab', tabValue);
    window.history.pushState({}, '', currentUrl.toString());
  };

  const tabTriggerTextStyles = 'text-[9px] px-0 md:px-4 pb-1 font-medium sm:text-[15px] md:text-[15px] sm:font-normal font-public-sans';
  const tabTriggerStyles = 'pt-1 sm:p-0';

  const marginClass = APP_PAGE_MARGIN;

  // Create tabs
  const tabs: Tab[] = [
    {
      label: 'Recommended',
      value: 'recommended',
      content: <GuestSearchMatchTab setIsFilterOpen={setIsFilterOpen} />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <RecommendedIcon className="mt-1" />,
      iconClassName: ""
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <GuestSearchMapTab setIsFilterOpen={setIsFilterOpen} />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <ALlListingsIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <GuestFavoritesTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <FavoritesIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Matches',
      value: 'matchbook',
      content: <GuestSearchMatchbookTab />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <MatchesIcon className="mt-1" />,
      iconClassName: ""
    },
  ];

  return (
    <GuestTripContextProvider sessionId={sessionId} sessionData={sessionData} listingData={listings}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <GuestSearchNavbar
          userId={null}
          user={null}
          isSignedIn={false}
          buttonText="Sign In"
        />

        {/* Main Content */}
        <div className={`flex flex-col scrollbar-none ${marginClass} mx-auto ${publicSans.variable} pt-0`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between w-full gap-2 md:gap-4">
            <SearchTabSelector
              activeValue={activeTab}
              onValueChange={handleTabSelect}
              className="mx-0"
            />
            <div className="flex items-center gap-2">
              {(activeTab === 'recommended' || activeTab === 'allListings') && (
                <GuestFilterOptionsDialog
                  isOpen={isFilterDialogOpen}
                  onOpenChange={setIsFilterDialogOpen}
                  className='md:self-end w-fit ml-auto text-[clamp(10px,2.5vw,14px)] sm:text-[14px]'
                />
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {tabs.map((tab) => (
              <div key={tab.value} className={activeTab === tab.value ? 'block' : 'hidden'}>
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GuestTripContextProvider>
  );
}