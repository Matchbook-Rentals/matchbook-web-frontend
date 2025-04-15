'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ProgressBar, { StepInfo } from "./progress-bar";
import LocationForm from "./location-form";
import ListingUploadHighlights from "./listing-creation-highlights";
import { Rooms } from "./listing-creation-rooms";
import { ListingBasics } from "./listing-creation-basics";
import { ListingPhotos } from "./listing-creation-photos-upload";
import ListingPhotoSelection from "./listing-creation-photo-selection";
import ListingAmenities from "./listing-creation-amenities";
import ListingCreationPricing from "./listing-creation-pricing";
import { Box as ListingCreationReview } from "./listing-creation-review";

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
export interface NullableListingImage {
  id: string | null;
  url: string | null;
  listingId: string | null;
  category: string | null;
  rank: number | null;
}

export default function AddPropertyclient() {
  // State to track current step and animation direction
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Track if user came from review page
  const [cameFromReview, setCameFromReview] = useState<boolean>(false);

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
  // State to hold the current set of photos for the listing
// This will be used to manage photo uploads, ordering, and removal before saving to the listing
const [listingPhotos, setListingPhotos] = useState<NullableListingImage[]>([]);

// State for selected featured photos
const [selectedPhotos, setSelectedPhotos] = useState<NullableListingImage[]>([]);

const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [animationKey, setAnimationKey] = useState<number>(0);
  
  // Listing highlights type - subset of NullableListing
interface ListingHighlights {
  category: string | null;
  petsAllowed: boolean | null;
  furnished: boolean | null;
  utilitiesIncluded: boolean | null;
}

// Listing location type - subset of NullableListing
interface ListingLocation {
  locationString: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  streetAddress1: string | null;
  streetAddress2: string | null;
  postalCode: string | null;
  country: string | null;
}

// Subset states for different sections

// Step 0: Highlights
const [listingHighlights, setListingHighlights] = useState<ListingHighlights>({
  category: "Single Family",
  petsAllowed: true,
  furnished: true,
  utilitiesIncluded: true
});

// Step 1: Details (Location)
const [listingLocation, setListingLocation] = useState<ListingLocation>({
  locationString: null,
  latitude: null,
  longitude: null,
  city: null,
  state: null,
  streetAddress1: null,
  streetAddress2: null,
  postalCode: null,
  country: "United States"
});

// Step 4.5: Amenities
const [listingAmenities, setListingAmenities] = useState<string[]>([]);

// Step 7: Pricing
const [listingPricing, setListingPricing] = useState({
  shortestStay: 1,
  longestStay: 12,
  shortTermRent: "",
  longTermRent: "",
  deposit: "",
  petDeposit: "",
  petRent: "",
  tailoredPricing: true
});

// Step 2: Rooms
const [listingRooms, setListingRooms] = useState({
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: ""
});

// Step 3: Basics
const [listingBasics, setListingBasics] = useState({
  title: "",
  description: ""
});

// Define steps
  const steps: StepInfo[] = [
    { name: "Highlights", position: 0 },
    { name: "Details", position: 1 },
    { name: "Rooms", position: 2 },
    { name: "Basics", position: 3 },
    { name: "Photos", position: 4 },
    { name: "Featured Photos", position: 5 },
    { name: "Amenities", position: 6 },
    { name: "Pricing", position: 7 },
    { name: "Review", position: 8 },
  ];


  // Handler for Save & Exit button
  const handleSaveExit = () => {
    console.log("Save and Exit clicked");
    // Implement save and exit functionality
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // If coming from review, go directly back to review
      if (cameFromReview) {
        setSlideDirection('right'); // Slide from right to left (next)
        setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
        setCurrentStep(8); // Go to review step
        setCameFromReview(false); // Reset the flag
      } else {
        // Normal flow
        setSlideDirection('right'); // Slide from right to left (next)
        setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
        setCurrentStep(currentStep + 1);
      }
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setSlideDirection('left'); // Slide from left to right (back)
      setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
      setCurrentStep(currentStep - 1);
      setCameFromReview(false); // Reset the flag since we're going backward
      
      // Scroll the whole page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handler for edit actions from review page
  const handleEditFromReview = (stepIndex: number) => {
    setSlideDirection('left'); // Slide from left to right (back)
    setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
    setCurrentStep(stepIndex);
    setCameFromReview(true); // Set the flag to indicate we came from review
    
    // Scroll the whole page to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Effect to sync subset states back to main listing state
  useEffect(() => {
    setListing(prevListing => ({
      ...prevListing,
      // Sync highlights
      category: listingHighlights.category,
      petsAllowed: listingHighlights.petsAllowed,
      furnished: listingHighlights.furnished,
      utilitiesIncluded: listingHighlights.utilitiesIncluded,
      // Sync location
      locationString: listingLocation.locationString,
      latitude: listingLocation.latitude,
      longitude: listingLocation.longitude,
      city: listingLocation.city,
      state: listingLocation.state,
      streetAddress1: listingLocation.streetAddress1,
      streetAddress2: listingLocation.streetAddress2,
      postalCode: listingLocation.postalCode,
      // Sync rooms
      roomCount: listingRooms.bedrooms,
      bathroomCount: listingRooms.bathrooms,
      squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet) : null,
      // Sync amenities
      amenities: listingAmenities,
      // Sync pricing
      shortestLeaseLength: listingPricing.shortestStay,
      longestLeaseLength: listingPricing.longestStay,
      shortestLeasePrice: listingPricing.shortTermRent ? Number(listingPricing.shortTermRent) : null,
      longestLeasePrice: listingPricing.longTermRent ? Number(listingPricing.longTermRent) : null,
      depositSize: listingPricing.deposit ? Number(listingPricing.deposit) : null,
    }));
  }, [listingHighlights, listingLocation, listingRooms, listingAmenities, listingPricing]);


  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ListingUploadHighlights
            listingHighlights={listingHighlights}
            setListingHighlights={setListingHighlights}
          />
        );
      case 1:
        return (
          <LocationForm
            listingLocation={listingLocation}
            setListingLocation={setListingLocation}
          />
        );
      case 2:
        return (
          <Rooms
            bedrooms={listingRooms.bedrooms}
            bathrooms={listingRooms.bathrooms}
            squareFeet={listingRooms.squareFeet}
            onBedroomsChange={value => setListingRooms(prev => ({ ...prev, bedrooms: value }))}
            onBathroomsChange={value => setListingRooms(prev => ({ ...prev, bathrooms: value }))}
            onSquareFeetChange={value => setListingRooms(prev => ({ ...prev, squareFeet: value }))}
          />
        );
      case 3:
        return (
          <ListingBasics
            title={listingBasics.title}
            setTitle={value => setListingBasics(prev => ({ ...prev, title: value }))}
            description={listingBasics.description}
            setDescription={value => setListingBasics(prev => ({ ...prev, description: value }))}
          />
        );
      case 4:
        return (
          <ListingPhotos listingPhotos={listingPhotos} setListingPhotos={setListingPhotos} />
        );
      case 5:
        return (
          <ListingPhotoSelection
            listingPhotos={listingPhotos}
            selectedPhotos={selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
          />
        );
      case 6:
        return (
          <ListingAmenities
            value={listingAmenities}
            onChange={setListingAmenities}
          />
        );
      case 7:
        return (
          <ListingCreationPricing
            shortestStay={listingPricing.shortestStay}
            longestStay={listingPricing.longestStay}
            shortTermRent={listingPricing.shortTermRent}
            longTermRent={listingPricing.longTermRent}
            deposit={listingPricing.deposit}
            petDeposit={listingPricing.petDeposit}
            petRent={listingPricing.petRent}
            tailoredPricing={listingPricing.tailoredPricing}
            onShortestStayChange={(value) => setListingPricing(prev => ({ ...prev, shortestStay: value }))}
            onLongestStayChange={(value) => setListingPricing(prev => ({ ...prev, longestStay: value }))}
            onShortTermRentChange={(value) => setListingPricing(prev => ({ ...prev, shortTermRent: value }))}
            onLongTermRentChange={(value) => setListingPricing(prev => ({ ...prev, longTermRent: value }))}
            onDepositChange={(value) => setListingPricing(prev => ({ ...prev, deposit: value }))}
            onPetDepositChange={(value) => setListingPricing(prev => ({ ...prev, petDeposit: value }))}
            onPetRentChange={(value) => setListingPricing(prev => ({ ...prev, petRent: value }))}
            onTailoredPricingChange={(value) => setListingPricing(prev => ({ ...prev, tailoredPricing: value }))}
            onContinue={handleNext}
          />
        );
      case 8:
        return (
          <ListingCreationReview 
            listingHighlights={listingHighlights}
            listingLocation={listingLocation}
            listingRooms={listingRooms}
            listingBasics={listingBasics}
            listingAmenities={listingAmenities}
            listingPricing={listingPricing}
            onEditHighlights={() => handleEditFromReview(0)}
            onEditLocation={() => handleEditFromReview(1)}
            onEditRooms={() => handleEditFromReview(2)}
            onEditBasics={() => handleEditFromReview(3)}
            onEditAmenities={() => handleEditFromReview(6)}
            onEditPricing={() => handleEditFromReview(7)}
          />
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
              disabled={currentStep === steps.length - 1 && false} // Disabled set to false for final step to submit the listing
            >
              {currentStep === steps.length - 1 ? 'Submit Listing' : 
               cameFromReview ? 'Review' : 'Next'}
            </Button>
          </div>
        </div>
        
{/* Removed redundant padding div as we've added padding elsewhere */}
      </div>
    </main>
  );
};
