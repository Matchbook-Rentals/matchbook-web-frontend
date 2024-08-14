import React, { useState } from 'react';
import { MapIcon, FilterIcon } from 'lucide-react';
import MapView from './search-map-tab';
import MatchViewTab from './search-match-tab';
import SearchControlBar from '../(components)/search-control-bar';
import FilterOptionsDialog from './filter-options-dialog';
import { useSearchContext } from '@/contexts/search-context-provider';

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
  const { state } = useSearchContext();
  // Updated initial state for filters
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 10000,
    bedrooms: 'Any',
    beds: 'Any',
    baths: 'Any',
    furnished: false,
    unfurnished: false,
    moveInDate: state.currentSearch?.startDate || new Date(),
    moveOutDate: state.currentSearch?.endDate || new Date(),
    flexibleMoveIn: false,
    flexibleMoveOut: false,
    flexibleMoveInStart: state.currentSearch?.startDate || new Date(),
    flexibleMoveInEnd: state.currentSearch?.startDate || new Date(),
    flexibleMoveOutStart: state.currentSearch?.endDate || new Date(),
    flexibleMoveOutEnd: state.currentSearch?.endDate || new Date(),
    propertyTypes: [],
    utilities: [],
  });

  // Updated handleFilterChange function to handle all filter changes, including arrays
  const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | string[] | Date) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-4">
        {/* View Selector */}
        <div className="flex border shadow-lg rounded-lg">
          <button
            className={`p-2 ${viewMode === 'swipe' ? 'bg-gray-200' : ''}`}
            onClick={() => setViewMode('swipe')}
          >
            <FilterIcon size={24} />
          </button>
          <button
            className={`p-2 ${viewMode === 'map' ? 'bg-gray-200' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon size={24} />
          </button>
        </div>

        {/* Input Fields */}
        <SearchControlBar />

        {/* Filters */}
        <FilterOptionsDialog
          isOpen={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Conditional Rendering of Map or Swipe View */}
      {viewMode === 'map' ? <MapView /> : <MatchViewTab />}
    </div>
  );
};


export default MatchmakerTab;