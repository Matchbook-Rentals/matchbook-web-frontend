'use client'; // Required for useState and event handlers

import React, { useState } from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";
import { Button } from "@/components/ui/button"; // Import Button
import { AnimatePresence, motion } from "framer-motion"; // Import motion components

const Hero: React.FC = () => {
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up

  return (
    <div
      className="relative min-h-[60vh] rounded-lg shadow-md w-[100vw] mx-auto flex flex-col items-center px-4 sm:px-8 md:px-12 bg-cover justify-start"
      style={{
        backgroundImage: "url('/treelined-street-with-beautifully-restored-victorian-home.jpg')",
        backgroundSize: "cover", // Ensures the image covers the container
        backgroundPosition: "center", // Centers the image so it crops equally from all sides
      }}
    >
      {/* Overlay - Kept commented out as per original */}
      {/* <div className="absolute inset-0 bg-gray-400 opacity-50"></div> */}

      {/* Desktop Search Content */}
      <div className="hidden sm:block w-full z-10">
        <SearchContainer
          className="sm:w-[90%] lg:w-[80%] pt-[6%]"
          containerStyles='bg-background rounded-[15px] drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
          inputStyles='bg-background'
          searchButtonClassNames='border border-[#404040] sm:border-none bg-green-900 hover:bg-green-800 sm:bg-background sm:hover:bg-gray-200'
          searchIconColor='text-[#404040]'
          popoverMaxWidth='900px'
          headerText='Find your next home'
        />
      </div>

      {/* Mobile Button */}
      <div className="block sm:hidden my-auto pt-20 z-10"> {/* Position button lower */}
        <Button
          onClick={() => setShowSearchPopup(true)}
          className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg rounded-full shadow-md"
        >
          Start Search
        </Button>
      </div>

      {/* Mobile Pop-up Search */}
      <AnimatePresence>
        {showSearchPopup && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchPopup(false)} // Close on overlay click
              className="fixed inset-0 flex justify-center bg-black bg-opacity-80 z-40 sm:hidden" // Added flex justify-center
            >
              {/* Pop-up Search Container (Now a child of overlay) */}
              <motion.div
                onClick={(e) => e.stopPropagation()} // Stop click propagation to overlay
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                // Removed fixed positioning, using flex centering from parent overlay
                // Added top margin instead of fixed top
                className="w-fit mt-[5vh] h-fit z-50 flex justify-center sm:hidden"
              >
                {/* Use SearchContainer within the popup */}
                <SearchContainer
                  className="z-100" // Removed width constraints
                  containerStyles='bg-background mx-auto rounded-[15px] drop-shadow-[0_0px_10px_rgba(0,_0,_0,_0.2)]' // Removed padding
                  inputStyles='bg-background'
                  searchButtonClassNames='bg-green-900 hover:bg-green-800' // Mobile specific styles
                  searchIconColor='text-white md:text-[#404040]' // Match trips-content icon color
                  popoverMaxWidth='90vw' // Adjust popover width for mobile
                  headerText='Find your next home'
                  // No need for onClose prop if overlay click closes it
                />
              </motion.div> {/* Closing tag for the pop-up container */}
            </motion.div> {/* Closing tag for the overlay */}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;
