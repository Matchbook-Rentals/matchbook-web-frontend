'use client';
// Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import LoadingSkeleton from './LoadingSkeleton'; // Import the LoadingSkeleton component
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';
import MobileTabSelector from '@/components/ui/mobile-tab-selector';
import { useWindowSize } from '@/hooks/useWindowSize';
import {
  ALlListingsIcon,
  BrandHeartOutline,
  FavoritesIcon,
  ManageSearchIcon,
  MatchesIcon,
  RecommendedIcon,
  SettingsIcon
} from '@/components/icons';
import Link from 'next/link';
import { Public_Sans } from 'next/font/google';

const publicSans = Public_Sans({ subsets: ["latin"], variable: '--font-public-sans' });

// Interface for TabSelector component
interface DesktopTab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

// Interface for MobileTabSelector component
interface MobileTab {
  value: string;
  label: string;
  Icon?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
  iconClassName?: string;
}


const LoadingTabs: React.FC = () => {
  const tabTriggerTextStyles = 'text-[9px] font-medium sm:text-[15px] md:text-[16px] sm:font-normal font-public-sans';
  const tabTriggerStyles = 'pt-1 sm:p-0';

  const { width } = useWindowSize();
  const isMobile = width ? width < 640 : false; // 640px is the 'sm' breakpoint in Tailwind

  // Desktop tabs with correct typing for TabSelector
  const desktopTabs: DesktopTab[] = [
    //{
    //  label: 'Manage Search',
    //  value: 'overview',
    //  content: <LoadingSkeleton />,
    //  textSize: tabTriggerTextStyles,
    //  className: tabTriggerStyles,
    //  Icon: SettingsIcon
    //},
    {
      label: 'Recommended',
      value: 'recommended',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: RecommendedIcon
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: ALlListingsIcon
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: FavoritesIcon
    },
    {
      label: 'Matches',
      value: 'matches',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: MatchesIcon
    },
  ];

  // Mobile tabs with correct typing for MobileTabSelector
  const mobileTabs: MobileTab[] = [
    //{
    //  label: 'Manage Search',
    //  value: 'overview',
    //  content: <LoadingSkeleton />,
    //  textSize: tabTriggerTextStyles,
    //  className: tabTriggerStyles,
    //  Icon: <SettingsIcon className='mt-1' />,
    //  iconClassName: ""
    //},
    {
      label: 'Recommended',
      value: 'recommended',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <RecommendedIcon className="mt-1" />,
      iconClassName: ""
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <ALlListingsIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <FavoritesIcon className='mt-1' />,
      iconClassName: ""
    },
    {
      label: 'Matches',
      value: 'matches',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
      Icon: <MatchesIcon className="mt-1" />,
      iconClassName: ""
    },
  ];

  return (
    <div className={`flex flex-col items-center ${PAGE_MARGIN} ${publicSans.variable}`}>

      {/* Desktop TabSelector - Hidden on small screens, visible on md and up */}
      <div className="hidden md:flex w-full">
        <TabSelector
          tabs={desktopTabs}
          defaultTab='recommended'
          className='mx-auto w-full'
          tabsClassName='w-full'
          tabsListClassName='flex justify-start w-full space-x-0 md:space-x-2 md:gap-x-4'
        />
      </div>

      {/* Mobile TabSelector - Visible on small screens, hidden on md and up */}
      <div className="md:hidden w-full">
        <MobileTabSelector
          tabs={mobileTabs}
          defaultTab='recommended'
          className='mx-auto w-full'
          tabsClassName='w-full mx-auto pb-0'
        />
      </div>
    </div>
  );
};

export default LoadingTabs;
