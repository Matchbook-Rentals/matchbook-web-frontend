
import React from 'react';
import { AmenityCards } from './amenity-cards';
import Tile from '@/components/ui/tile';
import { ApartmentIcon, SingleHomeIcon } from '@/components/svgs/svg-components';
import { CrossIcon } from 'lucide-react';
import { AmenityTiles } from './amenity-tiles';

interface ComponentProps {
  description: string;
  roomCount?: number;
  bathroomCount?: number;
  amenities?: string[];
}

const DescriptionAndAmenities: React.FC<ComponentProps> = ({ description, amenities }) => {
  return (
    <div className="flex justify-between">
      <div className="w-1/2">
        <h2 className="text-2xl text-left font-bold mb-4">Property Description</h2>
        <div className="text-gray-700">{description}</div>
        <div className='mt-3 flex w-[60%] justify-between '>
          <Tile icon={<SingleHomeIcon />} label={'Single Family'} />

          <Tile icon={<CrossIcon />} label={`${1} bathrooms`} />
          <Tile icon={<CrossIcon />} label={`${1} bedrooms`} />

        </div>
      </div>
      <div className="w-1/2">
        <h2 className="text-2xl text-center font-bold mb-4">Amenities</h2>
        <AmenityTiles amenities={amenities} />
      </div>
    </div>
  );
};

export { DescriptionAndAmenities }
