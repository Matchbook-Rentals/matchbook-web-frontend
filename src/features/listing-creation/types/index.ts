/**
 * Consolidated type definitions for listing creation feature
 * Extracted from src/lib/listing-actions-helpers.ts
 */

// ====================
// MAIN DATA STRUCTURES
// ====================

/**
 * Complete listing data structure used when creating a published listing
 */
export interface ListingData {
  /** Array of images associated with the listing */
  listingImages?: Array<{
    url: string;
    category?: string | null;
    rank?: number | null;
  }>;
  /** Monthly pricing tiers for the listing */
  monthlyPricing?: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;
  /** Allow additional dynamic properties */
  [key: string]: any;
}

/**
 * Draft data structure for work-in-progress listings
 * All fields are optional to support incremental saving
 */
export interface DraftData {
  /** Unique identifier for the draft */
  id?: string;
  /** Listing title */
  title?: string | null;
  /** Detailed description of the property */
  description?: string | null;
  /** Current status of the draft */
  status?: string;

  // Location information
  /** Full address string */
  locationString?: string | null;
  /** Latitude coordinate */
  latitude?: number | null;
  /** Longitude coordinate */
  longitude?: number | null;
  /** City name */
  city?: string | null;
  /** State/Province */
  state?: string | null;
  /** Primary street address */
  streetAddress1?: string | null;
  /** Secondary address line (apt, suite, etc.) */
  streetAddress2?: string | null;
  /** Postal/ZIP code */
  postalCode?: string | null;

  // Property details
  /** Number of bedrooms */
  roomCount?: number | null;
  /** Number of bathrooms */
  bathroomCount?: number | null;
  /** Maximum number of guests */
  guestCount?: number | null;
  /** Property square footage */
  squareFootage?: number | null;

  // Financial details
  /** Security deposit amount */
  depositSize?: number | null;
  /** Pet deposit amount */
  petDeposit?: number | null;
  /** Monthly pet rent */
  petRent?: number | null;
  /** Amount due at booking */
  rentDueAtBooking?: number | null;
  /** Minimum lease duration in months */
  shortestLeaseLength?: number | null;
  /** Maximum lease duration in months */
  longestLeaseLength?: number | null;
  /** Price for shortest lease */
  shortestLeasePrice?: number | null;
  /** Price for longest lease */
  longestLeasePrice?: number | null;

  // Property characteristics
  /** Whether background check is required */
  requireBackgroundCheck?: boolean | null;
  /** Property type (apartment, house, etc.) */
  category?: string | null;
  /** Whether pets are allowed */
  petsAllowed?: boolean | null;
  /** Whether property comes furnished */
  furnished?: boolean | null;

  // Media and pricing
  /** Array of images with ranking */
  listingImages?: Array<{
    url: string;
    rank?: number | null;
  }>;
  /** Monthly pricing options */
  monthlyPricing?: Array<{
    months: number;
    price: number;
    utilitiesIncluded: boolean;
  }>;

  /** Allow additional dynamic properties */
  [key: string]: any;
}

// ===============================
// FORM STEP VALIDATION INTERFACES
// ===============================

/**
 * Data structure for property highlights step
 */
export interface ListingHighlights {
  /** Property type (apartment, house, etc.) */
  category: string | null;
  /** Whether pets are allowed */
  petsAllowed: boolean | null;
  /** Whether property comes furnished */
  furnished: boolean | null;
}

/**
 * Data structure for location information step
 */
export interface ListingLocation {
  /** Full formatted address string */
  locationString: string | null;
  /** Latitude coordinate */
  latitude: number | null;
  /** Longitude coordinate */
  longitude: number | null;
  /** City name */
  city: string | null;
  /** State/Province */
  state: string | null;
  /** Primary street address */
  streetAddress1: string | null;
  /** Secondary address line (apt, suite, etc.) */
  streetAddress2: string | null;
  /** Postal/ZIP code */
  postalCode: string | null;
  /** Country (optional) */
  country?: string | null;
}

/**
 * Data structure for room information step
 */
export interface ListingRooms {
  /** Number of bedrooms */
  bedrooms: number;
  /** Number of bathrooms */
  bathrooms: number;
  /** Square footage as string */
  squareFeet: string;
}

/**
 * Data structure for basic listing information step
 */
export interface ListingBasics {
  /** Listing title */
  title: string;
  /** Detailed description */
  description: string;
}

/**
 * Data structure for monthly pricing options
 */
export interface MonthlyPricing {
  /** Number of months for this pricing tier */
  months: number;
  /** Price as string (for form input) */
  price: string;
  /** Whether utilities are included */
  utilitiesIncluded: boolean;
}

/**
 * Data structure for pricing step
 */
export interface ListingPricing {
  /** Shortest lease duration in months */
  shortestStay: number;
  /** Longest lease duration in months */
  longestStay: number;
  /** Array of monthly pricing options */
  monthlyPricing: MonthlyPricing[];
  /** Security deposit amount as string */
  deposit: string;
  /** Pet deposit amount as string */
  petDeposit: string;
  /** Monthly pet rent as string */
  petRent: string;
  /** Amount due at booking as string */
  rentDueAtBooking: string;
}

/**
 * Data structure for listing images with nullable fields
 */
export interface NullableListingImage {
  /** Unique image ID */
  id: string | null;
  /** Image URL */
  url: string | null;
  /** Associated listing ID */
  listingId: string | null;
  /** Image category (bedroom, living room, etc.) */
  category: string | null;
  /** Display order rank */
  rank: number | null;
}

// ===========================
// FORM MANAGEMENT INTERFACES
// ===========================

/**
 * Extended form data with additional state management fields
 */
export interface ListingFormData extends DraftData {
  /** Current step in the form flow */
  currentStep?: number;
  /** Whether current step has been validated */
  isValidated?: boolean;
  /** Validation errors for current step */
  errors?: Record<string, string[]>;
}

/**
 * Complete state management interface for listing creation
 */
export interface ListingCreationState {
  /** Current form data */
  formData: ListingFormData;
  /** Current step index */
  currentStep: number;
  /** Validation errors by step */
  validationErrors: Record<number, string[]>;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Whether form has unsaved changes */
  isDirty: boolean;
}

// ===================
// UTILITY TYPE UNIONS
// ===================

/**
 * Union type for all possible form step data
 */
export type FormStepData = 
  | ListingHighlights
  | ListingLocation
  | ListingRooms
  | ListingBasics
  | ListingPricing
  | NullableListingImage[];

/**
 * Union type for validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};