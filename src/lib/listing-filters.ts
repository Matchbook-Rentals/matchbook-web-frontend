import { ListingAndImages } from '@/types';
import { subDays, addDays, differenceInDays, isValid } from 'date-fns';
import { getUtilitiesIncluded } from './calculate-rent';

export interface FilterOptions {
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number;
  minBeds: number | null;
  minBathrooms: number;
  furnished: boolean;
  unfurnished: boolean;
  utilities: string[];
  pets: string[];
  searchRadius: number;
  accessibility: string[];
  location: string[];
  parking: string[];
  kitchen: string[];
  basics: string[];
  luxury: string[];
  laundry: string[];
}

export interface ListingWithCalculations extends ListingAndImages {
  calculatedPrice?: number;
  isActuallyAvailable?: boolean;
  availableStart?: Date;
  availableEnd?: Date;
}

export interface TripDates {
  startDate: Date | null;
  endDate: Date | null;
  flexibleStart: number;
  flexibleEnd: number;
}

/**
 * Checks if a listing matches all filter criteria (except liked/disliked/requested status)
 */
export const matchesFilters = (
  listing: ListingWithCalculations,
  filters: FilterOptions,
  enableLogging = false,
  tripOrSession?: { startDate?: Date | null; endDate?: Date | null } | null
): boolean => {
  // Property type filter
  const matchesPropertyType = filters.propertyTypes.length === 0 ||
    filters.propertyTypes.includes(listing.category);

  // Price filter - use calculatedPrice if available
  const price = listing.calculatedPrice || 0;
  const matchesPrice =
    (filters.minPrice === null || price >= filters.minPrice) &&
    (filters.maxPrice === null || price <= filters.maxPrice);

  // Distance filter - treat >= 100 as unlimited, handle null distances gracefully
  const matchesRadius = filters.searchRadius >= 100 ||
    listing.distance === null ||
    listing.distance === undefined ||
    listing.distance <= filters.searchRadius;

  // Debug log for radius filtering (disabled for now)
  // if (enableLogging && (filters.searchRadius < 100 || listing.distance !== null)) {
  //   console.log(`🎯 Radius check for listing ${listing.id}: searchRadius=${filters.searchRadius}, distance=${listing.distance}, matches=${matchesRadius}`);
  // }

  // Room filters
  const matchesBedrooms = !filters.minBedrooms ||
    (listing.bedrooms?.length || 0) >= filters.minBedrooms;
  const matchesBaths = !filters.minBathrooms ||
    listing.bathroomCount >= filters.minBathrooms;

  // Furniture filter
  const matchesFurniture =
    (!filters.furnished && !filters.unfurnished) ||
    (filters.furnished && listing.furnished) ||
    (filters.unfurnished && !listing.furnished);

  // Utilities filter - use duration-specific pricing if trip/session dates available
  const utilitiesIncluded = tripOrSession
    ? getUtilitiesIncluded(listing as any, tripOrSession as any)
    : listing.utilitiesIncluded;

  const matchesUtilities =
    filters.utilities.length === 0 || filters.utilities.length === 2 ||
    (filters.utilities.includes('utilitiesIncluded') && utilitiesIncluded) ||
    (filters.utilities.includes('utilitiesNotIncluded') && !utilitiesIncluded);

  // Pets filter
  const matchesPets =
    filters.pets.length === 0 || filters.pets.length === 2 ||
    (filters.pets.includes('petsAllowed') && listing.petsAllowed) ||
    (filters.pets.includes('petsNotAllowed') && !listing.petsAllowed);

  // Amenity filters - check if all selected amenities are present
  const matchesAccessibility = filters.accessibility?.length === 0 ||
    filters.accessibility?.every(amenity => listing[amenity]);

  const matchesLocation = filters.location?.length === 0 ||
    filters.location?.every(feature => listing[feature]);

  const matchesParking = filters.parking?.length === 0 ||
    filters.parking?.every(option => listing[option]);

  const matchesKitchen = filters.kitchen?.length === 0 ||
    filters.kitchen?.every(appliance => listing[appliance]);

  const matchesBasics = filters.basics?.length === 0 ||
    filters.basics?.every(basic => listing[basic]);

  const matchesLuxury = filters.luxury?.length === 0 ||
    filters.luxury?.every(amenity => listing[amenity]);

  // Laundry filter - special handling for hierarchical options
  const matchesLaundry = filters.laundry?.length === 0 ||
    filters.laundry?.length === 3 || // All options selected = no filter
    filters.laundry?.some(option => listing[option]);

  // Availability check
  const isAvailable = listing.isActuallyAvailable !== false;

  return matchesPropertyType &&
    matchesPrice &&
    matchesRadius &&
    matchesBedrooms &&
    matchesBaths &&
    matchesFurniture &&
    matchesUtilities &&
    matchesPets &&
    matchesAccessibility &&
    matchesLocation &&
    matchesParking &&
    matchesKitchen &&
    matchesBasics &&
    matchesLuxury &&
    matchesLaundry &&
    isAvailable;
};

