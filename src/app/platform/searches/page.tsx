'use client';

import React from 'react';
import SearchCarousel from './(components)/search-carousel';
import TabSelector from '@/components/ui/tab-selector';
import { useSearchContext } from '@/contexts/search-context-provider';
import MatchmakerTab from './(tabs)/search-matchmaker-tab';
import MapView from './(tabs)/search-map-tab';
import ShortListTab from './(tabs)/search-short-list-tab';

interface Tab {
  value: string;
  label: string;
  Icon?: React.ElementType;
  content: React.ReactNode;
  className?: string;
  textSize?: string;
  forceMount?: boolean;
}

const SearchesPage: React.FC = () => {
  const { state, actions } = useSearchContext();

  const consoleLogs = () => {
    console.log("Show Listings:", state.showListings);
    console.log("Favorite IDs:", state.lookup.favIds);
    console.log("Current Search:", state.currentSearch);
    console.log("Liked Listings:", state.likedListings);
  }

  const tabSize = 'text-xl'
  const tabs: Tab[] = [
    { label: 'Matchmaker', value: 'matchmaker', content: state.currentSearch ? <MatchmakerTab /> : null, textSize: tabSize },
    // { label: 'Map View', value: 'map-view', content: state.currentSearch ? <MapView /> : null, textSize: tabSize },
    { label: 'Favorites', value: 'favorites', content: <ShortListTab />, textSize: tabSize },
    { label: 'Matchbook', value: 'matchbook', content: <div>Matches</div>, textSize: tabSize },
    { label: 'Application', value: 'application', content: <div>Application</div>, textSize: tabSize },
  ];
  return (
    <div className="flex flex-col items-center px-1 sm:px-2 md:px-4 lg:px-6 xl:px-6 w-[95%] mx-auto">
      {/* <button onClick={consoleLogs}>Log State</button> */}
      <SearchCarousel />
      <TabSelector useUrlParams tabs={tabs} className='w-full' tabsListClassName='flex justify-between w-2/3 max-w-[1000px] mx-auto' />
    </div>
  );
};

export default SearchesPage;