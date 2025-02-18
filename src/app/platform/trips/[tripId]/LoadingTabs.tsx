'use client';
// Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import LoadingSkeleton from './LoadingSkeleton'; // Import the LoadingSkeleton component
import { APP_PAGE_MARGIN, PAGE_MARGIN } from '@/constants/styles';

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

const LoadingTabs: React.FC = () => {
  const tabTriggerTextStyles = 'text-md xxs:text-[16px]';
  const tabTriggerStyles = 'p-0';
  const tabs: Tab[] = [
    {
      label: 'Manage Search',
      value: 'overview',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Recommended',
      value: 'recommended',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'All Listings',
      value: 'allListings',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Favorites',
      value: 'favorites',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Matchbook',
      value: 'matchbook',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
  ];

  return (
    <div className={`flex flex-col items-center ${PAGE_MARGIN}`}>

      {/* Breadcrumb Navigation */}
      <h1 className=" text-[#404040] font-montserrat-regular text-[14px] mr-auto leading-normal">
        <span className="cursor-pointer hover:underline  ">
          <span>Searches</span>
        </span>
        <span className="mx-2">&gt;</span>
        <span className="cursor-pointer hover:underline">
          ???
        </span>
      </h1>

      <div className="flex w-full">
        <TabSelector
          tabs={tabs}
          defaultTab='recommended'
          className='mx-auto w-full'
          tabsClassName='w-full '
          tabsListClassName='flex justify-start w-full space-x-0 md:space-x-2 md:gap-x-4'
        />
      </div>
    </div>
  );
};

export default LoadingTabs;