/**
 * Calculate availability for a listing based on trip dates and unavailable periods
 */
export const calculateListingAvailability = (
  listing: ListingAndImages,
  tripDates: TripDates
): {
  isActuallyAvailable: boolean;
  availableStart?: Date;
  availableEnd?: Date;
} => {
  const { startDate, endDate, flexibleStart, flexibleEnd } = tripDates;

  if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate) || endDate < startDate) {
    return { isActuallyAvailable: true }; // No date restrictions
  }

  const stayDurationDays = differenceInDays(endDate, startDate) + 1;
  const earliestValidStart = subDays(startDate, flexibleStart || 0);
  const latestValidEnd = addDays(endDate, flexibleEnd || 0);

  // Check if any placement is possible
  const isActuallyAvailable = !listing.unavailablePeriods?.some(period => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    if (!isValid(periodStart) || !isValid(periodEnd)) return false;

    const latestStartBeforePeriod = subDays(periodStart, stayDurationDays);
    const earliestStartAfterPeriod = addDays(periodEnd, 1);
    const endDateIfStartingAfter = addDays(earliestStartAfterPeriod, stayDurationDays - 1);

    const blockedBefore = latestStartBeforePeriod < earliestValidStart;
    const blockedAfter = endDateIfStartingAfter > latestValidEnd;

    return blockedBefore && blockedAfter;
  });

  if (!isActuallyAvailable) {
    return { isActuallyAvailable: false };
  }

  // Find earliest valid start date
  let availableStart: Date | undefined;
  let currentCheckStart = earliestValidStart;
  const latestPossibleStartDate = subDays(latestValidEnd, stayDurationDays - 1);

  while (currentCheckStart <= latestPossibleStartDate) {
    const currentCheckEnd = addDays(currentCheckStart, stayDurationDays - 1);

    const overlaps = listing.unavailablePeriods?.some(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      return isValid(pStart) && isValid(pEnd) &&
        currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
    });

    if (!overlaps) {
      availableStart = currentCheckStart;
      break;
    }

    const blockingPeriod = listing.unavailablePeriods?.find(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      return isValid(pStart) && isValid(pEnd) &&
        currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
    });

    currentCheckStart = blockingPeriod
      ? addDays(new Date(blockingPeriod.endDate), 1)
      : addDays(currentCheckStart, 1);
  }

  // Find latest valid end date
  let availableEnd: Date | undefined;
  let currentCheckEnd = latestValidEnd;

  while (currentCheckEnd >= addDays(earliestValidStart, stayDurationDays - 1)) {
    const currentCheckStart = subDays(currentCheckEnd, stayDurationDays - 1);
    if (currentCheckStart < earliestValidStart) break;

    const overlaps = listing.unavailablePeriods?.some(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      return isValid(pStart) && isValid(pEnd) &&
        currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
    });

    if (!overlaps) {
      availableEnd = currentCheckEnd;
      break;
    }

    const blockingPeriod = listing.unavailablePeriods?.find(p => {
      const pStart = new Date(p.startDate);
      const pEnd = new Date(p.endDate);
      return isValid(pStart) && isValid(pEnd) &&
        currentCheckStart < addDays(pEnd, 1) && currentCheckEnd >= pStart;
    });

    currentCheckEnd = blockingPeriod
      ? subDays(new Date(blockingPeriod.startDate), 1)
      : subDays(currentCheckEnd, 1);
  }

  return {
    isActuallyAvailable,
    availableStart,
    availableEnd
  };
};

/**
 * Convert UI filters to database filter format
 */
