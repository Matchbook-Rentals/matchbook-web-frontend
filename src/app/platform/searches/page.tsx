'use client';

import React from 'react';
import SearchCarousel from './(components)/search-carousel';
import TabSelector from '@/components/ui/tab-selector';

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
}

const SearchesPage: React.FC = () => {
  const tabSize = 'text-xl'
  const tabs: Tab[] = [
    { label: 'Match View', value: 'match-view', content: <div>Match View</div>, textSize: tabSize },
    { label: 'Map View', value: 'map-view', content: <div>Map View</div>, textSize: tabSize },
    { label: 'Short List', value: 'short-list', content: <div>Short List</div>, textSize: tabSize },
    { label: 'Matches', value: 'matches', content: <div>Matches</div>, textSize: tabSize },
    { label: 'Application', value: 'application', content: <div>Application</div>, textSize: tabSize },
  ];
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">Active Searches</h1>
      <SearchCarousel />
      <TabSelector tabs={tabs} className='w-[55%]' tabsListClassName='flex justify-between' />
    </div>
  );
};

export default SearchesPage;