import { ListingData, DraftData } from '../../src/lib/listing-actions-helpers';

// Comprehensive fake listing data for testing
export const createFakeListingData = (): ListingData => ({
  // Basic information
  title: 'Beautiful Downtown Apartment with City Views',
  description: 'This stunning 2-bedroom, 2-bathroom apartment offers breathtaking city views and modern amenities. Located in the heart of downtown, you\'ll be walking distance to restaurants, shops, and public transportation. The apartment features an open-concept living area, updated kitchen with stainless steel appliances, in-unit washer and dryer, and a private balcony. Perfect for young professionals or small families looking for luxury living in the city center.',
  
  // Location details
  locationString: '123 Main Street, Downtown, TX 75201',
  streetAddress1: '123 Main Street',
  streetAddress2: 'Apt 4B',
  city: 'Dallas',
  state: 'TX',
  postalCode: '75201',
  latitude: 32.7767,
  longitude: -96.7970,
  
  // Property details
  category: 'Apartment',
  roomCount: 2,
  bathroomCount: 2,
  guestCount: 4,
  squareFootage: 1200,
  
  // Pricing information
  shortestLeaseLength: 1,
  longestLeaseLength: 12,
  depositSize: 2000,
  petDeposit: 500,
  petRent: 50,
  rentDueAtBooking: 1500,
  
  // Policies
  furnished: true,
  petsAllowed: true,
  requireBackgroundCheck: true,
  
  // Amenities - Kitchen
  kitchen: true,
  oven: true,
  stove: true,
  fridge: true,
  microwave: true,
  dishwasher: true,
  garbageDisposal: true,
  kitchenEssentials: true,
  
  // Amenities - Laundry
  washerInUnit: true,
  dryerInUnit: true,
  
  // Amenities - Parking
  parking: true,
  coveredParking: true,
  coveredParkingFree: false,
  
  // Amenities - Technology
  wifi: true,
  tv: true,
  
  // Amenities - Comfort
  airConditioner: true,
  heater: true,
  balcony: true,
  cityView: true,
  
  // Amenities - Safety & Security
  smokeDetector: true,
  carbonMonoxide: true,
  keylessEntry: true,
  secureLobby: true,
  
  // Amenities - Building
  elevator: true,
  fitnessCenter: true,
  
  // Amenities - Workspace
  dedicatedWorkspace: true,
  workstation: true,
  
  // Amenities - Personal Care
  hairDryer: true,
  iron: true,
  linens: true,
  privateBathroom: true,
  
  // Set all other amenities to false
  laundryFacilities: false,
  wheelchairAccess: false,
  doorman: false,
  hotTub: false,
  smokingAllowed: false,
  eventsAllowed: false,
  privateEntrance: false,
  security: false,
  waterfront: false,
  beachfront: false,
  mountainView: false,
  waterView: false,
  washerHookup: false,
  washerNotAvailable: false,
  washerInComplex: false,
  dryerHookup: false,
  dryerNotAvailable: false,
  dryerInComplex: false,
  offStreetParking: false,
  streetParking: false,
  streetParkingFree: false,
  uncoveredParking: false,
  uncoveredParkingFree: false,
  garageParking: false,
  garageParkingFree: false,
  evCharging: false,
  allowDogs: true,
  allowCats: true,
  gym: false,
  patio: false,
  sunroom: false,
  fireplace: false,
  firepit: false,
  pool: false,
  sauna: false,
  jacuzzi: false,
  grill: false,
  wheelAccessible: false,
  fencedInYard: false,
  alarmSystem: false,
  storageShed: false,
  gatedEntry: false,
  
  // Listing images
  listingImages: [
    {
      url: 'https://example.com/images/living-room.jpg',
      category: 'living_room',
      rank: 1,
    },
    {
      url: 'https://example.com/images/kitchen.jpg',
      category: 'kitchen',
      rank: 2,
    },
    {
      url: 'https://example.com/images/bedroom1.jpg',
      category: 'bedroom',
      rank: 3,
    },
    {
      url: 'https://example.com/images/bathroom1.jpg',
      category: 'bathroom',
      rank: 4,
    },
    {
      url: 'https://example.com/images/balcony.jpg',
      category: 'outdoor',
      rank: 5,
    },
    {
      url: 'https://example.com/images/bedroom2.jpg',
      category: 'bedroom',
      rank: 6,
    },
    {
      url: 'https://example.com/images/bathroom2.jpg',
      category: 'bathroom',
      rank: 7,
    },
    {
      url: 'https://example.com/images/building-exterior.jpg',
      category: 'exterior',
      rank: 8,
    },
  ],
  
  // Monthly pricing
  monthlyPricing: [
    { months: 1, price: 2500, utilitiesIncluded: false },
    { months: 2, price: 2400, utilitiesIncluded: false },
    { months: 3, price: 2300, utilitiesIncluded: true },
    { months: 4, price: 2200, utilitiesIncluded: true },
    { months: 5, price: 2100, utilitiesIncluded: true },
    { months: 6, price: 2000, utilitiesIncluded: true },
    { months: 7, price: 1950, utilitiesIncluded: true },
    { months: 8, price: 1900, utilitiesIncluded: true },
    { months: 9, price: 1850, utilitiesIncluded: true },
    { months: 10, price: 1800, utilitiesIncluded: true },
    { months: 11, price: 1750, utilitiesIncluded: true },
    { months: 12, price: 1700, utilitiesIncluded: true },
  ],
});

