import { Bedroom } from '@prisma/client';
import React from 'react';
import SearchMap from '../../searches/(components)/search-map';

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
  listingPin?: {
    lat: number;
    lng: number;
  };
}

const TitleAndStats: React.FC<TitleAndStatsProps> = ({
  title = 'Placeholder Title',
  listingPin,
  rentPerMonth = 0,
  numBeds = 0,
  numBath = 0,
  sqft = 0,
  deposit = 0,
  distance = 0,
  bedrooms = [],
  address = '',
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
    <div className="flex flex-col md:flex-row md:-translate-y-[40%] lg:-translate-y-[50%]  md:space-x-8 text-center justify-between w-full my-2 py-1 mx-auto">
      <div className="flex flex-col mb-4 md:mb-0  w-full md:w-1/2 ">
        <div className=" w-full md:w-1/2 min-h-[600px] p-4">
          <p className='text-lg text-center flex items-center justify-center pb-2 font-semibold'>{address}</p>
          <SearchMap markers={[listingPin]} center={listingPin!} zoom={12} />
        </div>
      </div>
      <div className="flex flex-col w-full md:w-1/2 pt-1 pb-8 justify-evenly border-b border-[#313131] ">
        <div className='flex justify-between'>
          <p className="text-lg xs:text-xl md:text-2xl lg:text-3xl">{bedrooms.length} BR | {numBath} BA</p>
          <p className="text-lg xs:text-xl md:text-2xl lg:text-3xl">${rentPerMonth.toLocaleString()} / Mo</p>
        </div>
        <div className='flex justify-between mt-6 border-b-1'>
          <p className="text-lg xs:text-xl md:text-2xl lg:text-3xl"> {sqft} Sqft</p>
          <p className="text-lg xs:text-xl md:text-2xl lg:text-3xl">${deposit.toLocaleString()} Dep.</p>
        </div>
      </div>
    </div>
  );
};

export default TitleAndStats;
