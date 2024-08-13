import { Bedroom } from '@prisma/client';
import React from 'react';

interface TitleAndStatsProps {
  title?: string;
  rentPerMonth?: number;
  numBeds?: number;
  numBath?: number;
  sqft?: number;
  deposit?: number;
  distance?: number;
  bedrooms?: Bedroom[];
  searchLocation?: string;
}

const TitleAndStats: React.FC<TitleAndStatsProps> = ({
  title = 'Placeholder Title',
  rentPerMonth = 0,
  numBeds = 0,
  numBath = 0,
  sqft = 0,
  deposit = 0,
  distance = 0,
  bedrooms = [],
  searchLocation = ''
}) => {
  const bedTypeCounts = bedrooms.reduce((acc, bedroom) => {
    acc[bedroom.bedType] = (acc[bedroom.bedType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bedTypeString = Object.entries(bedTypeCounts)
    .map(([type, count]) => {
      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
      return `${count} ${capitalizedType}${count > 1 ? 's' : ''}`;
    })
    .join(' | ');

  return (
    <div className="flex text-center justify-between w-4/5 my-2 py-1 mx-auto border-t border-b border-gray-300">
      <div className="flex flex-col w-1/2">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p onClick={() => console.log(bedrooms)} className="text-xl text-gray-600 mt-2">
          {numBeds} Bedrooms{bedTypeString && ` | ${bedTypeString}`}
        </p>
        <p className="text-xl text-gray-600">
          {numBath} Baths | {sqft.toLocaleString()} Sqft
        </p>
      </div>
      <div className="flex flex-col w-1/2 py-1">
        <p className="text-3xl font-semibold">${rentPerMonth.toLocaleString()} / Month</p>
        <p className="text-xl text-gray-600 mt-2">${deposit.toLocaleString()} /Deposit</p>
        <p className="text-xl text-gray-600">{distance} miles from {searchLocation}</p>
      </div>
    </div>
  );
};

export default TitleAndStats;