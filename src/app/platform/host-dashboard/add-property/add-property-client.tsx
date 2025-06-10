'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ProgressBar, { StepInfo } from "./progress-bar";
import { revalidateHostDashboard } from "../_actions";
import { getListingById } from "@/app/actions/listings";
import LocationForm from "./location-form";
import ListingUploadHighlights from "./listing-creation-highlights";
import { Rooms } from "./listing-creation-rooms";
import { ListingBasics } from "./listing-creation-basics";
import { ListingPhotos } from "./listing-creation-photos-upload";
import ListingPhotoSelection from "./listing-creation-photo-selection";
import ListingAmenities from "./listing-creation-amenities";
import ListingCreationPricing from "./listing-creation-pricing";
import ListingCreationDeposit from "./listing-creation-deposit";
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
  approvalStatus?: string;
  amenities?: string[];
  washerInUnit?: boolean;
  cityView?: boolean;
  dishwasher?: boolean;
}

// Nullable ListingImage type for photo support
export interface NullableListingImage {
  id: string | null;
  url: string | null;
  listingId: string | null;
  category: string | null;
  rank: number | null;
}

import { DraftListingProps } from './page';

export default function AddPropertyclient({ initialDraftListing }: DraftListingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { user } = useUser();
  
  // Check if user is admin
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isAdmin = userRole === 'admin';
  
  // State to track current step and animation direction
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Track if user came from review page
  const [cameFromReview, setCameFromReview] = useState<boolean>(false);
  
  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  
  // State to track if we're loading a draft
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(!!draftId);
  
  // State to track if admin skip buttons are hidden
  const [adminSkipButtonsHidden, setAdminSkipButtonsHidden] = useState<boolean>(false);
  
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
  furnished: true
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
    { name: "Location", position: 1 },
    { name: "Rooms", position: 2 },
    { name: "Basics", position: 3 },
    { name: "Photos", position: 4 },
    { name: "Featured Photos", position: 5 },
    { name: "Amenities", position: 6 },
    { name: "Pricing", position: 7 },
    { name: "Deposits", position: 8 },
    { name: "Review", position: 9 },
    { name: "Success", position: 10 },
  ];


  // Handler for Save & Exit button
  const handleSaveExit = async () => {
    try {
      // Create final array of photos
      let listingImagesFinal = [...listingPhotos].map(photo => ({
        ...photo,
        rank: null
      }));

      // Update ranks for selected photos if any
      if (selectedPhotos.length > 0) {
        for (let i = 0; i < selectedPhotos.length; i++) {
          const selectedPhoto = selectedPhotos[i];
          const photoToUpdate = listingImagesFinal.find(p => p.url === selectedPhoto.url);
          if (photoToUpdate) {
            photoToUpdate.rank = i + 1;
          }
        }
      }

      // Prepare listing data with selected photos
      const draftListing = {
        title: listingBasics.title || "",
        description: listingBasics.description || "",
        status: "draft", // Mark as draft
        listingImages: listingImagesFinal.map((photo, index) => ({
          url: photo.url,
          rank: photo.rank || index
        })),
        // Listing location fields
        locationString: listingLocation.locationString || "",
        latitude: listingLocation.latitude || 0,
        longitude: listingLocation.longitude || 0,
        city: listingLocation.city || "",
        state: listingLocation.state || "",
        streetAddress1: listingLocation.streetAddress1 || "",
        streetAddress2: listingLocation.streetAddress2 || "",
        postalCode: listingLocation.postalCode || "",
        // Required fields with defaults if needed
        roomCount: listingRooms.bedrooms || 1,
        bathroomCount: listingRooms.bathrooms || 1,
        guestCount: listingRooms.bedrooms || 1,
        squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet) : 0,
        depositSize: listingPricing.deposit ? Number(listingPricing.deposit) : 0,
        shortestLeaseLength: listingPricing.shortestStay || 1,
        longestLeaseLength: listingPricing.longestStay || 12,
        shortestLeasePrice: listingPricing.shortTermRent ? Number(listingPricing.shortTermRent) : 0,
        longestLeasePrice: listingPricing.longTermRent ? Number(listingPricing.longTermRent) : 0,
        requireBackgroundCheck: true,
        category: listingHighlights.category || "Single Family",
        petsAllowed: listingHighlights.petsAllowed || false,
        furnished: listingHighlights.furnished || false,
      };
      
      // Process amenities from the array to set the proper boolean values
      if (listingAmenities && listingAmenities.length > 0) {
        listingAmenities.forEach(amenity => {
          // @ts-ignore - Dynamic property assignment
          draftListing[amenity] = true;
        });
      }
      
      // Update the listing status in the local state
      setListing(prev => ({
        ...prev,
        status: "draft"
      }));
      
      // Send data to the server
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftListing),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save listing draft');
      }
      
      // Revalidate the host dashboard to refresh listing data
      await revalidateHostDashboard();
      
      // Show success state instead of immediate redirect, similar to submit flow
      setCurrentStep(10); // Move to success step
      setSlideDirection('right');
      setAnimationKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error saving listing draft:', error);
      alert(`Error saving your listing: ${(error as Error).message}`);
    }
  };

  // Validation functions for each step
  const validateHighlights = (): string[] => {
    const errors: string[] = [];
    
    if (!listingHighlights.category) {
      errors.push("You must select a property type");
    }
    
    if (listingHighlights.furnished === null) {
      errors.push("You must select a furnishing option");
    }
    
    if (listingHighlights.petsAllowed === null) {
      errors.push("You must specify if pets are allowed");
    }
    
    return errors;
  };
  
  const validateLocation = (): string[] => {
    const errors: string[] = [];
    
    if (!listingLocation.streetAddress1) {
      errors.push("Street address is required");
    }
    
    if (!listingLocation.city) {
      errors.push("City is required");
    }
    
    if (!listingLocation.state) {
      errors.push("State is required");
    }
    
    if (!listingLocation.postalCode) {
      errors.push("Postal code is required");
    }
    
    return errors;
  };
  
  const validateRooms = (): string[] => {
    const errors: string[] = [];
    
    if (!listingRooms.bedrooms || listingRooms.bedrooms < 1) {
      errors.push("Number of bedrooms is required");
    }
    
    if (!listingRooms.bathrooms || listingRooms.bathrooms < 1) {
      errors.push("Number of bathrooms is required");
    }
    
    if (!listingRooms.squareFeet) {
      errors.push("Square footage is required");
    }
    
    return errors;
  };
  
  const validateBasics = (): string[] => {
    const errors: string[] = [];
    
    if (!listingBasics.title) {
      errors.push("Title is required");
    } else if (listingBasics.title.length < 5) {
      errors.push("Title must be at least 5 characters");
    }
    
    if (!listingBasics.description) {
      errors.push("Description is required");
    } else if (listingBasics.description.length < 20) {
      errors.push("Description must be at least 20 characters");
    }
    
    return errors;
  };
  
  const validatePhotos = (): string[] => {
    const errors: string[] = [];
    
    if (!listingPhotos || listingPhotos.length === 0) {
      errors.push("You must upload at least 4 photos");
    } else if (listingPhotos.length < 4) {
      errors.push(`You need to upload ${4 - listingPhotos.length} more photo${listingPhotos.length === 3 ? '' : 's'} (minimum 4 required)`);
    }
    
    return errors;
  };
  
  const validateFeaturedPhotos = (): string[] => {
    const errors: string[] = [];
    if (!selectedPhotos || selectedPhotos.length !== 4) {
      errors.push("You must select exactly four featured photos.");
    }
    return errors;
  };
  
  const validateAmenities = (): string[] => {
    const errors: string[] = [];
    // Laundry options required
    const laundryOptions = ['washerInUnit', 'washerInComplex', 'washerNotAvailable'];
    const selectedLaundry = listingAmenities?.filter(a => laundryOptions.includes(a)) || [];
    if (selectedLaundry.length !== 1) {
      errors.push("You must select one laundry option (In Unit, In Complex, or No Laundry)");
    }
    return errors;
  };
  
  const validatePricing = (): string[] => {
    const errors: string[] = [];
    
    if (!listingPricing.shortTermRent) {
      errors.push("Short term rent price is required");
    }
    
    if (!listingPricing.longTermRent) {
      errors.push("Long term rent price is required");
    }
    
    return errors;
  };
  
  const validateDeposits = (): string[] => {
    const errors: string[] = [];
    
    if (!listingPricing.deposit) {
      errors.push("Security deposit amount is required");
    }
    
    return errors;
  };
  
  // Validate the current step
  const validateCurrentStep = (): string[] => {
    switch (currentStep) {
      case 0:
        return validateHighlights();
      case 1:
        return validateLocation();
      case 2:
        return validateRooms();
      case 3:
        return validateBasics();
      case 4:
        return validatePhotos();
      case 5:
        return validateFeaturedPhotos();
      case 6:
        return validateAmenities();
      case 7:
        return validatePricing();
      case 8:
        return validateDeposits();
      default:
        return [];
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Validate the current step
      const errors = validateCurrentStep();
      
      if (errors.length > 0) {
        // Update errors state and show error message
        setValidationErrors({
          ...validationErrors,
          [currentStep]: errors
        });
        
        // We'll display the errors in the UI, so just return here
        return; // Don't proceed if there are errors
      }
      
      // Clear any existing validation errors for this step
      if (validationErrors[currentStep]) {
        const newValidationErrors = { ...validationErrors };
        delete newValidationErrors[currentStep];
        setValidationErrors(newValidationErrors);
      }
      
      // If coming from review, validate all steps again before returning to review
      if (cameFromReview) {
        // Run current step validation first
        const currStepValidation = validateCurrentStep();
        if (currStepValidation.length > 0) {
          setValidationErrors({
            ...validationErrors,
            [currentStep]: currStepValidation
          });
          return;
        }
        
        // Now check all steps to make sure everything is valid before returning to review
        const allValid = validateAllSteps();
        if (!allValid) {
          // The validateAllSteps function will handle navigation to the first step with errors
          return;
        }
        
        setSlideDirection('right'); // Slide from right to left (next)
        setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
        setCurrentStep(9); // Go to review step
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
    // Store the current validation state before navigating away from review
    // This ensures we remember errors from other sections
    const currentErrors = { ...validationErrors };
    
    setSlideDirection('left'); // Slide from left to right (back)
    setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation to rerun
    setCurrentStep(stepIndex);
    setCameFromReview(true); // Set the flag to indicate we came from review
    
    // Scroll the whole page to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Admin skip handlers - navigate without validation
  const handleAdminSkipNext = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('right');
      setAnimationKey(prevKey => prevKey + 1);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleAdminSkipBack = () => {
    if (currentStep > 0) {
      setSlideDirection('left');
      setAnimationKey(prevKey => prevKey + 1);
      setCurrentStep(currentStep - 1);
      setCameFromReview(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Component to display validation errors
  const ValidationErrors = ({ errors, className }: { errors: string[], className?: string }) => {
    if (!errors || errors.length === 0) return null;
    
    return (
      <Alert variant="destructive" className={className || "mb-6"}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 mt-2">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };
  
  // Validate all steps before submission
  const validateAllSteps = () => {
    const allErrors: Record<number, string[]> = {};
    
    // Validate each step
    const highlightErrors = validateHighlights();
    if (highlightErrors.length > 0) allErrors[0] = highlightErrors;
    
    const locationErrors = validateLocation();
    if (locationErrors.length > 0) allErrors[1] = locationErrors;
    
    const roomsErrors = validateRooms();
    if (roomsErrors.length > 0) allErrors[2] = roomsErrors;
    
    const basicsErrors = validateBasics();
    if (basicsErrors.length > 0) allErrors[3] = basicsErrors;
    
    const photosErrors = validatePhotos();
    if (photosErrors.length > 0) allErrors[4] = photosErrors;
    
    const featuredPhotosErrors = validateFeaturedPhotos();
    if (featuredPhotosErrors.length > 0) allErrors[5] = featuredPhotosErrors;
    
    const amenitiesErrors = validateAmenities();
    if (amenitiesErrors.length > 0) allErrors[6] = amenitiesErrors;
    
    const pricingErrors = validatePricing();
    if (pricingErrors.length > 0) allErrors[7] = pricingErrors;
    
    const depositErrors = validateDeposits();
    if (depositErrors.length > 0) allErrors[8] = depositErrors;
    
    setValidationErrors(allErrors);
    
    // If there are errors, navigate to the first step with errors
    if (Object.keys(allErrors).length > 0) {
      const firstErrorStep = Object.keys(allErrors)
        .map(Number)
        .sort((a, b) => a - b)[0];
      
      if (firstErrorStep !== undefined && firstErrorStep !== currentStep) {
        setCurrentStep(firstErrorStep);
        setSlideDirection('left'); // Slide from left to right (back)
        setAnimationKey(prevKey => prevKey + 1); // Increment key to force animation
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      return false;
    }
    
    // Return true if there are no errors
    return true;
  };
  
  // Handle form submission
  const handleSubmitListing = async () => {
    if (validateAllSteps()) {

      // Create final array of photos and sort them by rank
      let listingImagesFinal = [...listingPhotos].map(photo => ({
        ...photo,
        rank: null // Initialize all ranks to null
      }));

      // Update ranks for selected photos
      for (let i = 0; i < selectedPhotos.length; i++) {
        const selectedPhoto = selectedPhotos[i];
        const photoToUpdate = listingImagesFinal.find(p => p.url === selectedPhoto.url);
        if (photoToUpdate) {
          photoToUpdate.rank = i + 1; // Assign ranks 1, 2, 3, 4
        }
      }

      // Sort photos: ranked photos first (in ascending order), then unranked photos
      listingImagesFinal.sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      });

      let listingImagesSorted = listingImagesFinal.sort()

      try {
        // Prepare listing data with selected photos
        const finalListing = {
          title: listingBasics.title,
          description: listingBasics.description,
          status: "available", // Default status for new listings
          // Use the correct property name that matches the Prisma schema
          listingImages: listingImagesSorted.map((photo, index) => ({
            url: photo.url,
            rank: index // Use the order of selectedPhotos for ranking
          })),
          // Listing location fields
          locationString: listingLocation.locationString,
          latitude: listingLocation.latitude,
          longitude: listingLocation.longitude,
          city: listingLocation.city,
          state: listingLocation.state,
          streetAddress1: listingLocation.streetAddress1,
          streetAddress2: listingLocation.streetAddress2,
          postalCode: listingLocation.postalCode,
          // Required fields with defaults if needed
          roomCount: listingRooms.bedrooms || 1,
          bathroomCount: listingRooms.bathrooms || 1,
          guestCount: listingRooms.bedrooms || 1,
          squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet) : 0,
          depositSize: listingPricing.deposit ? Number(listingPricing.deposit) : 0,
          shortestLeaseLength: listingPricing.shortestStay || 1,
          longestLeaseLength: listingPricing.longestStay || 12,
          shortestLeasePrice: listingPricing.shortTermRent ? Number(listingPricing.shortTermRent) : 0,
          longestLeasePrice: listingPricing.longTermRent ? Number(listingPricing.longTermRent) : 0,
          requireBackgroundCheck: true,
        };

        
        // Process amenities from the array to set the proper boolean values
        if (listingAmenities && listingAmenities.length > 0) {
          listingAmenities.forEach(amenity => {
            // @ts-ignore - Dynamic property assignment
            finalListing[amenity] = true;
          });
        }
        
        // Send data to the server
        const response = await fetch('/api/listings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalListing),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create listing');
        }
        
        // Revalidate the host dashboard to refresh listing data
        await revalidateHostDashboard();
        
        // Show success state instead of immediate redirect
        setCurrentStep(10); // Move to a new success step
        setSlideDirection('right');
        setAnimationKey(prevKey => prevKey + 1);
      } catch (error) {
        console.error('Error creating listing:', error);
        
        // Show error at the bottom of the review page
        setValidationErrors({
          ...validationErrors,
          [9]: [(error as Error).message || 'An error occurred while creating the listing. Please try again.']
        });
      }
    } else {
      // There are validation errors
      
      // Find the first step with errors and navigate to it
      const firstErrorStep = Object.keys(validationErrors)
        .map(Number)
        .sort((a, b) => a - b)[0];
      
      if (firstErrorStep !== undefined) {
        setCurrentStep(firstErrorStep);
      }
    }
  };

  // Effect to load draft if draftId is provided
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          setIsLoadingDraft(true);
          const draftListing = await getListingById(draftId);
          
          if (draftListing) {
            // Update the main listing state
            setListing(draftListing);
            
            // Update all the component states with the loaded data
            if (draftListing.category) {
              setListingHighlights({
                category: draftListing.category,
                petsAllowed: draftListing.petsAllowed || false,
                furnished: draftListing.furnished || false
              });
            }
            
            setListingLocation({
              locationString: draftListing.locationString || null,
              latitude: draftListing.latitude || null,
              longitude: draftListing.longitude || null,
              city: draftListing.city || null,
              state: draftListing.state || null,
              streetAddress1: draftListing.streetAddress1 || null,
              streetAddress2: draftListing.streetAddress2 || null,
              postalCode: draftListing.postalCode || null,
              country: "United States"
            });
            
            setListingRooms({
              bedrooms: draftListing.roomCount || 1,
              bathrooms: draftListing.bathroomCount || 1,
              squareFeet: draftListing.squareFootage ? draftListing.squareFootage.toString() : ""
            });
            
            setListingBasics({
              title: draftListing.title || "",
              description: draftListing.description || ""
            });
            
            // Set listing photos
            if (draftListing.listingImages && draftListing.listingImages.length > 0) {
              const photos = draftListing.listingImages.map(img => ({
                id: img.id || null,
                url: img.url || null,
                listingId: img.listingId || null,
                category: img.category || null,
                rank: img.rank || null
              }));
              
              setListingPhotos(photos);
              
              // Set featured photos (those with rank 1-4)
              const featuredPhotos = photos
                .filter(p => p.rank && p.rank >= 1 && p.rank <= 4)
                .sort((a, b) => (a.rank || 0) - (b.rank || 0));
                
              if (featuredPhotos.length > 0) {
                setSelectedPhotos(featuredPhotos);
              }
            }
            
            // Set amenities (all properties that are true)
            const amenities: string[] = [];
            Object.entries(draftListing).forEach(([key, value]) => {
              if (value === true && 
                  key !== 'furnished' && 
                  key !== 'petsAllowed' && 
                  key !== 'isApproved') {
                amenities.push(key);
              }
            });
            
            if (amenities.length > 0) {
              setListingAmenities(amenities);
            }
            
            // Set pricing
            setListingPricing({
              shortestStay: draftListing.shortestLeaseLength || 1,
              longestStay: draftListing.longestLeaseLength || 12,
              shortTermRent: draftListing.shortestLeasePrice ? draftListing.shortestLeasePrice.toString() : "",
              longTermRent: draftListing.longestLeasePrice ? draftListing.longestLeasePrice.toString() : "",
              deposit: draftListing.depositSize ? draftListing.depositSize.toString() : "",
              petDeposit: "",
              petRent: "",
              tailoredPricing: draftListing.shortestLeasePrice !== draftListing.longestLeasePrice
            });
          }
        } catch (error) {
          console.error("Error loading draft listing:", error);
        } finally {
          setIsLoadingDraft(false);
        }
      }
    };
    
    if (draftId) {
      loadDraft();
    }
  }, [draftId]);

  // Effect to sync subset states back to main listing state
  useEffect(() => {
    setListing(prevListing => ({
      ...prevListing,
      // Sync highlights
      category: listingHighlights.category,
      petsAllowed: listingHighlights.petsAllowed,
      furnished: listingHighlights.furnished,
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
          <>
            {validationErrors[0] && <ValidationErrors errors={validationErrors[0]} className="mb-6" />}
            <ListingUploadHighlights
              listingHighlights={listingHighlights}
              setListingHighlights={setListingHighlights}
            />
            {validationErrors[0] && <ValidationErrors errors={validationErrors[0]} className="mt-6" />}
          </>
        );
      case 1:
        return (
          <LocationForm
            listingLocation={listingLocation}
            setListingLocation={setListingLocation}
            validationErrors={validationErrors[1]}
          />
        );
      case 2:
        return (
          <>
            {validationErrors[2] && <ValidationErrors errors={validationErrors[2]} className="mb-6" />}
            <Rooms
              bedrooms={listingRooms.bedrooms}
              bathrooms={listingRooms.bathrooms}
              squareFeet={listingRooms.squareFeet}
              onBedroomsChange={value => setListingRooms(prev => ({ ...prev, bedrooms: value }))}
              onBathroomsChange={value => setListingRooms(prev => ({ ...prev, bathrooms: value }))}
              onSquareFeetChange={value => setListingRooms(prev => ({ ...prev, squareFeet: value }))}
            />
            {validationErrors[2] && <ValidationErrors errors={validationErrors[2]} className="mt-6" />}
          </>
        );
      case 3:
        return (
          <>
            {validationErrors[3] && <ValidationErrors errors={validationErrors[3]} className="mb-6" />}
            <ListingBasics
              title={listingBasics.title}
              setTitle={value => setListingBasics(prev => ({ ...prev, title: value }))}
              description={listingBasics.description}
              setDescription={value => setListingBasics(prev => ({ ...prev, description: value }))}
            />
            {validationErrors[3] && <ValidationErrors errors={validationErrors[3]} className="mt-6" />}
          </>
        );
      case 4:
        // Custom photo handler to update validation in real-time
        const handlePhotosUpdate = (newPhotos: NullableListingImage[]) => {
          // Update photos state first
          setListingPhotos(newPhotos);
          
          // Use the new photos array directly for validation instead of calling validatePhotos()
          // which would use the not-yet-updated state value
          let photoErrors: string[] = [];
          
          if (!newPhotos || newPhotos.length === 0) {
            photoErrors.push("You must upload at least 4 photos");
          } else if (newPhotos.length < 4) {
            photoErrors.push(`You need to upload ${4 - newPhotos.length} more photo${newPhotos.length === 3 ? '' : 's'} (minimum 4 required)`);
          }
          
          if (photoErrors.length > 0) {
            setValidationErrors({
              ...validationErrors,
              [4]: photoErrors
            });
          } else if (validationErrors[4]) {
            // Clear errors if validation passes
            const newValidationErrors = { ...validationErrors };
            delete newValidationErrors[4];
            setValidationErrors(newValidationErrors);
          }
        };
        
        return (
          <>
            {validationErrors[4] && <ValidationErrors errors={validationErrors[4]} className="mb-6" />}
            <ListingPhotos 
              listingPhotos={listingPhotos} 
              setListingPhotos={handlePhotosUpdate} 
            />
            {validationErrors[4] && <ValidationErrors errors={validationErrors[4]} className="mt-6" />}
          </>
        );
      case 5:
        return (
          <>
            {validationErrors[5] && <ValidationErrors errors={validationErrors[5]} className="mb-6" />}
            <ListingPhotoSelection
              listingPhotos={listingPhotos}
              selectedPhotos={selectedPhotos}
              setSelectedPhotos={setSelectedPhotos}
            />
            {validationErrors[5] && <ValidationErrors errors={validationErrors[5]} className="mt-6" />}
          </>
        );
      case 6:
        return (
          <>
            {validationErrors[6] && <ValidationErrors errors={validationErrors[6]} className="mb-6" />}
            <ListingAmenities
              value={listingAmenities}
              onChange={setListingAmenities}
            />
            {validationErrors[6] && <ValidationErrors errors={validationErrors[6]} className="mt-6" />}
          </>
        );
      case 7:
        return (
          <>
            {validationErrors[7] && <ValidationErrors errors={validationErrors[7]} className="mb-6" />}
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
              onTailoredPricingChange={(value) => {
  if (!value) {
    // Going from ON to OFF: flatten both rents to the highest
    const shortRent = parseFloat(listingPricing.shortTermRent) || 0;
    const longRent = parseFloat(listingPricing.longTermRent) || 0;
    const maxRent = Math.max(shortRent, longRent).toString();
    setListingPricing(prev => ({
      ...prev,
      tailoredPricing: value,
      shortTermRent: maxRent,
      longTermRent: maxRent
    }));
  } else {
    setListingPricing(prev => ({ ...prev, tailoredPricing: value }));
  }
}}
              onContinue={handleNext}
            />
            {validationErrors[7] && <ValidationErrors errors={validationErrors[7]} className="mt-6" />}
          </>
        );
      case 8:
        return (
          <>
            {validationErrors[8] && <ValidationErrors errors={validationErrors[8]} className="mb-6" />}
            <ListingCreationDeposit
              deposit={listingPricing.deposit}
              petDeposit={listingPricing.petDeposit}
              petRent={listingPricing.petRent}
              onDepositChange={(value) => setListingPricing(prev => ({ ...prev, deposit: value }))}
              onPetDepositChange={(value) => setListingPricing(prev => ({ ...prev, petDeposit: value }))}
              onPetRentChange={(value) => setListingPricing(prev => ({ ...prev, petRent: value }))}
            />
            {validationErrors[8] && <ValidationErrors errors={validationErrors[8]} className="mt-6" />}
          </>
        );
      case 9:
        // Combine all errors for the review page
        const allValidationErrors = Object.values(validationErrors).flat();
        
        return (
          <>
            {allValidationErrors.length > 0 && (
              <ValidationErrors 
                errors={[
                  "Please fix the following errors before submitting your listing:",
                  ...allValidationErrors
                ]} 
                className="mb-6" 
              />
            )}
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
            {allValidationErrors.length > 0 && (
              <ValidationErrors 
                errors={[
                  "Please fix the following errors before submitting your listing:",
                  ...allValidationErrors
                ]} 
                className="mt-6" 
              />
            )}
          </>
        );
      case 10:
        // Success page - determine if from Save & Exit or final submission
        const isSaveAndExit = currentStep === 10 && listing.status === "draft";
        
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-6">
              {isSaveAndExit ? "Listing Saved Successfully!" : "Listing Created Successfully!"}
            </h2>
            <p className="text-lg mb-8 max-w-lg">
              {isSaveAndExit 
                ? "Your listing has been saved as a draft. You can come back later to finish and submit it for approval."
                : "Our team will review your listing for approval in the next 24 hours. You'll receive a notification once your listing is approved."
              }
            </p>
            <Button 
              className="w-[200px] h-[48px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
              onClick={() => router.push('/platform/host-dashboard')}
            >
              Go to Host Dashboard
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Loading state for draft
  if (isLoadingDraft) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading your draft listing...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background flex flex-row justify-center w-full ">
      <div className="bg-background overflow-hidden w-full max-w-[1920px] relative pb-32">
        {/* Progress bar component - hidden on success page */}
        {currentStep !== 10 && (
          <ProgressBar 
            currentStep={currentStep} 
            steps={steps}
          />
        )}

        {/* Main content with slide animation */}
        <div className="mx-auto w-full max-w-[891px] mb-24 ">
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
        {currentStep !== 10 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 z-10">
            <Separator className="w-full" />
            {isAdmin ? (
              /* Admin footer with skip buttons */
              <div className="mx-auto w-full max-w-[891px] py-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2">
                    <Button 
                      className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                    >
                      Back
                    </Button>
                    {!adminSkipButtonsHidden && (
                      <Button 
                        className="w-[80px] h-[42px] bg-orange-500 hover:bg-orange-600 rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-sm"
                        onClick={handleAdminSkipBack}
                        disabled={currentStep === 0}
                      >
                        Skip ←
                      </Button>
                    )}
                  </div>
                  <Button 
                    className="w-[106px] h-[42px] bg-background rounded-[5px] border border-solid border-[#0000004c] font-['Montserrat',Helvetica] font-medium text-[#3f3f3f] text-sm"
                    onClick={handleSaveExit}
                  >
                    Save & Exit
                  </Button>
                  <div className="flex gap-2">
                    {!adminSkipButtonsHidden && (
                      <Button 
                        className="w-[80px] h-[42px] bg-orange-500 hover:bg-orange-600 rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-sm"
                        onClick={handleAdminSkipNext}
                        disabled={currentStep >= steps.length - 1}
                      >
                        Skip →
                      </Button>
                    )}
                    <Button 
                      className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
                      onClick={currentStep === 9 ? handleSubmitListing : handleNext}
                      disabled={currentStep === 9 && false}
                    >
                      {currentStep === 9 ? 'Submit Listing' : 
                       cameFromReview ? 'Review' : 'Next'}
                    </Button>
                  </div>
                </div>
                <div className="text-center">
                  <span 
                    className={`text-xs font-medium cursor-pointer ${adminSkipButtonsHidden ? 'text-gray-500' : 'text-orange-600'}`}
                    onClick={() => setAdminSkipButtonsHidden(!adminSkipButtonsHidden)}
                  >
                    Admin Mode: Skip buttons bypass validation (click to {adminSkipButtonsHidden ? 'show' : 'hide'})
                  </span>
                </div>
              </div>
            ) : (
              /* Regular user footer */
              <div className="flex justify-between items-center mx-auto w-full max-w-[891px] py-4">
                <Button 
                  className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  Back
                </Button>
                <Button 
                  className="w-[106px] h-[42px] bg-background rounded-[5px] border border-solid border-[#0000004c] font-['Montserrat',Helvetica] font-medium text-[#3f3f3f] text-sm"
                  onClick={handleSaveExit}
                >
                  Save & Exit
                </Button>
                <Button 
                  className="w-[119px] h-[42px] bg-[#4f4f4f] rounded-[5px] shadow-[0px_4px_4px_#00000040] font-['Montserrat',Helvetica] font-semibold text-white text-base"
                  onClick={currentStep === 9 ? handleSubmitListing : handleNext}
                  disabled={currentStep === 9 && false} // Disabled set to false for review step to submit the listing
                >
                  {currentStep === 9 ? 'Submit Listing' : 
                   cameFromReview ? 'Review' : 'Next'}
                </Button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </main>
  );
};
