type FilterType = 'boolean' | 'number' | 'string' | 'datetime';

interface Filter {
  name: string;
  type: FilterType;
}

export const filters: Filter[] = [
  // Location and Basic Info
  { name: 'locationString', type: 'string' },
  { name: 'latitude', type: 'number' },
  { name: 'longitude', type: 'number' },
  { name: 'city', type: 'string' },
  { name: 'state', type: 'string' },
  { name: 'postalCode', type: 'string' },
  { name: 'startDate', type: 'datetime' },
  { name: 'endDate', type: 'datetime' },
  { name: 'numAdults', type: 'number' },
  { name: 'numPets', type: 'number' },
  { name: 'numChildren', type: 'number' },

  // Numeric Filters
  { name: 'minPrice', type: 'number' },
  { name: 'maxPrice', type: 'number' },
  { name: 'minBeds', type: 'number' },
  { name: 'minBedroom', type: 'number' },
  { name: 'minBathroom', type: 'number' },
  { name: 'searchRadius', type: 'number' },

  // Highlight Filters
  { name: 'furnished', type: 'boolean' },
  { name: 'unfurnished', type: 'boolean' },
  { name: 'utilitiesIncluded', type: 'boolean' },
  { name: 'utilitiesNotIncluded', type: 'boolean' },
  { name: 'petsAllowed', type: 'boolean' },
  { name: 'petsNotAllowed', type: 'boolean' },

  // General Amenities
  { name: 'airConditioner', type: 'boolean' },
  { name: 'laundryFacilities', type: 'boolean' },
  { name: 'fitnessCenter', type: 'boolean' },
  { name: 'elevator', type: 'boolean' },
  { name: 'wheelchairAccess', type: 'boolean' },
  { name: 'doorman', type: 'boolean' },
  { name: 'parking', type: 'boolean' },
  { name: 'wifi', type: 'boolean' },
  { name: 'kitchen', type: 'boolean' },
  { name: 'dedicatedWorkspace', type: 'boolean' },
  { name: 'hairDryer', type: 'boolean' },
  { name: 'iron', type: 'boolean' },
  { name: 'heater', type: 'boolean' },
  { name: 'hotTub', type: 'boolean' },
  { name: 'smokingAllowed', type: 'boolean' },
  { name: 'eventsAllowed', type: 'boolean' },
  { name: 'privateEntrance', type: 'boolean' },
  { name: 'security', type: 'boolean' },
  { name: 'waterfront', type: 'boolean' },
  { name: 'beachfront', type: 'boolean' },
  { name: 'mountainView', type: 'boolean' },
  { name: 'cityView', type: 'boolean' },
  { name: 'waterView', type: 'boolean' },

  // Washer and Dryer Options
  { name: 'washerInUnit', type: 'boolean' },
  { name: 'washerHookup', type: 'boolean' },
  { name: 'washerNotAvailable', type: 'boolean' },
  { name: 'washerInComplex', type: 'boolean' },
  { name: 'dryerInUnit', type: 'boolean' },
  { name: 'dryerHookup', type: 'boolean' },
  { name: 'dryerNotAvailable', type: 'boolean' },
  { name: 'dryerInComplex', type: 'boolean' },

  // Parking Options
  { name: 'offStreetParking', type: 'boolean' },
  { name: 'streetParking', type: 'boolean' },
  { name: 'streetParkingFree', type: 'boolean' },
  { name: 'coveredParking', type: 'boolean' },
  { name: 'coveredParkingFree', type: 'boolean' },
  { name: 'uncoveredParking', type: 'boolean' },
  { name: 'uncoveredParkingFree', type: 'boolean' },
  { name: 'garageParking', type: 'boolean' },
  { name: 'garageParkingFree', type: 'boolean' },
  { name: 'evCharging', type: 'boolean' },

  // Pet Policies
  { name: 'allowDogs', type: 'boolean' },
  { name: 'allowCats', type: 'boolean' },

  // Structural Amenities
  { name: 'gym', type: 'boolean' },
  { name: 'balcony', type: 'boolean' },
  { name: 'patio', type: 'boolean' },
  { name: 'sunroom', type: 'boolean' },
  { name: 'fireplace', type: 'boolean' },
  { name: 'firepit', type: 'boolean' },
  { name: 'pool', type: 'boolean' },
  { name: 'sauna', type: 'boolean' },
  { name: 'jacuzzi', type: 'boolean' },
  { name: 'grill', type: 'boolean' },
  { name: 'oven', type: 'boolean' },
  { name: 'stove', type: 'boolean' },
  { name: 'wheelAccessible', type: 'boolean' },
  { name: 'fencedInYard', type: 'boolean' },
  { name: 'secureLobby', type: 'boolean' },
  { name: 'keylessEntry', type: 'boolean' },
  { name: 'alarmSystem', type: 'boolean' },
  { name: 'storageShed', type: 'boolean' },
  { name: 'gatedEntry', type: 'boolean' },
  { name: 'smokeDetector', type: 'boolean' },
  { name: 'carbonMonoxide', type: 'boolean' },

  // Kitchen
  { name: 'garbageDisposal', type: 'boolean' },
  { name: 'dishwasher', type: 'boolean' },
  { name: 'fridge', type: 'boolean' },

  // Furnished
  { name: 'tv', type: 'boolean' },
  { name: 'workstation', type: 'boolean' },
  { name: 'microwave', type: 'boolean' },
  { name: 'kitchenEssentials', type: 'boolean' },
  { name: 'linens', type: 'boolean' },
  { name: 'privateBathroom', type: 'boolean' }
];

// Helper type for filter names
export type FilterName = typeof filters[number]['name'];

// Helper functions to get filters by type
export const getFiltersByType = (type: FilterType) =>
  filters.filter(filter => filter.type === type);

export const getBooleanFilters = () => getFiltersByType('boolean');
export const getNumberFilters = () => getFiltersByType('number');
export const getStringFilters = () => getFiltersByType('string');
export const getDateFilters = () => getFiltersByType('datetime');

// Helper function to get filters by category
export const getFiltersByCategory = (category: string) => {
  const categories: { [key: string]: string[] } = {
    'highlight': ['furnished', 'unfurnished', 'utilitiesIncluded', 'utilitiesNotIncluded', 'petsAllowed', 'petsNotAllowed'],
    'general': ['airConditioner', 'laundryFacilities', 'fitnessCenter', /* ... */],
    'washerDryer': ['washerInUnit', 'washerHookup', 'washerNotAvailable', /* ... */],
    'parking': ['offStreetParking', 'streetParking', 'streetParkingFree', /* ... */],
    'pets': ['allowDogs', 'allowCats'],
    'structural': ['gym', 'balcony', 'patio', /* ... */],
    'kitchen': ['garbageDisposal', 'dishwasher', 'fridge'],
    'furnished': ['tv', 'workstation', 'microwave', /* ... */]
  };

  return filters.filter(filter => categories[category]?.includes(filter.name));
};