// Create fake draft data
export const createFakeDraftData = (): DraftData => ({
  title: 'Draft - Cozy Studio in Arts District',
  description: 'A charming studio apartment in the vibrant Arts District. Features exposed brick walls, high ceilings, and large windows. Perfect for artists and creative professionals.',
  status: 'draft',
  
  // Location details
  locationString: '456 Arts Avenue, Arts District, TX 75226',
  streetAddress1: '456 Arts Avenue',
  streetAddress2: 'Unit 2A',
  city: 'Dallas',
  state: 'TX',
  postalCode: '75226',
  latitude: 32.7849,
  longitude: -96.7856,
  
  // Property details
  category: 'Studio',
  roomCount: 1,
  bathroomCount: 1,
  guestCount: 2,
  squareFootage: 650,
  
  // Pricing
  shortestLeaseLength: 3,
  longestLeaseLength: 12,
  depositSize: 1200,
  petDeposit: 300,
  petRent: 25,
  rentDueAtBooking: 800,
  
  // Policies
  furnished: false,
  petsAllowed: true,
  requireBackgroundCheck: true,
  
  // Some amenities (fewer than full listing)
  kitchen: true,
  wifi: true,
  airConditioner: true,
  heater: true,
  washerInComplex: true,
  dryerInComplex: true,
  streetParking: true,
  streetParkingFree: true,
  
  // Draft images
  listingImages: [
    {
      url: 'https://example.com/images/studio-main.jpg',
      rank: 1,
    },
    {
      url: 'https://example.com/images/studio-kitchen.jpg',
      rank: 2,
    },
    {
      url: 'https://example.com/images/studio-bathroom.jpg',
      rank: 3,
    },
    {
      url: 'https://example.com/images/studio-exterior.jpg',
      rank: 4,
    },
  ],
  
  // Monthly pricing for draft
  monthlyPricing: [
    { months: 3, price: 1200, utilitiesIncluded: false },
    { months: 6, price: 1100, utilitiesIncluded: true },
    { months: 9, price: 1000, utilitiesIncluded: true },
    { months: 12, price: 950, utilitiesIncluded: true },
  ],
});

// Minimal listing data for testing edge cases
export const createMinimalListingData = (): ListingData => ({
  title: 'Minimal Test Listing',
  description: 'Basic listing for testing with minimal required fields.',
  category: 'Apartment',
  locationString: '789 Test St, Test City, TX 12345',
  city: 'Test City',
  state: 'TX',
  postalCode: '12345',
  roomCount: 1,
  bathroomCount: 1,
  guestCount: 1,
  squareFootage: 500,
  depositSize: 500,
  shortestLeaseLength: 1,
  longestLeaseLength: 6,
  monthlyPricing: [
    { months: 1, price: 800, utilitiesIncluded: false },
    { months: 6, price: 750, utilitiesIncluded: false },
  ],
});

