'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import TripGrid from './trip-grid';
import { PAGE_MARGIN } from '@/constants/styles';
import { Trip } from '@prisma/client';
import SearchContainer from '@/components/home-components/searchContainer';
import { AnimatePresence, motion, LayoutGroup, delay } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TripsContentProps {
  trips: Trip[];
}

const TripsContent: React.FC<TripsContentProps> = ({ trips }) => {
  const [showSearch, setShowSearch] = useState(trips.length === 0);

  return (
    <LayoutGroup>
      <div className={`bg-background ${PAGE_MARGIN} mx-auto min-h-[105vh]`}>
        <div className='flex items-end pb-2'>
          <div className='flex flex-col w-1/2'>
            <h1 className='text-[32px] font-medium mb-4'>Your Searches </h1>
            <Button onClick={() => setShowSearch(prev => !prev)} className='w-fit rounded-full text-[16px]'> New Search <ChevronDown className={`pl-1 ml-1 transition-transform duration-300 ${showSearch ? 'rotate-180' : ''}`} /> </Button>
          </div>
          <div className="hidden sm:block w-full md:w-1/2 mx-auto">
            <Image
              src="/milwaukee-downtown.png"
              alt="Village footer"
              width={1200}
              height={516}
              className="w-full max-w-[1000px] h-auto object-cover mx-auto p-0 my-0"
            />
          </div>
        </div>

        {/* Placeholder div to maintain space during transitions */}
        <div
          style={{
            height: showSearch ? 'auto' : '0px',
            minHeight: showSearch ? '80px' : '0px',
            marginBottom: showSearch ? '0px' : '10px',
          }}
          className="transition-all duration-700">
          {/* Search container with Framer Motion animation */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -60 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.3,
                    ease: 'easeInOut'
                  }
                }}
                exit={{
                  opacity: 0,
                  y: -40,
                  transition: {
                    duration: 0.3,
                    ease: 'easeInOut'
                  }
                }}
                className="flex justify-center mt-4 mb-8"
              >
                <div className="flex w-full justify-center">
                  <SearchContainer
                    className="z-100 w-full px-0"
                    containerStyles='bg-background rounded-none m-0 p-0 drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
                    inputStyles='bg-background'
                    searchButtonClassNames='bg-background hover:bg-gray-200'
                    searchIconColor='text-[#404040]'
                    popoverMaxWidth='900px'
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {trips.length > 0 ? (
          <motion.div
            layout
            transition={{duration: .3}}
          >
            <TripGrid initialTrips={trips} />
          </motion.div>
        ) : (
          <motion.div
            layout
            className="text-center py-10 border mt-4 md:mt-32 border-dashed border-gray-300 rounded-lg bg-gray-50"
          >
            <p className="text-lg text-gray-600">You currently don&apos;t have any searches. Fill out your search details and get started!</p>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
};

export default TripsContent;