export const convertFiltersToDbFormat = (
  filters: FilterOptions,
  booleanFilterNames: string[]
): Record<string, any> => {
  const dbFilters: Record<string, any> = {
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    minBedrooms: filters.minBedrooms,
    minBathrooms: filters.minBathrooms,
    searchRadius: filters.searchRadius,
  };

  // Initialize all boolean filters to false
  booleanFilterNames.forEach(name => {
    dbFilters[name] = false;
  });

  // Set true for filters selected in the filters object
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle array filters
      value.forEach(selectedValue => {
        if (booleanFilterNames.includes(selectedValue)) {
          dbFilters[selectedValue] = true;
        }
      });
    } else if (typeof value === 'boolean' && booleanFilterNames.includes(key)) {
      // Handle direct boolean filters
      dbFilters[key] = value;
    }
  });

  // Special handling for furnished/unfurnished
  dbFilters.furnished = filters.furnished;
  dbFilters.unfurnished = filters.unfurnished;

  return dbFilters;
};

/**
 * Debug function to check what filters are most inclusive
 * Can be enabled for troubleshooting filter issues
 */
export const debugFilterInclusiveness = (filters: FilterOptions, enableLogging = false): void => {
  if (!enableLogging) return;

  console.log('🔍 FILTER INCLUSIVENESS DEBUG:');
  console.log('Property Types:', filters.propertyTypes.length === 0 ? '✅ INCLUSIVE (all types)' : `❌ FILTERED (${filters.propertyTypes.join(', ')})`);
  console.log('Price Range:', !filters.minPrice && !filters.maxPrice ? '✅ INCLUSIVE (no price limits)' : `❌ FILTERED (${filters.minPrice || 'no min'} - ${filters.maxPrice || 'no max'})`);
  console.log('Bedrooms:', !filters.minBedrooms ? '✅ INCLUSIVE (any bedrooms)' : `❌ FILTERED (${filters.minBedrooms}+ bedrooms)`);
  console.log('Bathrooms:', !filters.minBathrooms ? '✅ INCLUSIVE (any bathrooms)' : `❌ FILTERED (${filters.minBathrooms}+ bathrooms)`);
  console.log('Furnished:', !filters.furnished && !filters.unfurnished ? '✅ INCLUSIVE (any furnishing)' : `❌ FILTERED (furnished: ${filters.furnished}, unfurnished: ${filters.unfurnished})`);
  console.log('Utilities:', filters.utilities.length === 0 || filters.utilities.length === 2 ? '✅ INCLUSIVE (any utilities)' : `❌ FILTERED (${filters.utilities.join(', ')})`);
  console.log('Pets:', filters.pets.length === 0 || filters.pets.length === 2 ? '✅ INCLUSIVE (any pet policy)' : `❌ FILTERED (${filters.pets.join(', ')})`);
  console.log('Search Radius:', filters.searchRadius >= 100 ? '✅ INCLUSIVE (unlimited)' : `❌ FILTERED (${filters.searchRadius} miles)`);
  console.log('Accessibility:', filters.accessibility?.length === 0 ? '✅ INCLUSIVE (no accessibility requirements)' : `❌ FILTERED (${filters.accessibility?.join(', ')})`);
  console.log('Location:', filters.location?.length === 0 ? '✅ INCLUSIVE (no location requirements)' : `❌ FILTERED (${filters.location?.join(', ')})`);
  console.log('Parking:', filters.parking?.length === 0 ? '✅ INCLUSIVE (no parking requirements)' : `❌ FILTERED (${filters.parking?.join(', ')})`);
  console.log('Kitchen:', filters.kitchen?.length === 0 ? '✅ INCLUSIVE (no kitchen requirements)' : `❌ FILTERED (${filters.kitchen?.join(', ')})`);
  console.log('Basics:', filters.basics?.length === 0 ? '✅ INCLUSIVE (no basics requirements)' : `❌ FILTERED (${filters.basics?.join(', ')})`);
  console.log('Luxury:', filters.luxury?.length === 0 ? '✅ INCLUSIVE (no luxury requirements)' : `❌ FILTERED (${filters.luxury?.join(', ')})`);
  console.log('Laundry:', filters.laundry?.length === 0 || filters.laundry?.length === 3 ? '✅ INCLUSIVE (any laundry option)' : `❌ FILTERED (${filters.laundry?.join(', ')})`);
};

