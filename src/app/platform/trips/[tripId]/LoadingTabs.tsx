'use client';
// Imports
import React from 'react';
import TabSelector from '@/components/ui/tab-selector';
import LoadingSkeleton from './LoadingSkeleton'; // Import the LoadingSkeleton component

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
  const tabTriggerTextStyles = 'text-md xxs:text-[16px] sm:text-xl';
  const tabTriggerStyles = 'p-0 xxs:px-1 sm:px-2';
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
    <div className="flex flex-col items-center w-full mx-auto">
      <div className="flex w-full">
        <TabSelector
          tabs={tabs}
          className='mx-auto w-full'
          tabsClassName='w-full md:w-[90vw] lg:w-[95vw] px-2 md:px-0 mx-auto'
          tabsListClassName='flex justify-between xxs:justify-center space-x-0 md:space-x-2 md:gap-x-4 w-full mx-auto'
        />
      </div>
    </div>
  );
};

export default LoadingTabs;