// All amenities selected listing data for testing
export const createAllAmenitiesListingData = (): ListingData => ({
  // Basic information
  title: 'Luxury Penthouse with Every Amenity',
  description: 'This is the ultimate luxury penthouse featuring every single amenity available. From in-unit laundry to rooftop pool, this property has it all. Perfect for those who want the absolute best in luxury living.',
  
  // Location details
  locationString: '999 Luxury Lane, Penthouse, TX 75204',
  streetAddress1: '999 Luxury Lane',
  streetAddress2: 'Penthouse Suite',
  city: 'Dallas',
  state: 'TX',
  postalCode: '75204',
  latitude: 32.7800,
  longitude: -96.8000,
  
  // Property details
  category: 'Penthouse',
  roomCount: 4,
  bathroomCount: 3,
  guestCount: 8,
  squareFootage: 3000,
  
  // Pricing information
  shortestLeaseLength: 1,
  longestLeaseLength: 24,
  depositSize: 10000,
  petDeposit: 1000,
  petRent: 200,
  rentDueAtBooking: 8000,
  
  // Policies
  furnished: true,
  petsAllowed: true,
  requireBackgroundCheck: true,
  
  // ALL AMENITIES SET TO TRUE
  // Kitchen
  kitchen: true,
  oven: true,
  stove: true,
  fridge: true,
  microwave: true,
  dishwasher: true,
  garbageDisposal: true,
  kitchenEssentials: true,
  
  // Laundry (in-unit selected)
  washerInUnit: true,
  dryerInUnit: true,
  washerHookup: true,
  washerNotAvailable: false, // Only false one in this group
  washerInComplex: true,
  dryerHookup: true,
  dryerNotAvailable: false, // Only false one in this group  
  dryerInComplex: true,
  laundryFacilities: true,
  
  // Parking
  parking: true,
  offStreetParking: true,
  streetParking: true,
  streetParkingFree: true,
  coveredParking: true,
  coveredParkingFree: true,
  uncoveredParking: true,
  uncoveredParkingFree: true,
  garageParking: true,
  garageParkingFree: true,
  evCharging: true,
  
  // Technology
  wifi: true,
  tv: true,
  
  // Comfort & Views
  airConditioner: true,
  heater: true,
  balcony: true,
  patio: true,
  sunroom: true,
  fireplace: true,
  firepit: true,
  cityView: true,
  waterView: true,
  mountainView: true,
  waterfront: true,
  beachfront: true,
  
  // Safety & Security
  smokeDetector: true,
  carbonMonoxide: true,
  keylessEntry: true,
  secureLobby: true,
  security: true,
  wheelchairAccess: true,
  wheelAccessible: true,
  alarmSystem: true,
  gatedEntry: true,
  
  // Building Amenities
  elevator: true,
  fitnessCenter: true,
  doorman: true,
  gym: true,
  pool: true,
  sauna: true,
  jacuzzi: true,
  hotTub: true,
  
  // Workspace
  dedicatedWorkspace: true,
  workstation: true,
  
  // Personal Care
  hairDryer: true,
  iron: true,
  linens: true,
  privateBathroom: true,
  
  // Lifestyle
  smokingAllowed: true,
  eventsAllowed: true,
  privateEntrance: true,
  fencedInYard: true,
  storageShed: true,
  grill: true,
  
  // Pets
  allowDogs: true,
  allowCats: true,
  
  // Listing images
  listingImages: [
    {
      url: 'https://example.com/images/penthouse-living.jpg',
      category: 'living_room',
      rank: 1,
    },
    {
      url: 'https://example.com/images/penthouse-kitchen.jpg',
      category: 'kitchen',
      rank: 2,
    },
    {
      url: 'https://example.com/images/penthouse-master.jpg',
      category: 'bedroom',
      rank: 3,
    },
    {
      url: 'https://example.com/images/penthouse-pool.jpg',
      category: 'amenity',
      rank: 4,
    },
  ],
  
  // Monthly pricing
  monthlyPricing: [
    { months: 1, price: 8000, utilitiesIncluded: true },
    { months: 6, price: 7500, utilitiesIncluded: true },
    { months: 12, price: 7000, utilitiesIncluded: true },
  ],
});

