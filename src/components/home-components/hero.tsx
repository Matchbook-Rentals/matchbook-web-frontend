'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from "react";
import MobileSearchTrigger from "./MobileSearchTrigger";
import DesktopSearchTrigger from "./DesktopSearchTrigger";
import SearchDialog from "./SearchDialog";
import { BrandButton } from "@/components/ui/brandButton"; // Import BrandButton
import { Card, CardContent } from "@/components/ui/card"; // Import Card components
import { useWindowSize } from "@/hooks/useWindowSize"; // Import window size hook
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface HeroProps {
  hasAccess: boolean;
  tripCount: number;
  isSignedIn: boolean;
}

const Hero: React.FC<HeroProps> = ({ hasAccess, tripCount, isSignedIn }) => {
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up
  const [showSearchDialog, setShowSearchDialog] = useState(false); // State for shared search dialog
  const { width } = useWindowSize(); // Get current window width


  // Close mobile dialog when screen width exceeds 640px (sm breakpoint in Tailwind)
  useEffect(() => {
    if (width && width >= 640 && showSearchPopup) {
      setShowSearchPopup(false);
    }
  }, [width, showSearchPopup]); // Run effect when width or showSearchPopup changes

  // Handler for opening the search dialog
  const handleOpenSearchDialog = () => {
    setShowSearchDialog(true);
  };

  return (
    <div
      className="relative h-[365px] sm:h-[365px] h-[401px]  sm:max-h-[50vh] w-[100vw] mx-auto flex flex-col items-center px-0 sm:px-8 md:px-12 bg-cover justify-start"
      style={{
        backgroundImage: "url('/marketing-images/banner-house.png')",
        backgroundSize: "cover", // Ensures the image covers the container
        backgroundPosition: "center", // Centers the image so it crops equally from all sides
      }}
    >
      {/* Overlay - Kept commented out as per original */}
      {/* <div className="absolute inset-0 bg-gray-400 opacity-50"></div> */}

      {/* Desktop Search Content */}
      <div className="hidden sm:block w-full z-10">
        <DesktopSearchTrigger
          hasAccess={hasAccess} // Pass hasAccess state
          className="sm:w-[90%] lg:w-[65%] pt-[2%] mx-auto"
          containerStyles='bg-background rounded-full drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)] py-1'
          inputStyles='bg-background text-[12px]'
          searchButtonClassNames='border border-[#404040] sm:border-none bg-green-900 hover:bg-green-800 sm:bg-background sm:hover:bg-gray-200'
          searchIconColor='text-gray-400'
          onOpenDialog={handleOpenSearchDialog}
        />
        
        {/* Conditionally render OR separator and button */}
        {(tripCount > 0 || !isSignedIn) && (
          <>
            {/* OR separator with white lines */}
            <div className="flex items-center justify-center w-[65%] mx-auto mt-6">
              <div className="flex-1 h-0.5 bg-white"></div>
              <span className="px-4 text-white font-medium">OR</span>
              <div className="flex-1 h-0.5 bg-white"></div>
            </div>
            
            {/* Button - either View Past Searches or Sign In */}
            <div className="flex justify-center mt-4">
              {isSignedIn ? (
                <BrandButton variant="outline">
                  View Past Searches
                </BrandButton>
              ) : (
                <Link href="/sign-in">
                  <BrandButton variant="outline">
                    Sign In
                  </BrandButton>
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Search Trigger */}
      <MobileSearchTrigger 
        hasAccess={hasAccess} 
        onTrigger={() => setShowSearchPopup(true)}
        onOpenDialog={handleOpenSearchDialog}
      />

      {/* OR Separator */}
      <div className="block sm:hidden w-full z-10 flex justify-center pt-4">
        <div className="flex items-center gap-4">
          <Separator className="w-[145px] bg-white" />
          <span className="font-sans text-base text-white">OR</span>
          <Separator className="w-[145px] bg-white" />
        </div>
      </div>

      {/* Mobile Action Button */}
      <div className="block sm:hidden pt-4 pb-5 w-full z-10 flex justify-center">
        {isSignedIn ? (
          <BrandButton variant="outline">
            View Past Searches
          </BrandButton>
        ) : (
          <Link href="/sign-in">
            <BrandButton variant={'outline'}>
              Sign In
            </BrandButton>
          </Link>
        )}
      </div>

      {/* Shared Search Dialog */}
      <SearchDialog
        isOpen={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        hasAccess={hasAccess}
        headerText="Find your next home"
      />

    </div>
  );
};

export default Hero;
