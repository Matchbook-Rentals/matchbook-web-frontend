
import React from 'react';
import { AmenityCards } from './amenity-cards';

interface ComponentProps {
  description: string;
  amenities?: string[];
}

const DescriptionAndAmenities: React.FC<ComponentProps> = ({ description, amenities }) => {
  return (
    <div className="flex justify-between">
      <div className="w-1/2">
        <h2 className="text-2xl text-left font-bold mb-4">Property Description</h2>
        <div className="text-gray-700">{description}</div>
      </div>
      <div className="w-1/2">
        <h2 className="text-2xl text-center font-bold mb-4">Amenities</h2>
        <AmenityCards amenities={amenities} />
      </div>
    </div>
  );
};

export { DescriptionAndAmenities }
