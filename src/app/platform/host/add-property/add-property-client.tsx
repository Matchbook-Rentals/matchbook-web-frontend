'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ProgressBar, { StepInfo } from "./progress-bar";
import { revalidateHostDashboard } from "../_actions";
import LocationForm from "./location-form";
import LocationInput from "./location-input";
import AddressConfirmation from "./address-confirmation";
import ListingUploadHighlights from "./listing-creation-highlights";
import { Rooms } from "./listing-creation-rooms";
import { ListingBasics } from "./listing-creation-basics";
import { ListingPhotos } from "./listing-creation-photos-upload";
import ListingPhotoSelection from "./listing-creation-photo-selection";
import ListingAmenities from "./listing-creation-amenities";
import ListingCreationPricing, { MonthlyPricing } from "./listing-creation-pricing";
import ListingCreationVerifyPricing from "./listing-creation-verify-pricing";
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
  reservationDeposit: number | null;
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
    reservationDeposit: null,
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
  monthlyPricing: [] as MonthlyPricing[],
  includeUtilities: false,
  utilitiesUpToMonths: 1,
  varyPricingByLength: true,
  basePrice: "",
  deposit: "",
  reservationDeposit: "",
  petDeposit: "",
  petRent: ""
});

// Initialize monthly pricing when component mounts or stay lengths change
React.useEffect(() => {
  const newPricing: MonthlyPricing[] = [];
  for (let i = listingPricing.shortestStay; i <= listingPricing.longestStay; i++) {
    // Try to find existing pricing for this month
    const existing = listingPricing.monthlyPricing.find(p => p.months === i);
    if (existing) {
      // Update utilities based on current settings and price if not varying by length
      newPricing.push({
        ...existing,
        price: !listingPricing.varyPricingByLength ? listingPricing.basePrice : existing.price,
        utilitiesIncluded: listingPricing.includeUtilities && i <= listingPricing.utilitiesUpToMonths
      });
    } else {
      // Create new entry with default values
      newPricing.push({
        months: i,
        price: !listingPricing.varyPricingByLength ? listingPricing.basePrice : '',
        utilitiesIncluded: listingPricing.includeUtilities && i <= listingPricing.utilitiesUpToMonths
      });
    }
  }
  setListingPricing(prev => ({ ...prev, monthlyPricing: newPricing }));
}, [listingPricing.shortestStay, listingPricing.longestStay, listingPricing.includeUtilities, listingPricing.utilitiesUpToMonths, listingPricing.varyPricingByLength, listingPricing.basePrice]);

// Step 2: Rooms
const [listingRooms, setListingRooms] = useState({
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: ""
});

// Reusable text styles
const questionTextStyles = "font-text-label-small-medium text-[#484a54] text-[14px]";
const questionSubTextStyles = "font-['Poppins'] text-xs font-normal text-[#838799]";

// Step 3: Basics
const [listingBasics, setListingBasics] = useState({
  title: "",
  description: ""
});