/**
 * Initialize filters from trip data
 */
export const initializeFiltersFromTrip = (tripData: any): FilterOptions => {
  return {
    minPrice: tripData.minPrice || null,
    maxPrice: tripData.maxPrice || null,
    minBeds: tripData.minBeds || 0,
    minBedrooms: tripData.minBedrooms || 0,
    minBathrooms: tripData.minBathrooms || 0,
    furnished: tripData.furnished || false,
    unfurnished: tripData.unfurnished || false,
    searchRadius: tripData.searchRadius || 100, // Default to most inclusive (unlimited)

    // Build property types array
    propertyTypes: [
      ...(tripData.singleFamily ? ['singleFamily'] : []),
      ...(tripData.privateRoom ? ['privateRoom'] : []),
      ...(tripData.apartment ? ['apartment'] : []),
      ...(tripData.townhouse ? ['townhouse'] : []),
    ],

    // Build utilities array
    utilities: [
      ...(tripData.utilitiesIncluded ? ['utilitiesIncluded'] : []),
      ...(tripData.utilitiesNotIncluded ? ['utilitiesNotIncluded'] : []),
    ],

    // Build pets array
    pets: [
      ...(tripData.petsAllowed ? ['petsAllowed'] : []),
      ...(tripData.petsNotAllowed ? ['petsNotAllowed'] : []),
    ],

    // Build accessibility array
    accessibility: [
      ...(tripData.wheelchairAccess ? ['wheelchairAccess'] : []),
      ...(tripData.fencedInYard ? ['fencedInYard'] : []),
      ...(tripData.keylessEntry ? ['keylessEntry'] : []),
      ...(tripData.alarmSystem ? ['alarmSystem'] : []),
      ...(tripData.gatedEntry ? ['gatedEntry'] : []),
      ...(tripData.smokeDetector ? ['smokeDetector'] : []),
      ...(tripData.carbonMonoxide ? ['carbonMonoxide'] : []),
      ...(tripData.security ? ['security'] : []),
    ],

    // Build location array
    location: [
      ...(tripData.mountainView ? ['mountainView'] : []),
      ...(tripData.cityView ? ['cityView'] : []),
      ...(tripData.waterfront ? ['waterfront'] : []),
      ...(tripData.waterView ? ['waterView'] : []),
    ],

    // Build parking array
    parking: [
      ...(tripData.offStreetParking ? ['offStreetParking'] : []),
      ...(tripData.evCharging ? ['evCharging'] : []),
      ...(tripData.garageParking ? ['garageParking'] : []),
    ],

    // Build kitchen array
    kitchen: [
      ...(tripData.garbageDisposal ? ['garbageDisposal'] : []),
      ...(tripData.dishwasher ? ['dishwasher'] : []),
      ...(tripData.fridge ? ['fridge'] : []),
      ...(tripData.oven ? ['oven'] : []),
      ...(tripData.grill ? ['grill'] : []),
      ...(tripData.kitchenEssentials ? ['kitchenEssentials'] : []),
    ],

    // Build basics array (includes climate control + wifi + workspace)
    basics: [
      ...(tripData.airConditioner ? ['airConditioner'] : []),
      ...(tripData.heater ? ['heater'] : []),
      ...(tripData.wifi ? ['wifi'] : []),
      ...(tripData.dedicatedWorkspace ? ['dedicatedWorkspace'] : []),
    ],

    // Build luxury array (includes fireplace from UI layout)
    luxury: [
      ...(tripData.fireplace ? ['fireplace'] : []),
      ...(tripData.gym ? ['gym'] : []),
      ...(tripData.sauna ? ['sauna'] : []),
      ...(tripData.balcony ? ['balcony'] : []),
      ...(tripData.pool ? ['pool'] : []),
      ...(tripData.hotTub ? ['hotTub'] : []),
      ...(tripData.patio ? ['patio'] : []),
      ...(tripData.sunroom ? ['sunroom'] : []),
    ],

    // Build laundry array
    laundry: [
      ...(tripData.washerInUnit ? ['washerInUnit'] : []),
      ...(tripData.washerInComplex ? ['washerInComplex'] : []),
      ...(tripData.washerNotAvailable ? ['washerNotAvailable'] : []),
    ],
  };
};