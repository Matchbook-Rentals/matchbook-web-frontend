'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import TripGrid from './trip-grid';
import { PAGE_MARGIN } from '@/constants/styles';
import { Trip } from '@prisma/client';
import SearchContainer from '@/components/home-components/searchContainer';
import { LayoutGroup } from 'framer-motion'; // Keep LayoutGroup if needed elsewhere
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components
import { useWindowSize } from '@/hooks/useWindowSize';

interface TripsContentProps {
  trips: Trip[];
}

const TripsContent: React.FC<TripsContentProps> = ({ trips }) => {
  const [showSearch, setShowSearch] = useState(trips.length === 0);
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up
  const { width } = useWindowSize();
  
  // Close the search popup when screen size becomes medium or larger
  useEffect(() => {
    if (width >= 640) { // sm breakpoint in Tailwind is 640px
      setShowSearchPopup(false);
    }
  }, [width]);

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

              {/* Mobile Search Button wrapped in DialogTrigger */}
              <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
                <DialogTrigger asChild>
                  <Button
                    className='block sm:hidden w-fit rounded-full text-[16px]' // block sm:hidden
                  >
                    New Search
                  </Button>
                </DialogTrigger>
                {/* Dialog Content will be rendered at the end of the component */}
              </Dialog>
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
          className="transition-all hidden sm:block duration-700">
          {/* Desktop Search container - Conditionally rendered */}
          {showSearch && (
            <div className="flex justify-center mt-4 mb-4 md:mb-0 ">
              <div className="flex w-full justify-center">
                <SearchContainer
                  className="z-100 md:w-full px-0"
                  containerStyles='bg-background rounded-[15px]  drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
                  inputStyles='bg-background'
                  searchButtonClassNames='bg-green-900 hover:bg-green800 sm:bg-background sm:hover:bg-gray-200'
                  searchIconColor='text-[#404040]'
                  popoverMaxWidth='900px'
                  headerText='Find your next home'
                  hasAccess
                />
              </div>
            </div>
          )}
        </div>

        {trips.length > 0 ? (
          <div // Use div instead of motion.div if layout animation isn't strictly needed here
          // layout // Remove layout prop if motion.div is removed
          // transition={{ duration: .3 }} // Remove transition if motion.div is removed
          >
            <TripGrid initialTrips={trips} />
          </div>
        ) : (
          <div // Use div instead of motion.div if layout animation isn't strictly needed here
            // layout // Remove layout prop if motion.div is removed
            className="text-center py-10 border mt-4 md:mt-32 border-dashed border-gray-300 rounded-lg bg-gray-50"
          >
            <p className="text-lg text-gray-600">You currently don&apos;t have any searches. Fill out your search details and get started!</p>
          </div>
        )}
      </div>

      {/* Mobile Search Dialog Content */}
      <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
        {/* Content container with custom styling */}
        <DialogContent
          className="sm:hidden bg-transparent border-none shadow-none p-0 w-fit max-w-[95vw] h-fit max-h-[90vh] overflow-y-auto top-[5vh] translate-y-0"
        >
          <SearchContainer
            className="z-100 max-w-lg" // z-index relative to DialogContent
            containerStyles='bg-background mx-auto rounded-[15px] drop-shadow-[0_0px_10px_rgba(0,_0,_0,_0.2)]'
            inputStyles='bg-background'
            searchButtonClassNames='bg-blueBrand hover:bg-blueBrand/80 transition-none' // Mobile specific styles
            searchIconColor='text-white' // Mobile specific icon color
            popoverMaxWidth='90vw' // Adjust popover width for mobile
            headerText='Find your next home'
            headerClassName='text-blueBrand'
            hasAccess
          />
        </DialogContent>
      </Dialog>
    </LayoutGroup>
    </> // Closing Fragment tag
  );
};

export default TripsContent;
