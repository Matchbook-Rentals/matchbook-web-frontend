import React, { useState } from 'react';
import { MapIcon, FilterIcon } from 'lucide-react';
import MapView from './search-map-tab';
import MatchViewTab from './search-match-tab';
import SearchControlBar from '../(components)/search-control-bar';
import FilterOptionsDialog from './filter-options-dialog';
import { useTripContext } from '@/contexts/trip-context-provider';
import { Separator } from '@radix-ui/react-select';
import { MapViewIcon, MatchViewIcon } from '@/components/svgs/svg-components';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';

const MatchmakerTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'swipe'>('swipe');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { state } = useTripContext();

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

  return (
    <div className="flex flex-col w-full text-[#4f4f4f]">
      <div className="flex flex-col md:flex-row w-full max-w-[900px]
                      mx-auto justify-between items-center mb-4 gap-4">
        {/* View Selector and sub-small filter options */}
        <div className="flex justify-evenly w-full md:w-auto">
          <div className="flex border shadow-lg rounded-full">
            <button
              className={`py-2  rounded-l-full  h-10 w-[78px] flex items-center justify-center ${viewMode === 'swipe' ? 'bg-gray-200' : ''}`}
              onClick={() => setViewMode('swipe')}
            >
              <img src='/icon_png/match-view-icon.png' alt='heart' className='w-[20px] h-[20px]' />
            </button>
            <Separator className='h-10' />
            <button
              className={`py-2  rounded-r-full w-[78px] h-10 flex items-center justify-center ${viewMode === 'map' ? 'bg-gray-200' : ''}`}
              onClick={() => setViewMode('map')}
            >
              <MapViewIcon className='w-[31px]' />
            </button>
          </div>
          <FilterOptionsDialog
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            filters={filters}
            onFilterChange={handleFilterChange}
            className='flex md:hidden ml-2'
          />
        </div>

        {/* Input Fields */}
        <div className="w-full sm:w-auto flex justify-center">
          <SearchControlBar />
        </div>

        {/* Filters for larger screens */}
        <FilterOptionsDialog
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFilterChange={handleFilterChange}
          className='hidden md:flex'
        />
      </div>

      {/* Conditional Rendering of Map or Swipe View */}
      {viewMode === 'map' ? <MapView /> : <MatchViewTab />}
    </div>
  );
};


export default MatchmakerTab;