// Washer not available only listing data for testing
export const createWasherNotAvailableListingData = (): ListingData => ({
  // Basic information
  title: 'Basic Apartment - Laundromat Nearby',
  description: 'Simple apartment with no in-unit laundry. Convenient laundromat located just 2 blocks away.',
  
  // Location details
  locationString: '100 Simple St, Budget Area, TX 75001',
  streetAddress1: '100 Simple St',
  streetAddress2: 'Apt 1A',
  city: 'Dallas',
  state: 'TX',
  postalCode: '75001',
  latitude: 32.7700,
  longitude: -96.7900,
  
  // Property details
  category: 'Apartment',
  roomCount: 1,
  bathroomCount: 1,
  guestCount: 2,
  squareFootage: 600,
  
  // Pricing information
  shortestLeaseLength: 1,
  longestLeaseLength: 12,
  depositSize: 800,
  petDeposit: 0,
  petRent: 0,
  rentDueAtBooking: 600,
  
  // Policies
  furnished: false,
  petsAllowed: false,
  requireBackgroundCheck: false,
  
  // ALL AMENITIES SET TO FALSE EXCEPT washerNotAvailable
  // Kitchen
  kitchen: false,
  oven: false,
  stove: false,
  fridge: false,
  microwave: false,
  dishwasher: false,
  garbageDisposal: false,
  kitchenEssentials: false,
  
  // Laundry (ONLY washerNotAvailable is true)
  washerInUnit: false,
  dryerInUnit: false,
  washerHookup: false,
  washerNotAvailable: true, // ONLY TRUE AMENITY
  washerInComplex: false,
  dryerHookup: false,
  dryerNotAvailable: false,
  dryerInComplex: false,
  laundryFacilities: false,
  
  // Parking
  parking: false,
  offStreetParking: false,
  streetParking: false,
  streetParkingFree: false,
  coveredParking: false,
  coveredParkingFree: false,
  uncoveredParking: false,
  uncoveredParkingFree: false,
  garageParking: false,
  garageParkingFree: false,
  evCharging: false,
  
  // Technology
  wifi: false,
  tv: false,
  
  // Comfort & Views
  airConditioner: false,
  heater: false,
  balcony: false,
  patio: false,
  sunroom: false,
  fireplace: false,
  firepit: false,
  cityView: false,
  waterView: false,
  mountainView: false,
  waterfront: false,
  beachfront: false,
  
  // Safety & Security
  smokeDetector: false,
  carbonMonoxide: false,
  keylessEntry: false,
  secureLobby: false,
  security: false,
  wheelchairAccess: false,
  wheelAccessible: false,
  alarmSystem: false,
  gatedEntry: false,
  
  // Building Amenities
  elevator: false,
  fitnessCenter: false,
  doorman: false,
  gym: false,
  pool: false,
  sauna: false,
  jacuzzi: false,
  hotTub: false,
  
  // Workspace
  dedicatedWorkspace: false,
  workstation: false,
  
  // Personal Care
  hairDryer: false,
  iron: false,
  linens: false,
  privateBathroom: false,
  
  // Lifestyle
  smokingAllowed: false,
  eventsAllowed: false,
  privateEntrance: false,
  fencedInYard: false,
  storageShed: false,
  grill: false,
  
  // Pets
  allowDogs: false,
  allowCats: false,
  
  // Listing images
  listingImages: [
    {
      url: 'https://example.com/images/basic-apartment.jpg',
      category: 'living_room',
      rank: 1,
    },
  ],
  
  // Monthly pricing
  monthlyPricing: [
    { months: 1, price: 600, utilitiesIncluded: false },
    { months: 12, price: 550, utilitiesIncluded: false },
  ],
});

// Create fake data in add-property-client format
export const createFakeAddPropertyClientData = () => ({
  title: 'Test Property from Client',
  description: 'This is a test property created from the add-property-client format',
  category: 'Apartment',
  petsAllowed: true,
  furnished: true,
  locationString: '123 Test St, Test City, TX 12345',
  latitude: 32.7767,
  longitude: -96.7970,
  city: 'Test City',
  state: 'TX',
  streetAddress1: '123 Test St',
  streetAddress2: 'Unit 1',
  postalCode: '12345',
  roomCount: 2,
  bathroomCount: 2,
  guestCount: 4,
  squareFootage: 1000,
  depositSize: 1500,
  petDeposit: 500,
  petRent: 50,
  rentDueAtBooking: 1200,
  shortestLeaseLength: 1,
  longestLeaseLength: 12,
  listingImages: [
    { url: 'https://example.com/photo1.jpg', rank: null },
    { url: 'https://example.com/photo2.jpg', rank: null },
    { url: 'https://example.com/photo3.jpg', rank: null },
    { url: 'https://example.com/photo4.jpg', rank: null },
    { url: 'https://example.com/photo5.jpg', rank: null }
  ],
  monthlyPricing: [
    { months: 1, price: 1500, utilitiesIncluded: false },
    { months: 6, price: 1400, utilitiesIncluded: true },
    { months: 12, price: 1300, utilitiesIncluded: true }
  ]
});

