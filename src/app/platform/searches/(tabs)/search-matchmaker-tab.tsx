import React, { useState } from 'react';
import { MapIcon, FilterIcon } from 'lucide-react'; // Assuming these icons exist
import MapView from './search-map-tab';
import MatchViewTab from './search-match-tab';
import SearchControlBar from '../(components)/search-control-bar';

const MatchmakerTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'swipe'>('map');

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-4">
        {/* View Selector */}
        <div className="flex border rounded-lg">
          <button
            className={`p-2 ${viewMode === 'map' ? 'bg-gray-200' : ''}`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon size={24} />
          </button>
          <button
            className={`p-2 ${viewMode === 'swipe' ? 'bg-gray-200' : ''}`}
            onClick={() => setViewMode('swipe')}
          >
            <FilterIcon size={24} />
          </button>
        </div>

        {/* Input Fields */}
        <SearchControlBar />
        {/* <div className="flex">
          {['Input 1', 'Input 2', 'Input 3', 'Input 4'].map((input, index) => (
            <React.Fragment key={input}>
              <input
                type="text"
                placeholder="PLACEHOLDER"
                className="border p-2"
              />
              {index < 3 && <div className="border-r mx-2 h-8"></div>}
            </React.Fragment>
          ))}
        </div> */}

        {/* Filters */}
        <div className="flex items-center border rounded-lg p-2">
          <FilterIcon size={24} className="mr-2" />
          <span>Filters</span>
        </div>
      </div>

      {/* Conditional Rendering of Map or Swipe View */}
      {viewMode === 'map' ? <MapView /> : <MatchViewTab />}
    </div>
  );
};

export default MatchmakerTab;
