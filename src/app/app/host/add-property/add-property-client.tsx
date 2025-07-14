'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ProgressBar, { StepInfo } from "./progress-bar";
import { revalidateHostDashboard } from "../_actions";
import LocationForm from "./location-form";
import LocationInput from "./listing-creation-location-input";
import AddressConfirmation from "./listing-creation-address-confirmation";
import ListingUploadHighlights from "./listing-creation-highlights";
import { Rooms } from "./listing-creation-rooms";
import { ListingBasics } from "./listing-creation-basics";
import { ListingPhotos } from "./listing-creation-photos-upload-batched";
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
  rentDueAtBooking: number | null;
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
  const { toast } = useToast();
  
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
  
  // State to track if admin mode is temporarily disabled (requires refresh to get back)
  const [adminModeDisabled, setAdminModeDisabled] = useState<boolean>(false);
  
  // State to track if save & exit is loading
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // State to track if submit is loading
  const [isSubmittingListing, setIsSubmittingListing] = useState<boolean>(false);
  
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
    rentDueAtBooking: null,
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
  rentDueAtBooking: "",
  petDeposit: "",
  petRent: ""
});

// Cache to preserve all pricing data, even for months outside current range
const [pricingCache, setPricingCache] = useState<Map<number, MonthlyPricing>>(new Map());

// Initialize monthly pricing when component mounts or stay lengths change
React.useEffect(() => {
  const newPricing: MonthlyPricing[] = [];
  const cacheUpdates: Array<{ months: number, pricing: MonthlyPricing }> = [];
  
  for (let i = listingPricing.shortestStay; i <= listingPricing.longestStay; i++) {
    // Try to find cached pricing for this month first, then existing pricing
    const cached = pricingCache.get(i);
    const existing = listingPricing.monthlyPricing.find(p => p.months === i);
    
    if (cached) {
      // Use cached pricing (preserves previously entered values)
      newPricing.push({ ...cached });
    } else if (existing) {
      // Keep existing pricing and cache it
      newPricing.push({ ...existing });
      cacheUpdates.push({ months: i, pricing: { ...existing } });
    } else {
      // Create new entry with default values
      const newEntry = {
        months: i,
        price: '',
        utilitiesIncluded: false
      };
      newPricing.push(newEntry);
      cacheUpdates.push({ months: i, pricing: { ...newEntry } });
    }
  }
  
  // Update pricing state
  setListingPricing(prev => ({ ...prev, monthlyPricing: newPricing }));
  
  // Update cache if needed
  if (cacheUpdates.length > 0) {
    setPricingCache(prev => {
      const newCache = new Map(prev);
      cacheUpdates.forEach(({ months, pricing }) => newCache.set(months, pricing));
      return newCache;
    });
  }
}, [listingPricing.shortestStay, listingPricing.longestStay]);

// Step 2: Rooms
const [listingRooms, setListingRooms] = useState({
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: ""
});