// Define steps
  const steps: StepInfo[] = [
    { name: "Highlights", position: 0 },
    { name: "Location Input", position: 1 },
    { name: "Address Confirmation", position: 2 },
    { name: "Rooms", position: 3 },
    { name: "Basics", position: 4 },
    { name: "Photos", position: 5 },
    { name: "Featured Photos", position: 6 },
    { name: "Amenities", position: 7 },
    { name: "Pricing", position: 8 },
    { name: "Verify Pricing", position: 9 },
    { name: "Deposits", position: 10 },
    { name: "Review", position: 11 },
    { name: "Success", position: 12 },
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

      // Prepare draft data
      const draftData = {
        id: draftId || undefined, // Include ID if updating existing draft
        title: listingBasics.title || null,
        description: listingBasics.description || null,
        status: "draft",
        // Listing location fields
        locationString: listingLocation.locationString || null,
        latitude: listingLocation.latitude || null,
        longitude: listingLocation.longitude || null,
        city: listingLocation.city || null,
        state: listingLocation.state || null,
        streetAddress1: listingLocation.streetAddress1 || null,
        streetAddress2: listingLocation.streetAddress2 || null,
        postalCode: listingLocation.postalCode || null,
        // Room details
        roomCount: listingRooms.bedrooms || null,
        bathroomCount: listingRooms.bathrooms || null,
        guestCount: listingRooms.bedrooms || null,
        squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet) : null,
        // Pricing and deposits
        depositSize: listingPricing.deposit ? Number(listingPricing.deposit) : null,
        petDeposit: listingPricing.petDeposit ? Number(listingPricing.petDeposit) : null,
        petRent: listingPricing.petRent ? Number(listingPricing.petRent) : null,
        reservationDeposit: listingPricing.reservationDeposit ? Number(listingPricing.reservationDeposit) : null,
        shortestLeaseLength: listingPricing.shortestStay || null,
        longestLeaseLength: listingPricing.longestStay || null,
        shortestLeasePrice: null, // Deprecated
        longestLeasePrice: null, // Deprecated
        requireBackgroundCheck: true,
        // Highlights
        category: listingHighlights.category || null,
        petsAllowed: listingHighlights.petsAllowed || null,
        furnished: listingHighlights.furnished || null,
        // Store images and pricing separately for later
        listingImages: listingImagesFinal.map((photo, index) => ({
          url: photo.url,
          rank: photo.rank || index
        })),
        monthlyPricing: listingPricing.monthlyPricing.map(p => ({
          months: p.months,
          price: p.price ? Number(p.price) : 0,
          utilitiesIncluded: p.utilitiesIncluded
        }))
      };
      
      // Process amenities from the array to set the proper boolean values
      if (listingAmenities && listingAmenities.length > 0) {
        listingAmenities.forEach(amenity => {
          // @ts-ignore - Dynamic property assignment
          draftData[amenity] = true;
        });
      }
      
      // Send data to the draft API
      const response = await fetch('/api/listings/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save listing draft');
      }
      
      const savedDraft = await response.json();
      
      // Update the URL with the draft ID if it's a new draft
      if (!draftId && savedDraft.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('draftId', savedDraft.id);
        window.history.replaceState({}, '', newUrl.toString());
      }
      
      // Show success state instead of immediate redirect, similar to submit flow
      setCurrentStep(11); // Move to success step
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
    
    // Step 7 validation - check basic settings and base price if not varying
    if (listingPricing.shortestStay < 1 || listingPricing.shortestStay > 12) {
      errors.push("Shortest stay must be between 1 and 12 months");
    }
    
    if (listingPricing.longestStay < 1 || listingPricing.longestStay > 12) {
      errors.push("Longest stay must be between 1 and 12 months");
    }
    
    if (listingPricing.shortestStay >= listingPricing.longestStay) {
      errors.push("Shortest stay must be less than longest stay");
    }
    
    if (listingPricing.includeUtilities && listingPricing.utilitiesUpToMonths < listingPricing.shortestStay) {
      errors.push("Utilities inclusion must be at least the shortest stay length");
    }
    
    // If not varying pricing by length, validate base price
    if (!listingPricing.varyPricingByLength) {
      if (!listingPricing.basePrice || listingPricing.basePrice === '') {
        errors.push("Please enter a monthly rent price");
      } else {
        const price = parseFloat(listingPricing.basePrice);
        if (isNaN(price) || price <= 0) {
          errors.push("Monthly rent price must be a valid positive number");
        }
      }
    }
    
    return errors;
  };
  
  const validateVerifyPricing = (): string[] => {
    const errors: string[] = [];
    
    // Step 8 validation - validate that all prices are filled and valid
    const missingPrices = listingPricing.monthlyPricing.filter(p => !p.price || p.price === '');
    if (missingPrices.length > 0) {
      errors.push(`Please set prices for all ${listingPricing.monthlyPricing.length} lease lengths`);
    }
    
    // Check that prices are valid numbers
    const invalidPrices = listingPricing.monthlyPricing.filter(p => {
      const price = parseFloat(p.price);
      return p.price && (isNaN(price) || price <= 0);
    });
    if (invalidPrices.length > 0) {
      errors.push("All prices must be valid positive numbers");
    }
    
    return errors;
  };

  const validateDeposits = (): string[] => {
    const errors: string[] = [];
    
    // All deposit fields are optional, no validation required
    
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
        return validateLocation(); // Address confirmation uses same validation as location input
      case 3:
        return validateRooms();
      case 4:
        return validateBasics();
      case 5:
        return validatePhotos();
      case 6:
        return validateFeaturedPhotos();
      case 7:
        return validateAmenities();
      case 8:
        return validatePricing();
      case 9:
        return validateVerifyPricing();
      case 10:
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
        setCurrentStep(11); // Go to review step
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
    // Location validation applies to both steps 1 and 2 (input and confirmation)
    if (locationErrors.length > 0) {
      allErrors[1] = locationErrors;
      allErrors[2] = locationErrors;
    }
    
    const roomsErrors = validateRooms();
    if (roomsErrors.length > 0) allErrors[3] = roomsErrors;
    
    const basicsErrors = validateBasics();
    if (basicsErrors.length > 0) allErrors[4] = basicsErrors;
    
    const photosErrors = validatePhotos();
    if (photosErrors.length > 0) allErrors[5] = photosErrors;
    
    const featuredPhotosErrors = validateFeaturedPhotos();
    if (featuredPhotosErrors.length > 0) allErrors[6] = featuredPhotosErrors;
    
    const amenitiesErrors = validateAmenities();
    if (amenitiesErrors.length > 0) allErrors[7] = amenitiesErrors;
    
    const pricingErrors = validatePricing();
    if (pricingErrors.length > 0) allErrors[8] = pricingErrors;
    
    const verifyPricingErrors = validateVerifyPricing();
    if (verifyPricingErrors.length > 0) allErrors[9] = verifyPricingErrors;
    
    const depositErrors = validateDeposits();
    if (depositErrors.length > 0) allErrors[10] = depositErrors;
    
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
          reservationDeposit: listingPricing.reservationDeposit ? Number(listingPricing.reservationDeposit) : 0,
          shortestLeaseLength: listingPricing.shortestStay || 1,
          longestLeaseLength: listingPricing.longestStay || 12,
          shortestLeasePrice: 0, // Deprecated - will use monthlyPricing instead
          longestLeasePrice: 0, // Deprecated - will use monthlyPricing instead
          monthlyPricing: listingPricing.monthlyPricing.map(p => ({
            months: p.months,
            price: p.price ? Number(p.price) : 0,
            utilitiesIncluded: p.utilitiesIncluded
          })),
          requireBackgroundCheck: true,
        };

        
        // Process amenities from the array to set the proper boolean values
        if (listingAmenities && listingAmenities.length > 0) {
          listingAmenities.forEach(amenity => {
            // @ts-ignore - Dynamic property assignment
            finalListing[amenity] = true;
          });
        }
        
        // If we have a draftId, submit the draft to create a listing
        // Otherwise, create a new listing directly
        const endpoint = draftId ? '/api/listings/draft/submit' : '/api/listings/create';
        const payload = draftId ? {
          draftId,
          listingImages: listingImagesSorted.map((photo, index) => ({
            url: photo.url,
            rank: index
          })),
          monthlyPricing: listingPricing.monthlyPricing.map(p => ({
            months: p.months,
            price: p.price ? Number(p.price) : 0,
            utilitiesIncluded: p.utilitiesIncluded
          }))
        } : finalListing;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create listing');
        }
        
        // Revalidate the host dashboard to refresh listing data
        await revalidateHostDashboard();
        
        // Show success state instead of immediate redirect
        setCurrentStep(11); // Move to a new success step
        setSlideDirection('right');
        setAnimationKey(prevKey => prevKey + 1);
      } catch (error) {
        console.error('Error creating listing:', error);
        
        // Show error at the bottom of the review page
        setValidationErrors({
          ...validationErrors,
          [11]: [(error as Error).message || 'An error occurred while creating the listing. Please try again.']
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
          
          // Fetch draft from the draft API
          const response = await fetch(`/api/listings/draft?id=${draftId}`);
          if (!response.ok) {
            throw new Error('Failed to load draft');
          }
          
          const draftListing = await response.json();
          
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
            
            // Note: ListingInCreation doesn't have images stored in the database
            // If we need to persist images across draft saves, we'd need to add
            // a separate table or store URLs in the draft
            
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
            const shortestStay = draftListing.shortestLeaseLength || 1;
            const longestStay = draftListing.longestLeaseLength || 12;
            
            // Initialize monthly pricing array
            const monthlyPricing: MonthlyPricing[] = [];
            for (let i = shortestStay; i <= longestStay; i++) {
              monthlyPricing.push({
                months: i,
                price: '',
                utilitiesIncluded: false
              });
            }
            
            setListingPricing({
              shortestStay,
              longestStay,
              monthlyPricing,
              includeUtilities: false,
              utilitiesUpToMonths: shortestStay,
              varyPricingByLength: true,
              basePrice: "",
              deposit: draftListing.depositSize ? draftListing.depositSize.toString() : "",
              reservationDeposit: draftListing.reservationDeposit ? draftListing.reservationDeposit.toString() : "",
              petDeposit: draftListing.petDeposit ? draftListing.petDeposit.toString() : "",
              petRent: draftListing.petRent ? draftListing.petRent.toString() : ""
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
      shortestLeasePrice: 0, // Deprecated
      longestLeasePrice: 0, // Deprecated
      depositSize: listingPricing.deposit ? Number(listingPricing.deposit) : null,
      reservationDeposit: listingPricing.reservationDeposit ? Number(listingPricing.reservationDeposit) : null,
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
              questionTextStyles={questionTextStyles}
            />
            {validationErrors[0] && <ValidationErrors errors={validationErrors[0]} className="mt-6" />}
          </>
        );
      case 1:
        return (
          <LocationInput
            listingLocation={listingLocation}
            setListingLocation={setListingLocation}
            validationErrors={validationErrors[1]}
          />
        );
      case 2:
        return (
          <AddressConfirmation
            listingLocation={listingLocation}
            setListingLocation={setListingLocation}
            validationErrors={validationErrors[2]}
          />
        );
      case 3:
        return (
          <>
            {validationErrors[3] && <ValidationErrors errors={validationErrors[3]} className="mb-6" />}
            <div className="mt-8">
              <Rooms
                bedrooms={listingRooms.bedrooms}
                bathrooms={listingRooms.bathrooms}
                squareFeet={listingRooms.squareFeet}
                questionTextStyles={questionTextStyles}
                onBedroomsChange={value => setListingRooms(prev => ({ ...prev, bedrooms: value }))}
                onBathroomsChange={value => setListingRooms(prev => ({ ...prev, bathrooms: value }))}
                onSquareFeetChange={value => setListingRooms(prev => ({ ...prev, squareFeet: value }))}
              />
            </div>
            {validationErrors[3] && <ValidationErrors errors={validationErrors[3]} className="mt-6" />}
          </>
        );
      case 4:
        return (
          <>
            {validationErrors[4] && <ValidationErrors errors={validationErrors[4]} className="mb-6" />}
            <ListingBasics
              title={listingBasics.title}
              setTitle={value => setListingBasics(prev => ({ ...prev, title: value }))}
              description={listingBasics.description}
              setDescription={value => setListingBasics(prev => ({ ...prev, description: value }))}
            />
            {validationErrors[4] && <ValidationErrors errors={validationErrors[4]} className="mt-6" />}
          </>
        );
      case 5:
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
              [5]: photoErrors
            });
          } else if (validationErrors[5]) {
            // Clear errors if validation passes
            const newValidationErrors = { ...validationErrors };
            delete newValidationErrors[5];
            setValidationErrors(newValidationErrors);
          }
        };
        
        return (
          <>
            {validationErrors[5] && <ValidationErrors errors={validationErrors[5]} className="mb-6" />}
            <ListingPhotos 
              listingPhotos={listingPhotos} 
              setListingPhotos={handlePhotosUpdate} 
            />
            {validationErrors[5] && <ValidationErrors errors={validationErrors[5]} className="mt-6" />}
          </>
        );
      case 6:
        return (
          <>
            {validationErrors[6] && <ValidationErrors errors={validationErrors[6]} className="mb-6" />}
            <ListingPhotoSelection
              listingPhotos={listingPhotos}
              selectedPhotos={selectedPhotos}
              setSelectedPhotos={setSelectedPhotos}
            />
            {validationErrors[6] && <ValidationErrors errors={validationErrors[6]} className="mt-6" />}
          </>
        );
      case 7:
        return (
          <>
            {validationErrors[7] && <ValidationErrors errors={validationErrors[7]} className="mb-6" />}
            <ListingAmenities
              value={listingAmenities}
              onChange={setListingAmenities}
            />
            {validationErrors[7] && <ValidationErrors errors={validationErrors[7]} className="mt-6" />}
          </>
        );
      case 8:
        return (
          <>
            {validationErrors[8] && <ValidationErrors errors={validationErrors[8]} className="mb-6" />}
            <ListingCreationPricing
              shortestStay={listingPricing.shortestStay}
              longestStay={listingPricing.longestStay}
              includeUtilities={listingPricing.includeUtilities}
              utilitiesUpToMonths={listingPricing.utilitiesUpToMonths}
              varyPricingByLength={listingPricing.varyPricingByLength}
              basePrice={listingPricing.basePrice}
              onShortestStayChange={(value) => setListingPricing(prev => ({ ...prev, shortestStay: value }))}
              onLongestStayChange={(value) => setListingPricing(prev => ({ ...prev, longestStay: value }))}
              onIncludeUtilitiesChange={(value) => setListingPricing(prev => ({ ...prev, includeUtilities: value, utilitiesUpToMonths: value ? prev.shortestStay : prev.utilitiesUpToMonths }))}
              onUtilitiesUpToMonthsChange={(value) => setListingPricing(prev => ({ ...prev, utilitiesUpToMonths: value }))}
              onVaryPricingByLengthChange={(value) => setListingPricing(prev => ({ ...prev, varyPricingByLength: value }))}
              onBasePriceChange={(value) => setListingPricing(prev => ({ ...prev, basePrice: value }))}
              onContinue={handleNext}
              questionTextStyles={questionTextStyles}
              questionSubTextStyles={questionSubTextStyles}
            />
            {validationErrors[8] && <ValidationErrors errors={validationErrors[8]} className="mt-6" />}
          </>
        );
      case 9:
        return (
          <>
            {validationErrors[9] && <ValidationErrors errors={validationErrors[9]} className="mb-6" />}
            <ListingCreationVerifyPricing
              shortestStay={listingPricing.shortestStay}
              longestStay={listingPricing.longestStay}
              monthlyPricing={listingPricing.monthlyPricing}
              includeUtilities={listingPricing.includeUtilities}
              utilitiesUpToMonths={listingPricing.utilitiesUpToMonths}
              onShortestStayChange={(value) => setListingPricing(prev => ({ ...prev, shortestStay: value }))}
              onLongestStayChange={(value) => setListingPricing(prev => ({ ...prev, longestStay: value }))}
              onMonthlyPricingChange={(pricing) => setListingPricing(prev => ({ ...prev, monthlyPricing: pricing }))}
            />
            {validationErrors[9] && <ValidationErrors errors={validationErrors[9]} className="mt-6" />}
          </>
        );
      case 10:
        return (
          <>
            {validationErrors[10] && <ValidationErrors errors={validationErrors[10]} className="mb-6" />}
            <ListingCreationDeposit
              deposit={listingPricing.deposit}
              reservationDeposit={listingPricing.reservationDeposit}
              petDeposit={listingPricing.petDeposit}
              petRent={listingPricing.petRent}
              onDepositChange={(value) => setListingPricing(prev => ({ ...prev, deposit: value }))}
              onReservationDepositChange={(value) => setListingPricing(prev => ({ ...prev, reservationDeposit: value }))}
              onPetDepositChange={(value) => setListingPricing(prev => ({ ...prev, petDeposit: value }))}
              onPetRentChange={(value) => setListingPricing(prev => ({ ...prev, petRent: value }))}
              questionTextStyles={questionTextStyles}
              questionSubTextStyles={questionSubTextStyles}
            />
            {validationErrors[10] && <ValidationErrors errors={validationErrors[10]} className="mt-6" />}
          </>
        );
      case 11:
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
              onEditRooms={() => handleEditFromReview(3)}
              onEditBasics={() => handleEditFromReview(4)}
              onEditAmenities={() => handleEditFromReview(7)}
              onEditPricing={() => handleEditFromReview(9)}
              onEditDeposits={() => handleEditFromReview(10)}
              showPricingStructureTitle={false}
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
      case 12:
        // Success page - determine if from Save & Exit or final submission
        const isSaveAndExit = currentStep === 12 && listing.status === "draft";
        
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
              onClick={() => router.push('/platform/host/dashboard/listings')}
            >
              Go to Host Dashboard
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Get step title and subtitle based on current step
  const getStepInfo = (step: number): { title: string; subtitle?: string } => {
    switch (step) {
      case 0: return { title: 'Which of these describes your place?' };
      case 1: return { title: 'Where is your place located?' };
      case 2: return { title: 'Confirm your property\'s address' };
      case 3: return { title: 'Share some basics about your place' };
      case 4: return { title: 'How would you describe your place?' };
      case 5: return { title: 'Add some photos' };
      case 6: return { title: 'Choose the photos renters see first' };
      case 7: return { title: 'What amenities does your property offer?' };
      case 8: return { title: 'Set the pricing' };
      case 9: return { title: 'Adjust prices and utilities inclusion for each lease length', subtitle: 'Hosts often discount rates for extended stays. You can adjust pricing and utilities inclusion for each lease length.' };
      case 10: return { title: 'What deposits and additional costs do you require', subtitle: 'Set your security deposit and any pet-related fees' };
      case 11: return { title: 'Review your listing' };
      default: return { title: 'Create Listing' };
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

        {/* Title and Save & Exit button at top */}
        {currentStep !== 12 && (
          <div className="flex justify-between items-center w-full max-w-[883px] mx-auto py-10">
            <div className="flex flex-col">
              <h1 className="font-['Poppins'] text-2xl font-semibold leading-normal" style={{ color: 'var(--Nuetral-nuetral-800, #484A54)' }}>
                {getStepInfo(currentStep).title}
              </h1>
              {getStepInfo(currentStep).subtitle && (
                <p 
                  className="font-['Poppins'] text-sm font-normal leading-normal mt-1"
                  style={{ color: 'var(--Nuetral-nuetral-700, #5D606D)' }}
                >
                  {getStepInfo(currentStep).subtitle}
                </p>
              )}
            </div>
            <BrandButton 
              variant="outline"
              size="xl"
              onClick={handleSaveExit}
            >
              Save & Exit
            </BrandButton>
          </div>
        )}

        {/* Main content with slide animation */}
        <div className="w-full max-w-[883px] mx-auto mb-24">
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
        {currentStep !== 12 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background z-10">
            {/* Progress bar above footer */}
            <ProgressBar 
              currentStep={currentStep} 
              steps={steps}
            />
            <div className="">
            <Separator className="w-full" />
            {isAdmin ? (
              /* Admin footer with skip buttons */
              <div className="w-full px-[50px] py-8">
                <div className="flex justify-between items-center ">
                  <div className="flex gap-2 items-center">
                    <BrandButton 
                      variant="link"
                      size="xl"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                    >
                      Back
                    </BrandButton>
                    {!adminSkipButtonsHidden && (
                      <BrandButton 
                        variant="outline"
                        size="sm"
                        className="border-orange-500 text-orange-500 hover:bg-orange-500"
                        onClick={handleAdminSkipBack}
                        disabled={currentStep === 0}
                      >
                        Skip ←
                      </BrandButton>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {!adminSkipButtonsHidden && (
                      <BrandButton 
                        variant="outline"
                        size="sm"
                        className="border-orange-500 text-orange-500 hover:bg-orange-500"
                        onClick={handleAdminSkipNext}
                        disabled={currentStep >= steps.length - 1 || currentStep === 11}
                      >
                        Skip →
                      </BrandButton>
                    )}
                    <BrandButton 
                      variant="default"
                      size="2xl"
                      onClick={currentStep === 11 ? handleSubmitListing : handleNext}
                      disabled={currentStep === 11 ? isAdmin : false}
                    >
                      {currentStep === 11 ? 'Submit Listing' : 
                       (cameFromReview && currentStep !== 10) ? 'Review' : 'Next'}
                    </BrandButton>
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
              <div className="flex justify-between items-center w-full px-[50px] py-10">
                <BrandButton 
                  variant="link"
                  size="xl"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  Back
                </BrandButton>
                <BrandButton 
                  variant="default"
                  size="2xl"
                  onClick={currentStep === 11 ? handleSubmitListing : handleNext}
                  disabled={currentStep === 11 ? isAdmin : false}
                >
                  {currentStep === 11 ? 'Submit Listing' : 
                   (cameFromReview && currentStep !== 10) ? 'Review' : 'Next'}
                </BrandButton>
              </div>
            )}
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
};
