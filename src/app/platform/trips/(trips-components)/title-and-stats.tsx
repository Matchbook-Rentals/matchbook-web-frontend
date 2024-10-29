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
  address: string;
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
  address = '',
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
    <div className="flex flex-col md:flex-row md:-translate-y-[50%] lg:-translate-y-[65%] md:space-x-4 text-center justify-between w-full my-2 py-1 mx-auto  border-b border-gray-300">
      <div className="flex flex-col mb-4 md:mb-0  w-full md:w-1/2">
        <div className='flex flex-col  xs:flex-row md:flex-col lg:flex-row gap-2 justify-between'>
          <div className='test'>
            <p className="text-lg text-center xs:text-left md:text-center lg:text-left text-gray-600 mt-2">
              Address
            </p>
            <p className="text-xl text-black font-medium truncate ">
              {address}
            </p>

          </div>
          <div className='test'>
            <p className="text-lg text-gray-600 mt-2">
              Distance
            </p>
            <p className="text-xl font-medium text-black ">
              {distance} Miles
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full md:w-1/2 py-1 test-blue">
        <div className='flex justify-between'>
          <p className="text-xl xs:text-3xl font-semibold">{bedrooms.length} BR | {numBath} BA</p>
          <p className="text-xl xs:text-3xl font-semibold">${rentPerMonth.toLocaleString()} / Mo</p>
        </div>
        <div className='flex justify-between mt-6'>
          <p className="text-xl xs:text-3xl "> {sqft} Sqft</p>
          <p className="text-xl xs:text-3xl ">${deposit.toLocaleString()} Dep.</p>
        </div>
      </div>
    </div>
  );
};

export default TitleAndStats;
