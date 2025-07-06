'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from "react";
import SearchContainer from "./searchContainer";
import SearchInputsMobile from "./search-inputs-mobile";
import Countdown from "../marketing-landing-components/countdown";
import { Button } from "@/components/ui/button"; // Import Button
import { BrandButton } from "@/components/ui/brandButton"; // Import BrandButton
import { Card, CardContent } from "@/components/ui/card"; // Import Card components
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
import { Separator } from "@/components/ui/separator";

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
      className="relative h-[365px] sm:h-[365px] h-[401px] max-h-[55vh] sm:max-h-[50vh] w-[100vw] mx-auto flex flex-col items-center px-0 sm:px-8 md:px-12 bg-cover justify-start"
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

      {/* Mobile Search Trigger */}
      <div className="block sm:hidden pt-6 w-full z-10 flex justify-center">
        <div className="relative">
          <Card className="w-[397px] rounded-xl overflow-hidden cursor-pointer" onClick={() => hasAccess && setShowSearchPopup(true)}>
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-4 w-full">
                  {/* Where field */}
                  <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da]">
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal">
                      Where
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal">
                      Choose Location
                    </span>
                  </div>

                  {/* Move in/out date fields */}
                  <div className="flex items-center gap-5 w-full">
                    {/* Move in field */}
                    <div className="flex flex-col w-[170px] pb-1.5 border-b border-[#d1d5da]">
                      <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px]">
                        Move in
                      </label>
                      <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal">
                        Select Dates
                      </span>
                    </div>

                    {/* Move out field */}
                    <div className="flex flex-col w-[170px] pb-1.5 border-b border-[#d1d5da]">
                      <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px]">
                        Move out
                      </label>
                      <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal">
                        Select Dates
                      </span>
                    </div>
                  </div>

                  {/* Who field */}
                  <div className="flex flex-col h-[42px] pb-1.5 border-b border-[#d1d5da]">
                    <label className="font-text-label-xsmall-medium font-[500] text-gray-neutral700 text-[12px] leading-normal mt-[-1.00px]">
                      Who
                    </label>
                    <span className="font-['Poppins',Helvetica] font-normal text-gray-neutral400 text-[10px] leading-normal">
                      Add Renters
                    </span>
                  </div>
                </div>

                {/* Button */}
                <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white">
                  Start Search
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Gray overlay when no access */}
          {!hasAccess && (
            <div className="absolute inset-0 bg-gray-200/80 rounded-xl cursor-not-allowed"></div>
          )}
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <SearchInputsMobile
        hasAccess={hasAccess}
        isOpen={showSearchPopup}
        onOpenChange={setShowSearchPopup}
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
        {hasAccess ? (
          <BrandButton variant="outline">
            View Past Searches
          </BrandButton>
        ) : (
          <BrandButton variant={'outline'}> Log In </BrandButton>
        )}
      </div>

    </div>
  );
};

export default Hero;
