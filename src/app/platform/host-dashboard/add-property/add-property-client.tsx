'use client';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProgressBar, { StepInfo } from "./progress-bar";
import LocationForm from "./location-form";
import { PropertyDetails } from "./types";
import ListingUploadHighlights from "./listing-upload-highlights";

// Nullable Listing type for building a new listing
interface NullableListing {
  listingPhotos: NullableListingImage[];

  id: string | null;
  isApproved: boolean | null;
  createdAt: Date | null;
  lastModified: Date | null;
  lastApprovalDecision: Date | null;
  lastDecisionComment: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  imageSrc: string | null;
  category: string | null;
  roomCount: number | null;
  bathroomCount: number | null;
  guestCount: number | null;
  latitude: number | null;
  longitude: number | null;
  locationString: string | null;
  city: string | null;
  state: string | null;
  streetAddress1: string | null;
  streetAddress2: string | null;
  postalCode: string | null;
  userId: string | null;
  squareFootage: number | null;
  depositSize: number | null;
  requireBackgroundCheck: boolean | null;
  shortestLeaseLength: number | null;
  longestLeaseLength: number | null;
  shortestLeasePrice: number | null;
  longestLeasePrice: number | null;
  furnished: boolean | null;
  utilitiesIncluded: boolean | null;
  petsAllowed: boolean | null;
  airConditioner: boolean | null;
  laundryFacilities: boolean | null;
  fitnessCenter: boolean | null;
  elevator: boolean | null;
  wheelchairAccess: boolean | null;
  doorman: boolean | null;
  parking: boolean | null;
  wifi: boolean | null;
  kitchen: boolean | null;
  dedicatedWorkspace: boolean | null;
  hairDryer: boolean | null;
  iron: boolean | null;
  heater: boolean | null;
  hotTub: boolean | null;
  smokingAllowed: boolean | null;
  eventsAllowed: boolean | null;
}

// Nullable ListingImage type for photo support
interface NullableListingImage {
  id: string | null;
  url: string | null;
  listingId: string | null;
  category: string | null;
  rank: number | null;
}

export default function AddPropertyclient() {
  // State to track current step and animation direction
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Listing state with all fields initialized to null
  const [listing, setListing] = useState<NullableListing>({
    listingPhotos: [],
    id: null,
    isApproved: null,
    createdAt: null,
    lastModified: null,
    lastApprovalDecision: null,
    lastDecisionComment: null,
    status: null,
    title: null,
    description: null,
    imageSrc: null,
    category: null,
    roomCount: null,
    bathroomCount: null,
    guestCount: null,
    latitude: null,
    longitude: null,
    locationString: null,
    city: null,
    state: null,
    streetAddress1: null,
    streetAddress2: null,
    postalCode: null,
    userId: null,
    squareFootage: null,
    depositSize: null,
    requireBackgroundCheck: null,
    shortestLeaseLength: null,
    longestLeaseLength: null,
    shortestLeasePrice: null,
    longestLeasePrice: null,
    furnished: null,
    utilitiesIncluded: null,
    petsAllowed: null,
    airConditioner: null,
    laundryFacilities: null,
    fitnessCenter: null,
    elevator: null,
    wheelchairAccess: null,
    doorman: null,
    parking: null,
    wifi: null,
    kitchen: null,
    dedicatedWorkspace: null,
    hairDryer: null,
    iron: null,
    heater: null,
    hotTub: null,
    smokingAllowed: null,
    eventsAllowed: null,
  });
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [animationKey, setAnimationKey] = useState<number>(0);
  
  // Property details state
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    propertyType: "Single Family",
    furnishingType: "Furnished",
    utilitiesIncluded: true,
    petsAllowed: true,
    country: "United States"
  });
  
  // Define steps
  const steps: StepInfo[] = [
    { name: "Highlights", position: 0 },
    { name: "Details", position: 1 },
    { name: "Photos", position: 2 },
    { name: "Pricing", position: 3 },
    { name: "Review", position: 4 },
  ];


  // Handler for Save & Exit button
  const handleSaveExit = () => {
    console.log("Save and Exit clicked");
    // Implement save and exit functionality
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('right'); // Slide from right to left (next)
      setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
      setCurrentStep(currentStep + 1);
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection('left'); // Slide from left to right (back)
      setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
      setCurrentStep(currentStep - 1);
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ListingUploadHighlights
            propertyDetails={propertyDetails}
            setPropertyDetails={setPropertyDetails}
          />
        );
      case 1:
        return (
          <LocationForm
            propertyDetails={propertyDetails}
            setPropertyDetails={setPropertyDetails}
          />
        );
      case 2:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 3: Photos
            </h2>
          </div>
        );
      case 3:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 4: Pricing
            </h2>
          </div>
        );
      case 4:
        return (
          <div className="min-h-[600px] flex items-center justify-center">
            <h2 className="font-['Poppins',Helvetica] font-medium text-[#3f3f3f] text-3xl">
              Step 5: Review
            </h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full min-h-screen">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-12 pb-32">
        {/* Progress bar component */}
        <ProgressBar 
          currentStep={currentStep} 
          steps={steps}
          onSaveExit={handleSaveExit}
        />

        {/* Main content with slide animation */}
        <div className="mx-auto w-full max-w-[891px] mb-24">
          <div 
            key={animationKey} // Adding key to force re-render on each step change
            className="transition-transform duration-500 ease-in-out"
            style={{
              animation: `${slideDirection === 'right' ? 'slideInRight' : 'slideInLeft'} 0.5s forwards`,
              minHeight: 'calc(100vh - 300px)' // Ensure enough space for content plus buttons
            }}
          >
            {renderStepContent()}
          </div>
        </div>
        
        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Footer with navigation buttons - fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <Separator className="w-full" />
          <div className="flex justify-between mx-auto w-full max-w-[891px] py-4">
            <Button 
              className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button 
              className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
        
{/* Removed redundant padding div as we've added padding elsewhere */}
      </div>
    </main>
  );
};