// Invalid listing data for testing validation
export const createInvalidListingData = (): Partial<ListingData> => ({
  // Missing required fields like title, description, etc.
  category: 'Apartment',
  roomCount: 0, // Invalid - should be at least 1
  bathroomCount: 0, // Invalid - should be at least 1
  // Missing required location fields
  // Missing required pricing fields
});

// ===========================================
// VALIDATION TEST DATA FIXTURES
// ===========================================

import type {
  ListingHighlights,
  ListingLocation,
  ListingRooms,
  ListingBasics,
  ListingPricing,
  MonthlyPricing,
  NullableListingImage
} from '../../src/lib/listing-actions-helpers';

// Valid highlights data
export const createValidHighlights = (): ListingHighlights => ({
  category: 'Apartment',
  petsAllowed: true,
  furnished: false
});

// Invalid highlights data (missing required fields)
export const createInvalidHighlights = (): ListingHighlights => ({
  category: null, // Missing
  petsAllowed: null, // Missing
  furnished: null // Missing
});

// Valid location data
export const createValidLocation = (): ListingLocation => ({
  locationString: '123 Main St, Dallas, TX 75201',
  latitude: 32.7767,
  longitude: -96.7970,
  city: 'Dallas',
  state: 'TX',
  streetAddress1: '123 Main St',
  streetAddress2: 'Apt 4B',
  postalCode: '75201',
  country: 'United States'
});

// Invalid location data (missing required fields)
export const createInvalidLocation = (): ListingLocation => ({
  locationString: null,
  latitude: null,
  longitude: null,
  city: null, // Missing
  state: null, // Missing
  streetAddress1: null, // Missing
  streetAddress2: null,
  postalCode: null, // Missing
  country: 'United States'
});

// Valid rooms data
export const createValidRooms = (): ListingRooms => ({
  bedrooms: 2,
  bathrooms: 2,
  squareFeet: '1200'
});

// Invalid rooms data
export const createInvalidRooms = (): ListingRooms => ({
  bedrooms: 0, // Invalid - should be at least 1
  bathrooms: 0, // Invalid - should be at least 1
  squareFeet: '' // Missing
});

// Valid basics data
export const createValidBasics = (): ListingBasics => ({
  title: 'Beautiful Downtown Apartment',
  description: 'This stunning 2-bedroom, 2-bathroom apartment offers breathtaking city views and modern amenities.'
});

// Invalid basics data
export const createInvalidBasics = (): ListingBasics => ({
  title: '', // Missing
  description: 'Short' // Too short (less than 20 characters)
});

// Valid photos (4+ photos)
export const createValidPhotos = (): NullableListingImage[] => [
  { id: '1', url: 'https://example.com/photo1.jpg', listingId: 'test', category: 'living_room', rank: 1 },
  { id: '2', url: 'https://example.com/photo2.jpg', listingId: 'test', category: 'bedroom', rank: 2 },
  { id: '3', url: 'https://example.com/photo3.jpg', listingId: 'test', category: 'kitchen', rank: 3 },
  { id: '4', url: 'https://example.com/photo4.jpg', listingId: 'test', category: 'bathroom', rank: 4 },
  { id: '5', url: 'https://example.com/photo5.jpg', listingId: 'test', category: 'exterior', rank: 5 }
];

// Invalid photos (too few)
export const createInvalidPhotos = (): NullableListingImage[] => [
  { id: '1', url: 'https://example.com/photo1.jpg', listingId: 'test', category: 'living_room', rank: 1 }
];

// createValidSelectedPhotos and createInvalidSelectedPhotos removed
// selectedPhotos field is not part of the database schema

// Valid amenities (includes required laundry option)
export const createValidAmenities = (): string[] => [
  'kitchen',
  'wifi',
  'airConditioner',
  'washerInUnit', // Required laundry option
  'parking',
  'gym'
];

// Invalid amenities (missing required laundry option)
export const createInvalidAmenities = (): string[] => [
  'kitchen',
  'wifi',
  'airConditioner',
  'parking',
  'gym'
  // Missing required laundry option
];

