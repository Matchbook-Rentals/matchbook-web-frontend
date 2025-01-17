'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import TripGrid from './trip-grid';
import { PAGE_MARGIN } from '@/constants/styles';
import { Trip } from '@prisma/client';
import SearchContainer from '@/components/home-components/searchContainer';

interface TripsContentProps {
  trips: Trip[];
}

const TripsContent: React.FC<TripsContentProps> = ({ trips }) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className={`bg-background ${PAGE_MARGIN} mx-auto`}>
      <div className='flex justify-between'>
        <h1 className="font-montserrat-regular text-[14px]">Searches</h1>
        <p
          className='underline hover:font-medium text-[14px] cursor-pointer'
          onClick={() => setShowSearch(!showSearch)}
        >
          New Search
        </p>
      </div>

      {/* Search container with slide animation */}
      <div
        className={`overflow-hidden transition-all duration-300 flex justify-center ease-in-out ${
          showSearch ? 'h-[750px] opacity-100 my-4' : 'max-h-0 opacity-0'
        }`}
      >
        <SearchContainer className="z-100" />
      </div>

      <div className="w-full mx-auto my-4 sm:mb-4">
        <Image
          src="/milwaukee-downtown.png"
          alt="Village footer"
          width={1200}
          height={516}
          className="w-full max-w-[1000px] h-auto object-cover mx-auto p-0 my-0"
        />
        <div className='bg-[#5C9AC5] rounded-md w-full h-[14px] sm:h-[21px] -translate-y-[2px]' />
      </div>

      <TripGrid initialTrips={trips} />
    </div>
  );
};

export default TripsContent;