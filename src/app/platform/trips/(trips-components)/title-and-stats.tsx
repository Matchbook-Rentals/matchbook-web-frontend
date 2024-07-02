import RatingStar from '@/components/ui/rating-star';
import React from 'react';

interface TitleAndStatsProps {
  title?: string;
  rating?: number;
  numStays?: number;
  rentPerMonth?: number;
  numBeds?: number;
  numBath?: number;
  distance?: number;
}

const TitleAndStats: React.FC<TitleAndStatsProps> = ({
  title,
  rating,
  numStays,
  rentPerMonth,
  numBeds,
  numBath,
  distance,
}) => {
  return (
    <div className="flex flex-wrap w-full justify-between items-start my-3">
      <div className='flex w-1/2 justify-start gap-x-6'>
        {title && <h2 className="text-3xl font-semibold">{title}</h2>}
        {rating !== undefined && (
          <div className='flex gap-x-2 items-center'>
            <RatingStar size={35} rating={rating} />
            <span className='text-xl'>{rating}</span>
          </div>
        )}
        {numStays !== undefined && <span className='text-xl flex items-center'>{numStays} stays</span>}
      </div>

      <div className='flex flex-col items-end'>
        {rentPerMonth !== undefined && <span className="text-3xl">${rentPerMonth}/month</span>}
        {numBeds !== undefined && numBath !== undefined && (
          <span className="text-xl">
            {numBeds} beds, {numBath} baths
          </span>
        )}
        {distance !== undefined && <span className="text-md">{distance} mock miles</span>}
      </div>
    </div>
  );
};

export default TitleAndStats;