// Create complete monthly pricing (1-12 months)
export const createCompleteMonthlyPricing = (): MonthlyPricing[] => [
  { months: 1, price: '2500', utilitiesIncluded: false },
  { months: 2, price: '2400', utilitiesIncluded: false },
  { months: 3, price: '2300', utilitiesIncluded: true },
  { months: 4, price: '2200', utilitiesIncluded: true },
  { months: 5, price: '2100', utilitiesIncluded: true },
  { months: 6, price: '2000', utilitiesIncluded: true },
  { months: 7, price: '1950', utilitiesIncluded: true },
  { months: 8, price: '1900', utilitiesIncluded: true },
  { months: 9, price: '1850', utilitiesIncluded: true },
  { months: 10, price: '1800', utilitiesIncluded: true },
  { months: 11, price: '1750', utilitiesIncluded: true },
  { months: 12, price: '1700', utilitiesIncluded: true }
];

// Monthly pricing with missing prices (empty strings)
export const createMissingPricesMonthlyPricing = (): MonthlyPricing[] => [
  { months: 1, price: '2500', utilitiesIncluded: false },
  { months: 2, price: '', utilitiesIncluded: false }, // Missing
  { months: 3, price: '2300', utilitiesIncluded: true },
  { months: 4, price: '', utilitiesIncluded: true }, // Missing
  { months: 5, price: '2100', utilitiesIncluded: true },
  { months: 6, price: '2000', utilitiesIncluded: true }
];

// Monthly pricing with zero prices (should be valid)
export const createZeroPricesMonthlyPricing = (): MonthlyPricing[] => [
  { months: 1, price: '0', utilitiesIncluded: false }, // Zero is valid
  { months: 2, price: '0', utilitiesIncluded: false },
  { months: 3, price: '2300', utilitiesIncluded: true }
];

// Monthly pricing with invalid prices (negative, non-numeric)
export const createInvalidPricesMonthlyPricing = (): MonthlyPricing[] => [
  { months: 1, price: '2500', utilitiesIncluded: false },
  { months: 2, price: '-100', utilitiesIncluded: false }, // Negative
  { months: 3, price: 'abc', utilitiesIncluded: true }, // Non-numeric
  { months: 4, price: '2200.50', utilitiesIncluded: true } // Decimal (should be valid)
];

// Valid pricing data (basic settings)
export const createValidPricing = (): ListingPricing => ({
  shortestStay: 1,
  longestStay: 12,
  monthlyPricing: createCompleteMonthlyPricing(),
  deposit: '2000',
  petDeposit: '500',
  petRent: '50',
  rentDueAtBooking: '1500'
});

// Invalid pricing data (invalid stay lengths)
export const createInvalidPricingSettings = (): ListingPricing => ({
  shortestStay: 0, // Invalid - should be 1-12
  longestStay: 15, // Invalid - should be 1-12
  monthlyPricing: createCompleteMonthlyPricing(),
  deposit: '2000',
  petDeposit: '500',
  petRent: '50',
  rentDueAtBooking: '1500'
});

// Pricing with missing price entries
export const createPricingWithMissingPrices = (): ListingPricing => ({
  shortestStay: 1,
  longestStay: 6,
  monthlyPricing: createMissingPricesMonthlyPricing(),
  deposit: '2000',
  petDeposit: '500',
  petRent: '50',
  rentDueAtBooking: '1500'
});

// Pricing with invalid deposits (rent due exceeds monthly rent)
export const createPricingWithInvalidDeposits = (): ListingPricing => ({
  shortestStay: 1,
  longestStay: 3,
  monthlyPricing: [
    { months: 1, price: '1000', utilitiesIncluded: false },
    { months: 2, price: '900', utilitiesIncluded: false },
    { months: 3, price: '800', utilitiesIncluded: true }
  ],
  deposit: '2000',
  petDeposit: '500',
  petRent: '50',
  rentDueAtBooking: '1200' // Exceeds lowest monthly rent (800)
});

// Complete valid form data for testing validateAllSteps
export const createValidFormData = () => ({
  listingHighlights: createValidHighlights(),
  listingLocation: createValidLocation(),
  listingRooms: createValidRooms(),
  listingBasics: createValidBasics(),
  listingImages: createValidPhotos(),
  listingAmenities: createValidAmenities(),
  listingPricing: createValidPricing()
});

// Form data with multiple validation errors
export const createInvalidFormData = () => ({
  listingHighlights: createInvalidHighlights(),
  listingLocation: createInvalidLocation(),
  listingRooms: createInvalidRooms(),
  listingBasics: createInvalidBasics(),
  listingImages: createInvalidPhotos(),
  listingAmenities: createInvalidAmenities(),
  listingPricing: createPricingWithMissingPrices()
});
