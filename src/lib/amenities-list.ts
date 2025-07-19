import { Dumbbell } from 'lucide-react';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { Wifi as WifiIcon } from 'lucide-react';
import NotAvailableIcon from '@/lib/icons/not-available';

const amenities = [
  // Basics
  { code: 'airConditioner', label: 'Air Conditioner', icon: AmenitiesIcons.UpdatedAirConditioningIcon, category: 'basics' },
  { code: 'heater', label: 'Heater', icon: AmenitiesIcons.UpdatedHeaterIcon, category: 'basics' },
  { code: 'wifi', label: 'WiFi', icon: WifiIcon, category: 'basics' },
  { code: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: AmenitiesIcons.UpdatedDedicatedWorkspaceIcon, category: 'basics' },

  // Accessibility and Safety
  { code: 'wheelchairAccess', label: 'Wheelchair Access', icon: AmenitiesIcons.UpdatedWheelchairAccessibleIcon, category: 'accessibility' },
  { code: 'security', label: 'Security', icon: AmenitiesIcons.UpdatedSecurityIcon, category: 'accessibility' },
  { code: 'secureLobby', label: 'Secure Lobby', icon: AmenitiesIcons.UpdatedSecurityIcon, category: 'accessibility' },
  { code: 'keylessEntry', label: 'Keyless Entry', icon: AmenitiesIcons.UpdatedKeylessEntryIcon, category: 'accessibility' },
  { code: 'alarmSystem', label: 'Alarm System', icon: AmenitiesIcons.UpdatedAlarmSystemIcon, category: 'accessibility' },
  { code: 'gatedEntry', label: 'Gated Entry', icon: AmenitiesIcons.UpdatedGatedEntryIcon, category: 'accessibility' },
  { code: 'smokeDetector', label: 'Smoke Detector', icon: AmenitiesIcons.UpdatedSmokeDetectorIcon, category: 'accessibility' },
  { code: 'carbonMonoxide', label: 'CO Detector', icon: AmenitiesIcons.UpdatedCarbonMonoxideDetectorIcon, category: 'accessibility' },

  // Location
  { code: 'waterfront', label: 'Waterfront', icon: AmenitiesIcons.UpdatedWaterfrontIcon, category: 'location' },
  { code: 'beachfront', label: 'Beachfront', icon: AmenitiesIcons.UpdatedWaterfrontIcon, category: 'location' },
  { code: 'mountainView', label: 'Mountain View', icon: AmenitiesIcons.UpdatedMountainViewIcon, category: 'location' },
  { code: 'cityView', label: 'City View', icon: AmenitiesIcons.UpdatedCityViewIcon, category: 'location' },
  { code: 'waterView', label: 'Water View', icon: AmenitiesIcons.UpdatedWaterViewIcon, category: 'location' },

  // Parking
  { code: 'parking', label: 'Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'streetParking', label: 'Street Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'streetParkingFree', label: 'Street Parking Free', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'coveredParking', label: 'Covered Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'coveredParkingFree', label: 'Covered Parking Free', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'uncoveredParking', label: 'Uncovered Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'uncoveredParkingFree', label: 'Uncovered Parking Free', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'garageParking', label: 'Garage Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'garageParkingFree', label: 'Garage Parking Free', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'evCharging', label: 'EV Charging', icon: AmenitiesIcons.UpdatedEvChargingIcon, category: 'parking' },

  // Kitchen
  { code: 'kitchen', label: 'Kitchen', icon: Dumbbell, category: 'kitchen' },
  { code: 'garbageDisposal', label: 'Garbage Disposal', icon: AmenitiesIcons.UpdatedGarbageDisposalIcon, category: 'kitchen' },
  { code: 'dishwasher', label: 'Dishwasher', icon: AmenitiesIcons.UpdatedDishwasherIcon, category: 'kitchen' },
  { code: 'fridge', label: 'Refrigerator', icon: AmenitiesIcons.UpdatedFridgeIcon, category: 'kitchen' },
  { code: 'oven', label: 'Oven', icon: AmenitiesIcons.UpdatedOvenIcon, category: 'kitchen' },
  { code: 'stove', label: 'Stove', icon: Dumbbell, category: 'kitchen' },
  { code: 'kitchenEssentials', label: 'Kitchen Essentials', icon: AmenitiesIcons.UpdatedKitchenEssentialsIcon, category: 'kitchen' },

  // Luxury
  { code: 'fireplace', label: 'Fireplace', icon: AmenitiesIcons.UpdatedFireplaceIcon, category: 'luxury' },
  { code: 'fitnessCenter', label: 'Fitness Center', icon: AmenitiesIcons.UpdatedGymIcon, category: 'luxury' },
  { code: 'gym', label: 'Gym', icon: AmenitiesIcons.UpdatedGymIcon, category: 'luxury' },
  { code: 'balcony', label: 'Balcony', icon: AmenitiesIcons.UpdatedBalconyIcon, category: 'luxury' },
  { code: 'patio', label: 'Patio', icon: AmenitiesIcons.UpdatedPatioIcon, category: 'luxury' },
  { code: 'sunroom', label: 'Sunroom', icon: AmenitiesIcons.UpdatedSunroomIcon, category: 'luxury' },
  { code: 'firepit', label: 'Firepit', icon: Dumbbell, category: 'luxury' },
  { code: 'pool', label: 'Pool', icon: AmenitiesIcons.UpdatedPoolIcon, category: 'luxury' },
  { code: 'sauna', label: 'Sauna', icon: AmenitiesIcons.UpdatedSaunaIcon, category: 'luxury' },
  { code: 'hotTub', label: 'Hot Tub', icon: AmenitiesIcons.UpdatedHotTubIcon, category: 'luxury' },
  { code: 'jacuzzi', label: 'Jacuzzi', icon: AmenitiesIcons.UpdatedHotTubIcon, category: 'luxury' },
  { code: 'grill', label: 'Grill', icon: AmenitiesIcons.UpdatedGrillIcon, category: 'luxury' },

  // Laundry
  { code: 'laundryFacilities', label: 'Laundry Facilities', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerInUnit', label: 'Washer In Unit', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerHookup', label: 'Washer Hookup', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerNotAvailable', label: 'Washer Not Available', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerInComplex', label: 'Washer In Complex', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'dryerInUnit', label: 'Dryer In Unit', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'dryerHookup', label: 'Dryer Hookup', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'dryerNotAvailable', label: 'Dryer Not Available', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'dryerInComplex', label: 'Dryer In Complex', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },

  // Other
  { code: 'elevator', label: 'Elevator', icon: Dumbbell, category: 'other' },
  { code: 'doorman', label: 'Doorman', icon: Dumbbell, category: 'other' },
  { code: 'hairDryer', label: 'Hair Dryer', icon: Dumbbell, category: 'other' },
  { code: 'iron', label: 'Iron', icon: Dumbbell, category: 'other' },
  { code: 'petsAllowed', label: 'Pets Allowed', icon: AmenitiesIcons.UpdatedPetFriendlyIcon, category: 'other' },
  { code: 'smokingAllowed', label: 'Smoking Allowed', icon: Dumbbell, category: 'other' },
  { code: 'eventsAllowed', label: 'Events Allowed', icon: Dumbbell, category: 'other' },
  { code: 'privateEntrance', label: 'Private Entrance', icon: Dumbbell, category: 'other' },
  { code: 'storageShed', label: 'Storage Shed', icon: Dumbbell, category: 'other' },
  { code: 'tv', label: 'TV', icon: Dumbbell, category: 'other' },
  { code: 'workstation', label: 'Workstation', icon: Dumbbell, category: 'other' },
  { code: 'microwave', label: 'Microwave', icon: Dumbbell, category: 'other' },
  { code: 'linens', label: 'Linens', icon: Dumbbell, category: 'other' },
  { code: 'privateBathroom', label: 'Private Bathroom', icon: Dumbbell, category: 'other' },
]

export const iconAmenities = [
  // Basics
  { code: 'airConditioner', label: 'Air Conditioner', icon: AmenitiesIcons.UpdatedAirConditioningIcon, category: 'basics' },
  { code: 'heater', label: 'Heater', icon: AmenitiesIcons.UpdatedHeaterIcon, category: 'basics' },
  { code: 'wifi', label: 'WiFi', icon: WifiIcon, category: 'basics' },
  { code: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: AmenitiesIcons.UpdatedDedicatedWorkspaceIcon, category: 'basics' },

  // Accessibility
  { code: 'wheelchairAccess', label: 'Wheelchair Accessible', icon: AmenitiesIcons.UpdatedWheelchairAccessibleIcon, category: 'accessibility' },
  { code: 'keylessEntry', label: 'Keyless Entry', icon: AmenitiesIcons.UpdatedKeylessEntryIcon, category: 'accessibility' },
  { code: 'alarmSystem', label: 'Alarm System', icon: AmenitiesIcons.UpdatedAlarmSystemIcon, category: 'accessibility' },
  { code: 'gatedEntry', label: 'Gated Entry', icon: AmenitiesIcons.UpdatedGatedEntryIcon, category: 'accessibility' },
  { code: 'smokeDetector', label: 'Smoke Detector', icon: AmenitiesIcons.UpdatedSmokeDetectorIcon, category: 'accessibility' },
  { code: 'carbonMonoxide', label: 'CO Detector', icon: AmenitiesIcons.UpdatedCarbonMonoxideDetectorIcon, category: 'accessibility' },
  { code: 'security', label: 'Security System', icon: AmenitiesIcons.UpdatedSecurityIcon, category: 'accessibility' },

  // Kitchen
  { code: 'garbageDisposal', label: 'Garbage Disposal', icon: AmenitiesIcons.UpdatedGarbageDisposalIcon, category: 'kitchen' },
  { code: 'dishwasher', label: 'Dishwasher', icon: AmenitiesIcons.UpdatedDishwasherIcon, category: 'kitchen' },

  // Laundry
  { code: 'washerInUnit', label: 'In Unit', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerInComplex', label: 'In Complex', icon: AmenitiesIcons.WasherIcon, category: 'laundry' },
  { code: 'washerNotAvailable', label: 'No Laundry', icon: NotAvailableIcon, category: 'laundry' },

  // Location
  { code: 'waterfront', label: 'Waterfront', icon: AmenitiesIcons.UpdatedWaterfrontIcon, category: 'location' },
  { code: 'waterView', label: 'Water View', icon: AmenitiesIcons.UpdatedWaterViewIcon, category: 'location' },
  { code: 'mountainView', label: 'Mountain View', icon: AmenitiesIcons.UpdatedMountainViewIcon, category: 'location' },
  { code: 'cityView', label: 'City View', icon: AmenitiesIcons.UpdatedCityViewIcon, category: 'location' },

  // Luxury
  { code: 'balcony', label: 'Balcony', icon: AmenitiesIcons.UpdatedBalconyIcon, category: 'luxury' },
  { code: 'pool', label: 'Pool', icon: AmenitiesIcons.UpdatedPoolIcon, category: 'luxury' },
  { code: 'patio', label: 'Patio', icon: AmenitiesIcons.UpdatedPatioIcon, category: 'luxury' },
  { code: 'sunroom', label: 'Sunroom', icon: AmenitiesIcons.UpdatedSunroomIcon, category: 'luxury' },
  { code: 'gym', label: 'Gym', icon: AmenitiesIcons.UpdatedGymIcon, category: 'luxury' },
  { code: 'sauna', label: 'Sauna', icon: AmenitiesIcons.UpdatedSaunaIcon, category: 'luxury' },
  { code: 'hotTub', label: 'Hot Tub', icon: AmenitiesIcons.UpdatedHotTubIcon, category: 'luxury' },
  { code: 'grill', label: 'Grill', icon: AmenitiesIcons.UpdatedGrillIcon, category: 'luxury' },
  { code: 'fireplace', label: 'Fireplace', icon: AmenitiesIcons.UpdatedFireplaceIcon, category: 'luxury' },

  // Other
  { code: 'fencedInYard', label: 'Fenced Yard', icon: AmenitiesIcons.UpdatedFencedYardIcon, category: 'other' },

  // Parking
  { code: 'uncoveredParkingFree', label: 'Free Parking', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
  { code: 'garageParking', label: 'Garage', icon: AmenitiesIcons.UpdatedParkingIcon, category: 'parking' },
]

export const highlightAmenities = [
  { code: 'singleFamily', label: 'Single Family Home', icon: AmenitiesIcons.UpdatedSingleFamilyIcon },
  { code: 'townhome', label: 'Townhome', icon: AmenitiesIcons.UpdatedTownhouseIcon },
  { code: 'singleRoom', label: 'Single Room', icon: AmenitiesIcons.UpdatedSingleRoomIcon },
  { code: 'furnished', label: 'Fully Furnished', icon: AmenitiesIcons.UpdatedFurnishedIcon, falseIcon: AmenitiesIcons.UpdatedUnfurnishedIcon },
  { code: 'petsAllowed', label: 'Pet Friendly', icon: AmenitiesIcons.UpdatedPetFriendlyIcon, falseIcon: AmenitiesIcons.UpdatedPetUnfriendlyIcon },
  { code: 'utilitiesIncluded', label: 'Utilities Included', icon: AmenitiesIcons.UpdatedUtilitiesIncludedIcon, falseIcon: AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon },
]

export { amenities };
