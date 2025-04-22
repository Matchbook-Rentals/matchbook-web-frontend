'use client'; // Required for useState and event handlers

import React, { useState, useEffect } from "react";
import SearchContainer from "./searchContainer";
import Countdown from "../marketing-landing-components/countdown";
import { Button } from "@/components/ui/button"; // Import Button
import { useAuth, useUser } from "@clerk/nextjs"; // Import Clerk hooks
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components

const Hero: React.FC = () => {
  const [showSearchPopup, setShowSearchPopup] = useState(false); // State for mobile pop-up
  const [hasAccess, setHasAccess] = useState(false); // State for access check
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Effect to check user access based on role
  useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        // Allow access for specific roles
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      } else {
        // No access if not signed in or user data is unavailable
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, user]); // Rerun check when auth state or user data changes

  return (
    <div
      className="relative min-h-[60vh] rounded-lg shadow-md w-[100vw] mx-auto flex flex-col items-center px-0 sm:px-8 md:px-12 bg-cover justify-start"
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
          hasAccess={hasAccess} // Pass hasAccess state
          className="sm:w-[90%] lg:w-[80%] pt-[6%]"
          containerStyles='bg-background rounded-[15px] drop-shadow-[0_0px_5px_rgba(0,_0,_0,_0.1)]'
          inputStyles='bg-background'
          searchButtonClassNames='border border-[#404040] sm:border-none bg-green-900 hover:bg-green-800 sm:bg-background sm:hover:bg-gray-200'
          searchIconColor='text-[#404040]'
          popoverMaxWidth='900px'
          headerText='Find your next home'
        />
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
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasAccess} // Disable button if no access
              >
                {hasAccess ? 'Start Search' : 'Access Restricted'} {/* Change text based on access */}
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
          className="sm:hidden bg-transparent border-none shadow-none p-0 w-fit max-w-[95vw] top-[5vh] translate-y-0"
        >
          {/* Use SearchContainer within the popup */}
          <SearchContainer
            hasAccess={hasAccess} // Pass hasAccess state
            className="z-100" // Removed width constraints
            containerStyles='bg-background mx-auto rounded-[15px] drop-shadow-[0_0px_10px_rgba(0,_0,_0,_0.2)]' // Removed padding
            inputStyles='bg-background'
            searchButtonClassNames='bg-blueBrand hover:bg-blueBrand/90 transition-none' // Mobile specific styles
            searchIconColor='text-white' // Mobile specific icon color
            popoverMaxWidth='90vw' // Adjust popover width for mobile
            headerText='Find your next home'
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hero;
