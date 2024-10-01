'use client';
//Imports
import React from 'react';
import SearchCarousel from './(components)/search-carousel';
import TabSelector from '@/components/ui/tab-selector';
import { useSearchContext } from '@/contexts/search-context-provider';
import MatchmakerTab from './(tabs)/search-matchmaker-tab';
import ShortListTab from './(tabs)/search-short-list-tab';
import ApplicationTab from '../trips/[tripId]/(tabs)/application-tab';
import { SearchMatchbookTab } from './(tabs)/search-matchbook-tab';
import { addUnavailability, updateListing } from '@/app/actions/listings';

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

  const consoleLogs = async () => {
    //console.log("Show Listings:", state.showListings);
    console.log("Show Listings:", state.listings);
    state.listings
      .filter(listing => listing.unavailablePeriods.length > 0)
      .forEach(listing => console.log(listing.id, 'unavailables', listing.unavailablePeriods))
    console.log('end unavailables')
  }

  const tabSize = 'text-xl'
  const tabs: Tab[] = [
    { label: 'Matchmaker', value: 'matchmaker', content: state.currentSearch ? <MatchmakerTab /> : null, textSize: tabSize },
    // { label: 'Map View', value: 'map-view', content: state.currentSearch ? <MapView /> : null, textSize: tabSize },
    { label: 'Favorites', value: 'favorites', content: <ShortListTab />, textSize: tabSize },
    { label: 'Matchbook', value: 'matchbook', content: <SearchMatchbookTab />, textSize: tabSize },
    { label: 'Application', value: 'application', content: <ApplicationTab />, textSize: tabSize },
  ];
  return (
    <div className="flex flex-col items-center px-1 sm:px-2 md:px-4 lg:px-6 xl:px-6 w-[95%] mx-auto">
      <button onClick={consoleLogs}>Log State</button>
      <SearchCarousel />
      <div className="flex  w-full ">
        <TabSelector useUrlParams buttonLabel='New Search' buttonAction={() => { }} tabs={tabs} className='w-full' tabsListClassName='flex justify-between w-2/3 max-w-[1000px] mx-auto' />
      </div>
    </div>
  );
};

export default SearchesPage;
