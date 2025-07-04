'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";
import { Button } from "@/components/ui/button"; // Import Button
import { BrandButton } from "@/components/ui/brandButton"; // Import BrandButton
import { useAuth, useUser } from "@clerk/nextjs"; // Import Clerk hooks
import { checkClientBetaAccess } from '@/utils/roles';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { useWindowSize } from "@/hooks/useWindowSize"; // Import window size hook
import { getUserTripsCount } from "@/app/actions/trips"; // Import trip count function

const Hero: React.FC = () => {
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up
  const [hasAccess, setHasAccess] = useState(false); // State for access check
  const [tripCount, setTripCount] = useState<number>(0); // State for trip count
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { width } = useWindowSize(); // Get current window width

  // Effect to check user access based on role
  useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        // Allow access for specific roles
        setHasAccess(checkClientBetaAccess(userRole));
      } else {
        // No access if not signed in or user data is unavailable
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, user]); // Rerun check when auth state or user data changes

  // Effect to fetch trip count when user is signed in
  useEffect(() => {
    const fetchTripCount = async () => {
      if (isSignedIn && user) {
        try {
          const count = await getUserTripsCount();
          setTripCount(count);
        } catch (error) {
          console.error('Error fetching trip count:', error);
          setTripCount(0);
        }
      } else {
        setTripCount(0);
      }
    };

    fetchTripCount();
  }, [isSignedIn, user]); // Rerun when auth state changes

  // Close mobile dialog when screen width exceeds 640px (sm breakpoint in Tailwind)
  useEffect(() => {
    if (width && width >= 640 && showSearchPopup) {
      setShowSearchPopup(false);
    }
  }, [width, showSearchPopup]); // Run effect when width or showSearchPopup changes

  return (
    <div
      className="relative h-[365px] max-h-[50vh] w-[100vw] mx-auto flex flex-col items-center px-0 sm:px-8 md:px-12 bg-cover justify-start"
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
        <SearchContainer
          hasAccess={hasAccess} // Pass hasAccess state
          className="sm:w-[90%] lg:w-[65%] pt-[2%]"
          containerStyles='bg-background rounded-full drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)] py-1'
          inputStyles='bg-background text-[12px]'
          searchButtonClassNames='border border-[#404040] sm:border-none bg-green-900 hover:bg-green-800 sm:bg-background sm:hover:bg-gray-200'
          searchIconColor='text-gray-400'
          popoverMaxWidth='900px'
          headerText='Find your next home'
        />
        
        {/* Conditionally render OR separator and button only if user has trips */}
        {tripCount > 0 && (
          <>
            {/* OR separator with white lines */}
            <div className="flex items-center justify-center w-[65%] mx-auto mt-6">
              <div className="flex-1 h-0.5 bg-white"></div>
              <span className="px-4 text-white font-medium">OR</span>
              <div className="flex-1 h-0.5 bg-white"></div>
            </div>
            
            {/* VIEW PAST SEARCHES button */}
            <div className="flex justify-center mt-4">
              <BrandButton variant="outline">
                View Past Searches
              </BrandButton>
            </div>
          </>
        )}
      </div>

      {/* Mobile Button wrapped in DialogTrigger */}
      <div className="block sm:hidden my-auto pt-10 w-full z-10 text-center"> {/* Position button lower and center text */}
        {/* Header Text for Mobile with Background */}
        <div className="inline-block bg-black/30 p-4 w-full rounded-none mb-4"> {/* Added background div */}
          <h1 className="text-4xl font-medium text-white mb-8 "> {/* Removed text shadow and margin-bottom */}
            Find your next home
          </h1>
          <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
            <DialogTrigger asChild disabled={!hasAccess}>
              <Button
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg rounded-full shadow-md disabled:opacity-80 disabled:cursor-not-allowed"
                disabled={!hasAccess} // Disable button if no access
              >
                {hasAccess ? 'Start Search' : 'Start Search'} {/* Change text based on access */}
              </Button>
            </DialogTrigger>
            {/* Dialog Content will be rendered below */}
          </Dialog>
        </div>
      </div>

      {/* Mobile Search Dialog Content */}
      <Dialog open={showSearchPopup} onOpenChange={setShowSearchPopup}>
        {/* Content container with custom styling */}
        <DialogContent
          hideCloseButton
          className="sm:hidden h-fit max-h-[90vh] bg-transparent border-none shadow-none p-0 w-fit max-w-[95vw] top-[5vh] translate-y-0"
        >
          <div className="flex justify-center w-full">
            <ScrollArea className="h-full max-h-[90vh] w-auto">
              <div className="px-1">
                {/* Use SearchContainer within the popup */}
                <SearchContainer
                  hasAccess={hasAccess} // Pass hasAccess state
                  className="z-100" // Removed width constraint as it's now centered by parent
                  containerStyles='bg-background mx-auto rounded-[15px] drop-shadow-[0_0px_10px_rgba(0,_0,_0,_0.2)]' // Removed padding
                  inputStyles='bg-background'
                  searchButtonClassNames='bg-primaryBrand hover:bg-primaryBrand/90 transition-none' // Mobile specific styles
                  searchIconColor='text-white' // Mobile specific icon color
                  popoverMaxWidth='90vw' // Adjust popover width for mobile
                  headerText='Find your next home'
                />
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hero;
