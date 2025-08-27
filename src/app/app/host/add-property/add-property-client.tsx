/**
 * Add Property Client Component
 * 
 * This is the main client-side component for the add property flow.
 * It handles the multi-step form process for hosts to add new rental properties.
 * 
 * Primary test file: test/lib/listing-actions-helpers.test.ts
 * Contains comprehensive tests for all helper functions used by this component.
 */
'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from '@/components/brandDialog';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import ProgressBar, { StepInfo } from "./progress-bar";
import { revalidateHostDashboard } from "../_actions";
import {
  initializeHighlights,
  initializeLocation,
  initializeRooms,
  initializeBasicInfo,
  initializePhotos,
  initializeAmenities,
  handleSaveAndExit,
  handleSubmitListing as handleSubmitListingHelper,
  validateHighlights,
  validateLocation,
  validateRooms,
  validateBasics,
  validatePhotos,
  validateFeaturedPhotos,
  validateAmenities,
  validatePricing,
  validateVerifyPricing,
  validateDeposits,
  validateAllSteps,
} from "@/lib/listing-actions-helpers";
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
import { loadDraftData } from "@/lib/listing-actions-helpers";

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

import ListingCreationSuccess from './listing-creation-success';

interface AddPropertyClientProps {
  draftData?: any;
}

