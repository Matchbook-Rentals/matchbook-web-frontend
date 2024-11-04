import React, { useState } from 'react';
import { MapIcon, FilterIcon } from 'lucide-react';
import MapView from './search-map-tab';
import MatchViewTab from './search-match-tab';
import SearchControlBar from '../(components)/search-control-bar';
import FilterOptionsDialog from './filter-options-dialog';
import { useTripContext } from '@/contexts/trip-context-provider';
import { Separator } from '@radix-ui/react-select';
import { MapViewIcon, MatchViewIcon } from '@/components/svgs/svg-components';

// Updated FilterOptions interface
interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
  moveInDate: Date;
  moveOutDate: Date;
  flexibleMoveIn: boolean;
  flexibleMoveOut: boolean;
  flexibleMoveInStart: Date;
  flexibleMoveInEnd: Date;
  flexibleMoveOutStart: Date;
  flexibleMoveOutEnd: Date;
  propertyTypes: string[];
  utilities: string[];
}

const MatchmakerTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'swipe'>('swipe');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { state } = useTripContext();
  // Updated initial state for filters
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 10000,
    bedrooms: 'Any',
    beds: 'Any',
    baths: 'Any',
    furnished: false,
    unfurnished: false,
    moveInDate: state.trip?.startDate || new Date(),
    moveOutDate: state.trip?.endDate || new Date(),
    flexibleMoveIn: false,
    flexibleMoveOut: false,
    flexibleMoveInStart: state.trip?.startDate || new Date(),
    flexibleMoveInEnd: state.trip?.startDate || new Date(),
    flexibleMoveOutStart: state.trip?.endDate || new Date(),
    flexibleMoveOutEnd: state.trip?.endDate || new Date(),
    propertyTypes: [],
    utilities: [],
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
              className={`p-2 px-4 rounded-l-full w-auto h-12 flex items-center justify-center ${viewMode === 'swipe' ? 'bg-gray-200' : ''}`}
              onClick={() => setViewMode('swipe')}
            >
              <img src='/icon_png/match-view-icon.png' alt='heart' className='w-[20px] h-[20px]' />
            </button>
            <Separator className='h-10' />
            <button
              className={`p-2 px-4 rounded-r-full w-auto h-12 flex items-center justify-center ${viewMode === 'map' ? 'bg-gray-200' : ''}`}
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
