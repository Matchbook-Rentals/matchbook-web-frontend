type FilterType = 'boolean' | 'number' | 'string' | 'datetime';

export enum CategoryType {
  HIGHLIGHT = 'highlight',
  PROPERTY_TYPE = 'propertyType',
  ACCESSIBILITY = 'accessibility',
  LOCATION = 'location',
  PARKING = 'parking',
  KITCHEN = 'kitchen',
  CLIMATE_CONTROL = 'climateControl',
  LUXURY = 'luxury',
  WASHER_DRYER = 'washerDryer',
  PETS = 'pets',
  GENERAL = 'general'
}

interface Filter {
  name: string;
  type: FilterType;
  category: 'highlight' | 'propertyType' | 'accessibility' | 'location' | 'parking' | 'kitchen' | 'climateControl' | 'luxury' | 'washerDryer' | 'pets' | 'general';
}

export const filters: Filter[] = [
  // Numeric Filters
  { name: 'minPrice', type: 'number', category: 'general' },
  { name: 'maxPrice', type: 'number', category: 'general' },
  { name: 'minBeds', type: 'number', category: 'general' },
  { name: 'minBedroom', type: 'number', category: 'general' },
  { name: 'minBathroom', type: 'number', category: 'general' },
  { name: 'searchRadius', type: 'number', category: 'general' },

  // Highlight Filters
  { name: 'furnished', type: 'boolean', category: 'highlight' },
  { name: 'unfurnished', type: 'boolean', category: 'highlight' },
  { name: 'utilitiesIncluded', type: 'boolean', category: 'highlight' },
  { name: 'utilitiesNotIncluded', type: 'boolean', category: 'highlight' },
  { name: 'petsAllowed', type: 'boolean', category: 'highlight' },
  { name: 'petsNotAllowed', type: 'boolean', category: 'highlight' },

  // Property Type
  { name: 'singleFamily', type: 'boolean', category: 'propertyType' },
  { name: 'privateRoom', type: 'boolean', category: 'propertyType' },
  { name: 'apartment', type: 'boolean', category: 'propertyType' },
  { name: 'townhouse', type: 'boolean', category: 'propertyType' },

  // Accessibility
  { name: 'wheelchairAccess', type: 'boolean', category: 'accessibility' },
  { name: 'fencedInYard', type: 'boolean', category: 'accessibility' },
  { name: 'keylessEntry', type: 'boolean', category: 'accessibility' },
  { name: 'alarmSystem', type: 'boolean', category: 'accessibility' },
  { name: 'gatedEntry', type: 'boolean', category: 'accessibility' },
  { name: 'smokeDetector', type: 'boolean', category: 'accessibility' },
  { name: 'carbonMonoxide', type: 'boolean', category: 'accessibility' },
  { name: 'security', type: 'boolean', category: 'accessibility' },

  // Location
  { name: 'mountainView', type: 'boolean', category: 'location' },
  { name: 'cityView', type: 'boolean', category: 'location' },
  { name: 'waterfront', type: 'boolean', category: 'location' },
  { name: 'waterView', type: 'boolean', category: 'location' },
  { name: 'beachfront', type: 'boolean', category: 'location' },

  // Climate Control
  { name: 'fireplace', type: 'boolean', category: 'climateControl' },
  { name: 'heater', type: 'boolean', category: 'climateControl' },
  { name: 'dedicatedWorkspace', type: 'boolean', category: 'climateControl' },
  { name: 'airConditioner', type: 'boolean', category: 'climateControl' },

  // Luxury
  { name: 'gym', type: 'boolean', category: 'luxury' },
  { name: 'sauna', type: 'boolean', category: 'luxury' },
  { name: 'balcony', type: 'boolean', category: 'luxury' },
  { name: 'pool', type: 'boolean', category: 'luxury' },
  { name: 'hotTub', type: 'boolean', category: 'luxury' },
  { name: 'patio', type: 'boolean', category: 'luxury' },
  { name: 'sunroom', type: 'boolean', category: 'luxury' },

  // Washer and Dryer Options
  { name: 'washerInUnit', type: 'boolean', category: 'washerDryer' },
  { name: 'washerHookup', type: 'boolean', category: 'washerDryer' },
  { name: 'washerNotAvailable', type: 'boolean', category: 'washerDryer' },
  { name: 'washerInComplex', type: 'boolean', category: 'washerDryer' },
  { name: 'dryerInUnit', type: 'boolean', category: 'washerDryer' },
  { name: 'dryerHookup', type: 'boolean', category: 'washerDryer' },
  { name: 'dryerNotAvailable', type: 'boolean', category: 'washerDryer' },
  { name: 'dryerInComplex', type: 'boolean', category: 'washerDryer' },

  // Parking Options
  { name: 'offStreetParking', type: 'boolean', category: 'parking' },
  { name: 'evCharging', type: 'boolean', category: 'parking' },
  { name: 'garageParking', type: 'boolean', category: 'parking' },

  // Kitchen
  { name: 'garbageDisposal', type: 'boolean', category: 'kitchen' },
  { name: 'dishwasher', type: 'boolean', category: 'kitchen' },
  { name: 'fridge', type: 'boolean', category: 'kitchen' },
  { name: 'oven', type: 'boolean', category: 'kitchen' },
  { name: 'grill', type: 'boolean', category: 'kitchen' },
  { name: 'kitchenEssentials', type: 'boolean', category: 'kitchen' },

  // General Amenities (remaining items that don't fit specific categories)
  { name: 'laundryFacilities', type: 'boolean', category: 'general' },
  { name: 'elevator', type: 'boolean', category: 'general' },
  { name: 'doorman', type: 'boolean', category: 'general' },
  { name: 'wifi', type: 'boolean', category: 'general' },
  { name: 'hairDryer', type: 'boolean', category: 'general' },
  { name: 'iron', type: 'boolean', category: 'general' },
  { name: 'smokingAllowed', type: 'boolean', category: 'general' },
  { name: 'eventsAllowed', type: 'boolean', category: 'general' },
  { name: 'privateEntrance', type: 'boolean', category: 'general' },
  { name: 'tv', type: 'boolean', category: 'general' },
  { name: 'workstation', type: 'boolean', category: 'general' },
  { name: 'microwave', type: 'boolean', category: 'general' },
  { name: 'linens', type: 'boolean', category: 'general' },
  { name: 'privateBathroom', type: 'boolean', category: 'general' },
  { name: 'storageShed', type: 'boolean', category: 'general' },
  { name: 'secureLobby', type: 'boolean', category: 'general' },
  { name: 'firepit', type: 'boolean', category: 'general' },
  { name: 'jacuzzi', type: 'boolean', category: 'general' },

  // Pet Policies
  { name: 'allowDogs', type: 'boolean', category: 'pets' },
  { name: 'allowCats', type: 'boolean', category: 'pets' }
];

// Helper type for filter names
export type FilterName = typeof filters[number]['name'];

// Helper functions to get filters by type
export const getFiltersByType = (type: FilterType): { name: string, type: string }[] =>
  filters.filter(filter => filter.type === type);

export const getBooleanFilters = () => getFiltersByType('boolean');
export const getNumberFilters = () => getFiltersByType('number');
export const getStringFilters = () => getFiltersByType('string');
export const getDateFilters = () => getFiltersByType('datetime');

// Helper function to get filters by category
export const getFiltersByCategory = (category: CategoryType) => {
  return filters.filter(filter => filter.category === category);
};

