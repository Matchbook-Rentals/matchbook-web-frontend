import React from 'react';
import { AmenityCards } from './amenity-cards';
import Tile from '@/components/ui/tile';
import { ApartmentIcon, SingleHomeIcon } from '@/components/svgs/svg-components';
import { CrossIcon } from 'lucide-react';
import { AmenityTiles } from './amenity-tiles';
import SearchMap from '../../searches/(components)/search-map';

interface ComponentProps {
  description: string;
  roomCount?: number;
  bathroomCount?: number;
  amenities?: string[];
  listingPin?: {
    lat: number;
    lng: number;
  };
}

const DescriptionAndAmenities: React.FC<ComponentProps> = ({ description, amenities, listingPin }) => {
  return (
    <div className="flex gap-x-4">
      {/* Left half */}
      <div className="w-1/2 min-h-[600px]">
        <SearchMap markers={[listingPin]} center={listingPin!} zoom={15} />
      </div>

      {/* Right half */}
      <div className="w-1/2 flex flex-col">
        {/* Hosted by, Rating, Badges */}
        <div className="flex justify-between mb-4">
          <p>Hosted by</p>
          <p>Rating</p>
          <p>Badges</p>
        </div>

        {/* Highlights */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">HIGHLIGHTS</h2>
        </div>

        {/* Property Description */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">Property Description</h2>
          <div className="text-gray-700">{description}</div>
          <div className='mt-3 flex w-[60%] justify-between'>
            <Tile icon={<SingleHomeIcon />} label={'Single Family'} />
            <Tile icon={<CrossIcon />} label={`${1} bathrooms`} />
            <Tile icon={<CrossIcon />} label={`${1} bedrooms`} />
          </div>
        </div>

        {/* Other Amenities */}
        <div>
          <h2 className="text-2xl font-bold">OTHER AMENITIES</h2>
        </div>
      </div>
    </div>
  );
};

export { DescriptionAndAmenities }