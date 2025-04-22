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
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up

  return (
    <> {/* Add opening Fragment tag */}
      <LayoutGroup>
        <div className={`bg-background ${PAGE_MARGIN} mx-auto min-h-[105vh]`}>
          <div className='flex items-end pb-2'>
          <div className='flex flex-col w-full sm:w-1/2'> {/* Adjust width for mobile buttons */}
            <h1 className='text-[32px] font-medium mb-4'>Your Searches </h1>
            <div className="flex flex-wrap gap-2"> {/* Wrapper for buttons */}
              {/* Original Button - Hidden on mobile */}
              <Button
                onClick={() => setShowSearch(prev => !prev)}
                className='hidden sm:flex w-fit rounded-full text-[16px]' // Use sm:flex to show on desktop
              >
                New Search <ChevronDown className={`pl-1 ml-1 transition-transform duration-300 ${showSearch ? 'rotate-180' : ''}`} />
              </Button>
              {/* New Pop-up Button - Visible only on mobile */}
              <Button
                onClick={() => setShowSearchPopup(true)}
                className='block sm:hidden w-fit rounded-full text-[16px]' // block sm:hidden
              >
                New Search Pop-up
              </Button>
              {/* Keep original button visible on mobile for A/B test */}
              <Button
                onClick={() => setShowSearch(prev => !prev)}
                className='block sm:hidden w-fit rounded-full text-[16px] bg-blue-500 hover:bg-blue-600' // Added different bg for distinction
              >
                New Search Slide in <ChevronDown className={`pl-1 ml-1 transition-transform duration-300 ${showSearch ? 'rotate-180' : ''}`} />
              </Button>
            </div>
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
            marginBottom: showSearch ? '0px' : '20px',
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
                className="flex justify-center mt-4 mb-4 md:mb-0 "
              >
                <div className="flex w-full justify-center">
                  <SearchContainer
                    className="z-100 md:w-full px-0"
                    containerStyles='bg-background rounded-[15px]  drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
                    inputStyles='bg-background'
                    searchButtonClassNames='bg-green-900 hover:bg-green800 md:bg-background md:hover:bg-gray-200'
                    searchIconColor='text-[#404040]'
                    popoverMaxWidth='900px'
                    headerText='Find your next home'
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {trips.length > 0 ? (
          <motion.div
            layout
            transition={{ duration: .3 }}
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

    {/* Mobile Pop-up Search - Moved outside LayoutGroup */}
    <AnimatePresence>
      {showSearchPopup && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearchPopup(false)} // Close on overlay click
            className="fixed inset-0 flex justify-center bg-black bg-opacity-80 z-40 sm:hidden" // Only show overlay on mobile
          >
            {/* Pop-up Search Container */}
            <motion.div
              onClick={(e) => e.stopPropagation()} // Stop click propagation to overlay
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              // Removed fixed positioning and z-50, rely on parent overlay flex centering + margin
              className="w-fit mt-[5vh] h-fit flex justify-center sm:hidden"
            >
              <SearchContainer
                className="z-100 max-w-lg" // z-index relative to parent motion.div now
                containerStyles='bg-background mx-auto rounded-[15px] drop-shadow-[0_0px_10px_rgba(0,_0,_0,_0.2)]'
                inputStyles='bg-background'
                searchButtonClassNames='bg-green-900 hover:bg-green800' // Mobile specific styles if needed
                searchIconColor='text-white md:text-[#404040]' // Adjust icon color if needed for mobile
                popoverMaxWidth='90vw' // Adjust popover width for mobile
                headerText='Find your next home'
              // Add a close button or mechanism inside SearchContainer if needed, or rely on overlay click
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </> // Add closing Fragment tag
  );
};

export default TripsContent;
