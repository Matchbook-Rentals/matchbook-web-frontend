'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import TripGrid from './trip-grid';
import { PAGE_MARGIN } from '@/constants/styles';
import { Trip } from '@prisma/client';
import SearchContainer from '@/components/home-components/searchContainer';
import { AnimatePresence, motion } from 'framer-motion';

interface TripsContentProps {
  trips: Trip[];
}

const TripsContent: React.FC<TripsContentProps> = ({ trips }) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className={`bg-background ${PAGE_MARGIN} mx-auto min-h-[105vh]`}>
      <div className='flex justify-between'>
        <h1 className="font-montserrat-regular text-[14px]">Searches</h1>
        <p
          className='underline hover:font-medium text-[14px] cursor-pointer'
          onClick={() => setShowSearch(!showSearch)}
        >
          New Search
        </p>
      </div>

      {/* Search container with Framer Motion animation */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.9 }}
            animate={{ height: 150, opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex justify-center my-4 "
          >
            <SearchContainer
              className="z-100"
              containerStyles='bg-white border-[1px] border-gray-200 drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
              inputStyles='bg-white'
            />
          </motion.div>
        )}
      </AnimatePresence>

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