export default function AddPropertyclient({ draftData }: AddPropertyClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { user } = useUser();
  const { toast } = useToast();
  
  console.log('🎯 [CLIENT] Received draftData:', draftData);
  
  // Check if user is admin
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isAdmin = userRole === 'admin';
  
  // State to track current step and animation direction
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Track if user came from review page
  const [cameFromReview, setCameFromReview] = useState<boolean>(false);
  
  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  
  // State to track if admin skip buttons are hidden
  const [adminSkipButtonsHidden, setAdminSkipButtonsHidden] = useState<boolean>(false);
  
  // State to track if admin mode is temporarily disabled (requires refresh to get back)
  const [adminModeDisabled, setAdminModeDisabled] = useState<boolean>(false);
  
  // State to track if save & exit is loading
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // State to track if submit is loading
  const [isSubmittingListing, setIsSubmittingListing] = useState<boolean>(false);
  
  // State to track created listing ID for Hospitable integration
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  
  // State to track video dialog
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState<boolean>(false);
  
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
const initialPhotos = initializePhotos(draftData);
const [listingPhotos, setListingPhotos] = useState<NullableListingImage[]>(initialPhotos.listingPhotos);

// State for selected featured photos
const [selectedPhotos, setSelectedPhotos] = useState<NullableListingImage[]>(initialPhotos.selectedPhotos);

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

// Initialize state with draft data if available

const initializePricing = () => {
  if (draftData) {
    const monthlyPricing: MonthlyPricing[] = draftData.monthlyPricing?.map((p: any) => ({
      months: p.months,
      price: p.price ? p.price.toString() : '',
      utilitiesIncluded: p.utilitiesIncluded || false
    })) || [];
    
    console.log('🎯 Initializing pricing with draft data:', {
      shortestStay: draftData.shortestLeaseLength,
      longestStay: draftData.longestLeaseLength,
      monthlyPricing,
      deposit: draftData.depositSize
    });
    
    return {
      shortestStay: draftData.shortestLeaseLength || 1,
      longestStay: draftData.longestLeaseLength || 12,
      monthlyPricing,
      includeUtilities: false,
      utilitiesUpToMonths: 1,
      varyPricingByLength: true,
      basePrice: "",
      deposit: draftData.depositSize ? draftData.depositSize.toString() : "",
      petDeposit: draftData.petDeposit ? draftData.petDeposit.toString() : "",
      petRent: draftData.petRent ? draftData.petRent.toString() : ""
    };
  }
  return {
    shortestStay: 1,
    longestStay: 12,
    monthlyPricing: [] as MonthlyPricing[],
    includeUtilities: false,
    utilitiesUpToMonths: 1,
    varyPricingByLength: true,
    basePrice: "",
    deposit: "",
    petDeposit: "",
    petRent: ""
  };
};

// Step 0: Highlights
const [listingHighlights, setListingHighlights] = useState<ListingHighlights>(initializeHighlights(draftData));

// Step 1: Details (Location)
const [listingLocation, setListingLocation] = useState<ListingLocation>(initializeLocation(draftData));

// Step 4.5: Amenities
const [listingAmenities, setListingAmenities] = useState<string[]>(initializeAmenities(draftData));

// Step 7: Pricing
const [listingPricing, setListingPricing] = useState(initializePricing());

// Cache to preserve all pricing data, even for months outside current range
const [pricingCache, setPricingCache] = useState<Map<number, MonthlyPricing>>(() => {
  const initialCache = new Map<number, MonthlyPricing>();
  if (draftData?.monthlyPricing) {
    draftData.monthlyPricing.forEach((p: any) => {
      initialCache.set(p.months, {
        months: p.months,
        price: p.price ? p.price.toString() : '',
        utilitiesIncluded: p.utilitiesIncluded || false
      });
    });
  }
  return initialCache;
});

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
const [listingRooms, setListingRooms] = useState(() => {
  const roomsData = initializeRooms(draftData);
  return {
    bedrooms: roomsData.roomCount || 1,
    bathrooms: roomsData.bathroomCount || 1,
    squareFeet: roomsData.squareFootage ? roomsData.squareFootage.toString() : ""
  };
});

// Reusable text styles
const questionTextStyles = "font-['Poppins'] font-medium text-[#484a54] text-[16px]";
const questionSubTextStyles = "font-['Poppins'] text-xs font-normal text-[#838799]";
const inputStyles = "placeholder:text-[#667085] placeholder:font-['Poppins',Helvetica] bg-[#D0D5DD]/10";

// Step 3: Basics
const [listingBasics, setListingBasics] = useState(initializeBasicInfo(draftData));

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
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated'
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      console.log('🚀 [handleSaveExit] Starting draft save with current pricing:', listingPricing.monthlyPricing);
      console.log('🚀 [handleSaveExit] Current amenities:', listingAmenities);
      
      // Use the extracted helper function
      const savedDraft = await handleSaveAndExit(
        {
          listingBasics,
          listingLocation,
          listingRooms,
          listingPricing,
          listingHighlights,
          listingPhotos,
          selectedPhotos,
          listingAmenities
        },
        {
          onSuccess: (savedDraft) => {
            // Update the URL with the draft ID if it's a new draft
            if (!draftId && savedDraft.id) {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('draftId', savedDraft.id);
              window.history.replaceState({}, '', newUrl.toString());
            }
          },
          onError: (error) => {
            console.error('❌ [handleSaveExit] Error saving listing draft:', error);
            toast({
              variant: 'destructive',
              title: 'Error saving draft',
              description: error.message || 'Failed to save draft, please try again later'
            });
          }
        },
        draftId // Pass the draftId to ensure we update existing draft instead of creating new
      );
      
      // Exit to host overview after saving
      router.push('/app/host/dashboard/overview');
    } catch (error) {
      // Error handling is done in the helper function callbacks
      // This catch block is just for safety
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Note: Validation functions have been moved to listing-actions-helpers.ts
  
  // Validate the current step
  const validateCurrentStep = (): string[] => {
    switch (currentStep) {
      case 0:
        return validateHighlights(listingHighlights);
      case 1:
        return []; // No validation on location input step
      case 2:
        return validateLocation(listingLocation); // Address confirmation uses validation
      case 3:
        return validateRooms(listingRooms);
      case 4:
        return validateBasics(listingBasics);
      case 5:
        return validatePhotos(listingPhotos);
      case 6:
        return validateFeaturedPhotos(selectedPhotos);
      case 7:
        return validateAmenities(listingAmenities);
      case 8:
        return validatePricing(listingPricing);
      case 9:
        return validateVerifyPricing(listingPricing);
      case 10:
        return validateDeposits(listingPricing);
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
        const allValid = validateAllStepsLocal();
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
  
  
  // Validate all steps before submission (using imported validation functions)
  const validateAllStepsLocal = () => {
    // Use the imported validateAllSteps function
    const allErrors = validateAllSteps({
      listingHighlights,
      listingLocation,
      listingRooms,
      listingBasics,
      listingPhotos,
      selectedPhotos,
      listingAmenities,
      listingPricing
    });
    
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

    if (validateAllStepsLocal()) {
      setIsSubmittingListing(true);

      try {
        // Use the normal submission logic for both draft and non-draft listings
        const listingData = {
          title: listingBasics.title,
          description: listingBasics.description,
          status: "available",
          // Location fields
          locationString: listingLocation.locationString,
          latitude: listingLocation.latitude,
          longitude: listingLocation.longitude,
          city: listingLocation.city,
          state: listingLocation.state,
          streetAddress1: listingLocation.streetAddress1,
          streetAddress2: listingLocation.streetAddress2,
          postalCode: listingLocation.postalCode,
          // Room details
          roomCount: listingRooms.bedrooms || 1,
          bathroomCount: listingRooms.bathrooms || 1,
          guestCount: listingRooms.bedrooms || 1,
          squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet.replace(/,/g, '')) : 0,
          // Pricing and deposits
          depositSize: listingPricing.deposit ? Number(listingPricing.deposit.replace(/,/g, '')) : 0,
          petDeposit: listingPricing.petDeposit ? Number(listingPricing.petDeposit.replace(/,/g, '')) : 0,
          petRent: listingPricing.petRent ? Number(listingPricing.petRent.replace(/,/g, '')) : 0,
          shortestLeaseLength: listingPricing.shortestStay || 1,
          longestLeaseLength: listingPricing.longestStay || 12,
          shortestLeasePrice: 0, // Deprecated
          longestLeasePrice: 0, // Deprecated
          requireBackgroundCheck: true,
          // Highlights
          category: listingHighlights.category,
          petsAllowed: listingHighlights.petsAllowed || false,
          furnished: listingHighlights.furnished || false,
          // Photos and amenities
          listingPhotos: listingPhotos,
          selectedPhotos: selectedPhotos,
          amenities: listingAmenities,
          monthlyPricing: listingPricing.monthlyPricing.map(p => ({
            months: p.months,
            price: p.price ? Number(p.price.replace(/,/g, '')) : 0,
            utilitiesIncluded: p.utilitiesIncluded
          }))
        };

        // Always use the normal submission logic - the helper will handle draft vs non-draft internally
        // If there's a draftId, the draft will be automatically deleted after successful listing creation
        const createdListing = await handleSubmitListingHelper(
          listingData,
          user?.id || '',
          draftId || null
        );

        setCreatedListingId(createdListing.id);

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

  // No longer need to load draft data in useEffect - it's passed as prop and initialized directly

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
      squareFootage: listingRooms.squareFeet ? Number(listingRooms.squareFeet.replace(/,/g, '')) : null,
      // Sync amenities
      amenities: listingAmenities,
      // Sync pricing
      shortestLeaseLength: listingPricing.shortestStay,
      longestLeaseLength: listingPricing.longestStay,
      shortestLeasePrice: 0, // Deprecated
      longestLeasePrice: 0, // Deprecated
      depositSize: listingPricing.deposit ? Number(listingPricing.deposit.replace(/,/g, '')) : null,
    }));
  }, [listingHighlights, listingLocation, listingRooms, listingAmenities, listingPricing]);


  // Render different content based on the current step
  const renderStepContent = () => {
    console.log('🎨 Rendering step content for step:', currentStep);
    console.log('📊 Current state values:', {
      highlights: listingHighlights,
      location: listingLocation,
      rooms: listingRooms,
      basics: listingBasics,
      amenities: listingAmenities
    });
    
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
            petDeposit={listingPricing.petDeposit}
            petRent={listingPricing.petRent}
            onDepositChange={(value) => setListingPricing(prev => ({ ...prev, deposit: value }))}
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
          <ListingCreationSuccess 
            isSaveAndExit={isSaveAndExit} 
            listingId={createdListingId} 
          />
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
      case 10: return { title: 'What deposits and additional costs do you require?', subtitle: 'Set your security deposit and any pet-related fees' };
      case 11: return { title: 'Review your listing' };
      default: return { title: 'Create Listing' };
    }
  };

  // No longer need loading state since data is passed as prop

  return (
    <main className="bg-background flex flex-row justify-center w-full">
      <div className="bg-background overflow-auto w-full max-w-[1920px] relative" style={{ paddingBottom: (currentStep !== 12 || (isAdmin && !adminModeDisabled)) ? '160px' : '0' }}>

        {/* Mobile restructured header */}
        {currentStep !== 12 && (
          <div className="w-full max-w-[883px] mx-auto">
            {/* Title row - title on left, video button on right for medium+ */}
            <div className="px-4 pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
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
                {/* Video button - hidden on mobile, shown on medium+ */}
                <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                  <DialogTrigger asChild>
                    <BrandButton 
                      variant="ghost"
                      size="sm"
                      className="hidden md:block text-sm ml-4 whitespace-nowrap text-primaryBrand"
                    >
                      Watch Upload Tutorial
                    </BrandButton>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
            
            {/* Mobile video button - shown on mobile only, below title */}
            <div className="px-0 pt-2 md:hidden">
              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <BrandButton 
                    variant="ghost"
                    size="sm"
                    className="text-sm whitespace-nowrap text-primaryBrand"
                  >
                    Watch Upload Tutorial
                  </BrandButton>
                </DialogTrigger>
              </Dialog>
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
                    data-testid="next-button"
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
              /* Regular user footer - Back and Next buttons */
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
                  data-testid="next-button"
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
        
        {/* Video Tutorial Dialog */}
        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogContent className="w-full h-auto max-h-[90dvh] md:w-[80vw] md:h-auto md:max-w-none fixed top-[15vh] md:top-[22vh] left-[50%] translate-x-[-50%] translate-y-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              <h2 className="text-xl text-center font-semibold text-gray-900">Listing Upload Tutorial</h2>
              <div className="w-full flex-1 min-h-0">
                <video 
                  controls 
                  autoPlay
                  className="w-full h-full max-h-[70dvh]  object-contain rounded-lg"
                  preload="metadata"
                >
                  <source 
                    src="/videos/tutorials/listing-upload/Listing Upload Walkthrough.mov" 
                    type="video/quicktime"
                  />
                  <source 
                    src="/videos/tutorials/listing-upload/Listing Upload Walkthrough.mov" 
                    type="video/mp4"
                  />
                  Your browser does not support the video tag. Please try a different browser or download the video to view it.
                </video>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
      </div>
    </main>
  );
};