// Reusable text styles
const questionTextStyles = "font-['Poppins'] font-medium text-[#484a54] text-[16px]";
const questionSubTextStyles = "font-['Poppins'] text-xs font-normal text-[#838799]";
const inputStyles = "placeholder:text-[#667085] placeholder:font-['Poppins',Helvetica] bg-[#D0D5DD]/10";

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
    setIsSavingDraft(true);
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

      // Assign ranks to any remaining photos with null ranks
      const maxRank = Math.max(0, ...listingImagesFinal.filter(p => p.rank !== null).map(p => p.rank!));
      let nextRank = maxRank + 1;
      listingImagesFinal.forEach(photo => {
        if (photo.rank === null) {
          photo.rank = nextRank++;
        }
      });

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
        rentDueAtBooking: listingPricing.rentDueAtBooking ? Number(listingPricing.rentDueAtBooking) : null,
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
      
      // Exit to host dashboard after saving
      router.push('/app/host/dashboard');
    } catch (error) {
      console.error('Error saving listing draft:', error);
      alert(`Error saving your listing: ${(error as Error).message}`);
    } finally {
      setIsSavingDraft(false);
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
    const validPhotos = listingPhotos?.filter(photo => photo.url) || [];
    const validPhotoCount = validPhotos.length;
    
    if (validPhotoCount === 0) {
      errors.push("You must upload at least 4 photos");
    } else if (validPhotoCount < 4) {
      errors.push(`You need to upload ${4 - validPhotoCount} more photo${validPhotoCount === 3 ? '' : 's'} (minimum 4 required)`);
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
    
    // Step 7 validation - check basic settings
    if (listingPricing.shortestStay < 1 || listingPricing.shortestStay > 12) {
      errors.push("Shortest stay must be between 1 and 12 months");
    }
    
    if (listingPricing.longestStay < 1 || listingPricing.longestStay > 12) {
      errors.push("Longest stay must be between 1 and 12 months");
    }
    
    if (listingPricing.shortestStay > listingPricing.longestStay) {
      errors.push("Shortest stay cannot be longer than longest stay");
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
    
    // Validate rent due at booking doesn't exceed lowest monthly rent
    if (listingPricing.rentDueAtBooking && listingPricing.rentDueAtBooking !== '') {
      const rentDueAmount = parseFloat(listingPricing.rentDueAtBooking);
      
      if (!isNaN(rentDueAmount) && rentDueAmount > 0) {
        // Find the lowest monthly rent price from the pricing array
        const validPrices = listingPricing.monthlyPricing
          .filter(p => p.price && p.price !== '')
          .map(p => parseFloat(p.price))
          .filter(price => !isNaN(price) && price > 0);
        
        if (validPrices.length > 0) {
          const lowestPrice = Math.min(...validPrices);
          if (rentDueAmount > lowestPrice) {
            errors.push(`Rent due at booking ($${rentDueAmount}) cannot be higher than the lowest monthly rent ($${lowestPrice})`);
          }
        }
      }
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
        
        // Show validation errors as toast
        toast({
          variant: "destructive",
          title: "Please complete the following:",
          description: (
            <ul className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          ),
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
    // If admin mode and not disabled, skip validation and API call, show success preview
    if (isAdmin && !adminModeDisabled && !adminSkipButtonsHidden) {
      setCurrentStep(12); // Move to success step
      setSlideDirection('right');
      setAnimationKey(prevKey => prevKey + 1);
      return;
    }

    if (validateAllSteps()) {

      setIsSubmittingListing(true);

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

      // Assign ranks to any remaining photos with null ranks
      const maxRank = Math.max(0, ...listingImagesFinal.filter(p => p.rank !== null).map(p => p.rank!));
      let nextRank = maxRank + 1;
      listingImagesFinal.forEach(photo => {
        if (photo.rank === null) {
          photo.rank = nextRank++;
        }
      });

      // Sort photos: ranked photos first (in ascending order), then unranked photos
      listingImagesFinal.sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      });

      let listingImagesSorted = listingImagesFinal

      try {
        // Prepare listing data with selected photos
        const finalListing = {
          title: listingBasics.title,
          description: listingBasics.description,
          status: "available", // Default status for new listings
          // Use the correct property name that matches the Prisma schema
          listingImages: listingImagesSorted.map((photo) => ({
            url: photo.url,
            rank: photo.rank // Use the assigned rank
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
          rentDueAtBooking: listingPricing.rentDueAtBooking ? Number(listingPricing.rentDueAtBooking) : 0,
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
          listingImages: listingImagesSorted.map((photo) => ({
            url: photo.url,
            rank: photo.rank
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
        setCurrentStep(12); // Move to success step
        setSlideDirection('right');
        setAnimationKey(prevKey => prevKey + 1);
      } catch (error) {
        console.error('Error creating listing:', error);
        
        // Show error with toast
        toast({
          variant: "destructive",
          title: "Error creating listing",
          description: (error as Error).message || 'An error occurred while creating the listing. Please try again.',
        });
      } finally {
        setIsSubmittingListing(false);
      }
    } else {
      // There are validation errors
      const allErrors = Object.values(validationErrors).flat();
      
      // Show validation errors as toast
      toast({
        variant: "destructive",
        title: "Please fix the following errors:",
        description: (
          <ul className="mt-2 space-y-1">
            {allErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        ),
      });
      
      // Find the first step with errors and navigate to it
      // Special case: if both step 5 (photo upload) and step 6 (photo selection) have errors,
      // and we have enough photos uploaded, prioritize step 6 (selection)
      const errorSteps = Object.keys(validationErrors).map(Number).sort((a, b) => a - b);
      let targetStep = errorSteps[0];
      
      if (errorSteps.includes(5) && errorSteps.includes(6)) {
        // Check if we have enough photos uploaded (4+)
        const validPhotos = listingPhotos?.filter(photo => photo.url) || [];
        if (validPhotos.length >= 4) {
          // We have enough photos, the issue is selection, so go to step 6
          targetStep = 6;
        }
      }
      
      if (targetStep !== undefined) {
        setCurrentStep(targetStep);
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
            
            // Load photos from draft if they exist
            if (draftListing.listingImages && Array.isArray(draftListing.listingImages)) {
              const loadedPhotos = draftListing.listingImages.map((image: any) => ({
                id: image.id,
                url: image.url,
                listingId: image.listingId,
                category: image.category,
                rank: image.rank,
              }));
              setListingPhotos(loadedPhotos);
              
              // Extract selected photos (ranks 1-4) and sort by rank
              const selectedFromDraft = loadedPhotos
                .filter(photo => photo.rank && photo.rank >= 1 && photo.rank <= 4)
                .sort((a, b) => a.rank! - b.rank!);
              setSelectedPhotos(selectedFromDraft);
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
            const shortestStay = draftListing.shortestLeaseLength || 1;
            const longestStay = draftListing.longestLeaseLength || 12;
            
            // Initialize monthly pricing array
            let monthlyPricing: MonthlyPricing[] = [];
            
            // If draft has saved monthly pricing, use it, otherwise initialize empty
            if (draftListing.monthlyPricing && Array.isArray(draftListing.monthlyPricing) && draftListing.monthlyPricing.length > 0) {
              monthlyPricing = draftListing.monthlyPricing.map((p: any) => ({
                months: p.months,
                price: p.price ? p.price.toString() : '',
                utilitiesIncluded: p.utilitiesIncluded || false
              }));
            } else {
              // Initialize empty pricing for each month in range
              for (let i = shortestStay; i <= longestStay; i++) {
                monthlyPricing.push({
                  months: i,
                  price: '',
                  utilitiesIncluded: false
                });
              }
            }
            
            setListingPricing({
              shortestStay,
              longestStay,
              monthlyPricing,
              includeUtilities: false,
              utilitiesUpToMonths: 1,
              varyPricingByLength: true,
              basePrice: "",
              deposit: draftListing.depositSize ? draftListing.depositSize.toString() : "",
              rentDueAtBooking: draftListing.rentDueAtBooking ? draftListing.rentDueAtBooking.toString() : "",
              petDeposit: draftListing.petDeposit ? draftListing.petDeposit.toString() : "",
              petRent: draftListing.petRent ? draftListing.petRent.toString() : ""
            });

            // Initialize pricing cache with all available pricing data
            const initialCache = new Map<number, MonthlyPricing>();
            monthlyPricing.forEach(p => {
              initialCache.set(p.months, { ...p });
            });
            setPricingCache(initialCache);
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
      rentDueAtBooking: listingPricing.rentDueAtBooking ? Number(listingPricing.rentDueAtBooking) : null,
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
            questionTextStyles={questionTextStyles}
          />
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
            inputStyles={inputStyles}
            labelStyles={questionTextStyles}
          />
        );
      case 3:
        return (
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
        );
      case 4:
        return (
          <ListingBasics
            title={listingBasics.title}
            setTitle={value => setListingBasics(prev => ({ ...prev, title: value }))}
            description={listingBasics.description}
            setDescription={value => setListingBasics(prev => ({ ...prev, description: value }))}
          />
        );
      case 5:
        // Custom photo handler to update validation in real-time
        const handlePhotosUpdate = (newPhotos: NullableListingImage[]) => {
          // Update photos state first
          setListingPhotos(newPhotos);
          
          // Use the new photos array directly for validation instead of calling validatePhotos()
          // which would use the not-yet-updated state value
          let photoErrors: string[] = [];
          const validPhotos = Array.isArray(newPhotos) ? newPhotos.filter(photo => photo.url) : [];
          const validPhotoCount = validPhotos.length;
          
          if (validPhotoCount === 0) {
            photoErrors.push("You must upload at least 4 photos");
          } else if (validPhotoCount < 4) {
            photoErrors.push(`You need to upload ${4 - validPhotoCount} more photo${validPhotoCount === 3 ? '' : 's'} (minimum 4 required)`);
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
          <ListingPhotos 
            listingPhotos={listingPhotos} 
            setListingPhotos={handlePhotosUpdate}
          />
        );
      case 6:
        return (
          <ListingPhotoSelection
            listingPhotos={listingPhotos}
            selectedPhotos={selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
          />
        );
      case 7:
        return (
          <ListingAmenities
            value={listingAmenities}
            onChange={setListingAmenities}
          />
        );
      case 8:
        return (
          <ListingCreationPricing
            shortestStay={listingPricing.shortestStay}
            longestStay={listingPricing.longestStay}
            includeUtilities={listingPricing.includeUtilities}
            utilitiesUpToMonths={listingPricing.utilitiesUpToMonths}
            varyPricingByLength={listingPricing.varyPricingByLength}
            basePrice={listingPricing.basePrice}
            onShortestStayChange={(value) => setListingPricing(prev => ({ ...prev, shortestStay: value }))}
            onLongestStayChange={(value) => setListingPricing(prev => ({ ...prev, longestStay: value }))}
            onIncludeUtilitiesChange={(value) => setListingPricing(prev => ({ ...prev, includeUtilities: value }))}
            onUtilitiesUpToMonthsChange={(value) => setListingPricing(prev => ({ ...prev, utilitiesUpToMonths: value }))}
            onVaryPricingByLengthChange={(value) => setListingPricing(prev => ({ ...prev, varyPricingByLength: value }))}
            onBasePriceChange={(value) => setListingPricing(prev => ({ ...prev, basePrice: value }))}
            onContinue={handleNext}
            questionTextStyles={questionTextStyles}
            questionSubTextStyles={questionSubTextStyles}
          />
        );
      case 9:
        return (
          <ListingCreationVerifyPricing
            shortestStay={listingPricing.shortestStay}
            longestStay={listingPricing.longestStay}
            monthlyPricing={listingPricing.monthlyPricing}
            includeUtilities={listingPricing.includeUtilities}
            utilitiesUpToMonths={listingPricing.utilitiesUpToMonths}
            onShortestStayChange={(value) => setListingPricing(prev => ({ ...prev, shortestStay: value }))}
            onLongestStayChange={(value) => setListingPricing(prev => ({ ...prev, longestStay: value }))}
            onMonthlyPricingChange={(pricing) => {
              setListingPricing(prev => ({ ...prev, monthlyPricing: pricing }));
              // Update cache with new pricing values
              setPricingCache(prev => {
                const newCache = new Map(prev);
                pricing.forEach(p => newCache.set(p.months, { ...p }));
                return newCache;
              });
            }}
          />
        );
      case 10:
        return (
          <ListingCreationDeposit
            deposit={listingPricing.deposit}
            rentDueAtBooking={listingPricing.rentDueAtBooking}
            petDeposit={listingPricing.petDeposit}
            petRent={listingPricing.petRent}
            onDepositChange={(value) => setListingPricing(prev => ({ ...prev, deposit: value }))}
            onRentDueAtBookingChange={(value) => setListingPricing(prev => ({ ...prev, rentDueAtBooking: value }))}
            onPetDepositChange={(value) => setListingPricing(prev => ({ ...prev, petDeposit: value }))}
            onPetRentChange={(value) => setListingPricing(prev => ({ ...prev, petRent: value }))}
            questionTextStyles={questionTextStyles}
            questionSubTextStyles={questionSubTextStyles}
          />
        );
      case 11:
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
            onEditRooms={() => handleEditFromReview(3)}
            onEditBasics={() => handleEditFromReview(4)}
            onEditAmenities={() => handleEditFromReview(7)}
            onEditPricing={() => handleEditFromReview(9)}
            onEditDeposits={() => handleEditFromReview(10)}
            showPricingStructureTitle={false}
          />
        );
      case 12:
        // Success page - determine if from Save & Exit or final submission
        const isSaveAndExit = currentStep === 12 && listing.status === "draft";
        
        return (
          <div className="flex flex-col  items-center justify-center py-12 text-center">
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
            <BrandButton 
              href="/app/host/dashboard/listings"
              size="xl"
              className="w-[200px]"
            >
              Go to Host Dashboard
            </BrandButton>
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
      case 9: return { title: 'Select Monthly Rent And Utilities Included', subtitle: 'Hosts often discount rates for extended stays. You can adjust pricing and utilities for each lease length.' };
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
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading your draft listing...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background flex flex-row justify-center w-full">
      <div className="bg-background overflow-auto w-full max-w-[1920px] relative" style={{ paddingBottom: (currentStep !== 12 || (isAdmin && !adminModeDisabled)) ? '160px' : '0' }}>

        {/* Mobile restructured header */}
        {currentStep !== 12 && (
          <div className="w-full max-w-[883px] mx-auto">
            {/* Title row - top left */}
            <div className="px-4 pt-6">
              <h1 className="font-['Poppins'] text-xl md:text-2xl font-semibold leading-normal" style={{ color: 'var(--Nuetral-nuetral-800, #484A54)' }}>
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
            
            {/* Save & Exit button row - top left */}
            <div className="px-4 pt-4 pb-6">
              <BrandButton 
                variant="outline"
                size="lg"
                onClick={handleSaveExit}
                disabled={isSavingDraft}
                className="text-sm"
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Exit'
                )}
              </BrandButton>
            </div>
          </div>
        )}

        {/* Main content with slide animation */}
        <div className="w-full max-w-[883px] mx-auto px-4">
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
        {(currentStep !== 12 || (isAdmin && !adminModeDisabled)) && (
          <div className="fixed bottom-0 left-0 right-0 bg-background z-10">
            {/* Progress bar above footer */}
            <ProgressBar 
              currentStep={currentStep} 
              steps={steps}
            />
            <div className="">
            <Separator className="w-full" />
            {isAdmin && !adminModeDisabled ? (
              /* Admin footer with skip buttons */
              <div className="w-full px-4 md:px-[50px] py-6 md:py-8">
                {/* Admin controls row - skip, skip */}
                {!adminSkipButtonsHidden && (
                  <div className="flex justify-between items-center mb-4">
                    <BrandButton 
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 text-xs px-3 py-1"
                      onClick={handleAdminSkipBack}
                      disabled={currentStep === 0}
                    >
                      Skip
                    </BrandButton>
                    <BrandButton 
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 text-xs px-3 py-1"
                      onClick={handleAdminSkipNext}
                      disabled={currentStep >= steps.length - 1 || currentStep === 11}
                    >
                      Skip
                    </BrandButton>
                  </div>
                )}
                
                {/* Back and Next buttons row - mobile sizes, justify-between */}
                <div className="flex justify-between items-center">
                  {!cameFromReview ? (
                    <BrandButton 
                      variant="link"
                      size="lg"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="text-sm"
                    >
                      Back
                    </BrandButton>
                  ) : (
                    <div></div>
                  )}
                  <BrandButton 
                    variant="default"
                    size="lg"
                    onClick={currentStep === 11 ? handleSubmitListing : currentStep === 12 ? () => setCurrentStep(11) : handleNext}
                    disabled={currentStep === 11 ? isSubmittingListing : false}
                    className="text-sm px-6"
                  >
                    {currentStep === 11 ? (
                      isSubmittingListing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isAdmin && !adminModeDisabled && !adminSkipButtonsHidden ? 'Preview' : 'Submitting...'}
                        </>
                      ) : (
                        isAdmin && !adminModeDisabled && !adminSkipButtonsHidden ? 'Preview Success' : 'Submit Listing'
                      )
                    ) : currentStep === 12 ? (
                      'Back to Review'
                    ) : (
                      (cameFromReview && currentStep !== 10) ? 'Review' : 'Next'
                    )}
                  </BrandButton>
                </div>
                
                {/* Admin mode indicator */}
                <div className="text-center mt-3">
                  <span 
                    className={`text-xs font-medium cursor-pointer ${adminSkipButtonsHidden ? 'text-gray-500' : 'text-orange-600'}`}
                    onClick={() => setAdminSkipButtonsHidden(!adminSkipButtonsHidden)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setAdminModeDisabled(true);
                    }}
                    onTouchStart={(e) => {
                      const timeoutId = setTimeout(() => {
                        setAdminModeDisabled(true);
                      }, 2000); // 2 second long press
                      
                      const handleTouchEnd = () => {
                        clearTimeout(timeoutId);
                        document.removeEventListener('touchend', handleTouchEnd);
                        document.removeEventListener('touchcancel', handleTouchEnd);
                        document.removeEventListener('touchmove', handleTouchEnd);
                      };
                      
                      document.addEventListener('touchend', handleTouchEnd);
                      document.addEventListener('touchcancel', handleTouchEnd);
                      document.addEventListener('touchmove', handleTouchEnd);
                    }}
                  >
                    Admin Mode (click to {adminSkipButtonsHidden ? 'show' : 'hide'} controls, right-click/long press to disable)
                  </span>
                </div>
              </div>
            ) : (
              /* Regular user footer - Back and Next buttons mobile sizes, justify-between */
              <div className="flex justify-between items-center w-full px-4 md:px-[50px] py-8 md:py-10">
                {!cameFromReview ? (
                  <BrandButton 
                    variant="link"
                    size="lg"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="text-sm"
                  >
                    Back
                  </BrandButton>
                ) : (
                  <div></div>
                )}
                <BrandButton 
                  variant="default"
                  size="lg"
                  onClick={currentStep === 11 ? handleSubmitListing : currentStep === 12 ? () => setCurrentStep(11) : handleNext}
                  disabled={currentStep === 11 ? isSubmittingListing : false}
                  className="text-sm px-6"
                >
                  {currentStep === 11 ? (
                    isSubmittingListing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Listing'
                    )
                  ) : currentStep === 12 ? (
                    'Back to Review'
                  ) : (
                    (cameFromReview && currentStep !== 10) ? 'Review' : 'Next'
                  )}
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
