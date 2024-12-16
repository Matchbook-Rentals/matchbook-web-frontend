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
      label: 'Overview',
      value: 'overview',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Matchmaker',
      value: 'matchmaker',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
    {
      label: 'Map',
      value: 'map',
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
    {
      label: 'Application',
      value: 'application',
      content: <LoadingSkeleton />,
      textSize: tabTriggerTextStyles,
      className: tabTriggerStyles,
    },
  ];

  return (
    <div className={`flex flex-col items-center ${APP_PAGE_MARGIN}`}>
      <h1 className=" text-[#404040] font-montserrat text-[16px] mr-auto leading-normal">
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
          className='mx-auto w-full'
          tabsClassName='w-full md:w-[90vw] lg:w-[95vw] px-2 md:px-0 mx-auto'
          tabsListClassName='flex justify-start w-full space-x-0 md:space-x-2 md:gap-x-4'
        />
      </div>
    </div>
  );
};

export default LoadingTabs;
