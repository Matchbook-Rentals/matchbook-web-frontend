import { Dumbbell } from 'lucide-react';
import {
  AirConditioningIcon,
  AlarmSystemIcon,
  ApartmentIcon,
  BalconyIcon,
  CityViewIcon,
  CoDetectorIcon,
  DedicatedWorkspaceIcon,
  DishwasherIcon,
  EvChargingIcon,
  FencedYardIcon,
  FireplaceIcon,
  FurnishedIcon,
  GarageIcon,
  GarbageDisposalIcon,
  GatedEntryIcon,
  GrillIcon,
  GymIcon,
  HeatingIcon,
  HotTubIcon,
  InUnitLaundryIcon,
  InUnitOrOnSiteLaundryIcon,
  KeylessEntryIcon,
  KitchenEssentialsIcon,
  MountainViewIcon,
  NoLaundryPreferenceIcon,
  NoPetsIcon,
  OffStreetParkingIcon,
  OvenStoveIcon,
  PatioIcon,
  PetsAllowedIcon,
  PoolIcon,
  PrivateRoomIcon,
  RefrigeratorIcon,
  SaunaIcon,
  SecuritySystemIcon,
  SingleFamilyIcon,
  SmokeDetectorIcon,
  SunroomIcon,
  TownhouseIcon,
  UnfurnishedIcon,
  UtilitiesIncludedIcon,
  UtilitiesNotIncludedIcon,
  WaterViewIcon,
  WaterfrontIcon,
  WheelchairAccessibleIcon,
  WifiIcon,
} from '@/components/icons-v3/amenities';

const amenities = [
  // Basics
  { code: 'airConditioner', label: 'Air Conditioner', icon: AirConditioningIcon, category: 'basics' },
  { code: 'heater', label: 'Heater', icon: HeatingIcon, category: 'basics' },
  { code: 'wifi', label: 'WiFi', icon: WifiIcon, category: 'basics' },
  { code: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: DedicatedWorkspaceIcon, category: 'basics' },

  // Accessibility and Safety
  { code: 'wheelchairAccess', label: 'Wheelchair Access', icon: WheelchairAccessibleIcon, category: 'accessibility' },
  { code: 'security', label: 'Security', icon: SecuritySystemIcon, category: 'accessibility' },
  { code: 'secureLobby', label: 'Secure Lobby', icon: SecuritySystemIcon, category: 'accessibility' },
  { code: 'keylessEntry', label: 'Keyless Entry', icon: KeylessEntryIcon, category: 'accessibility' },
  { code: 'alarmSystem', label: 'Alarm System', icon: AlarmSystemIcon, category: 'accessibility' },
  { code: 'gatedEntry', label: 'Gated Entry', icon: GatedEntryIcon, category: 'accessibility' },
  { code: 'smokeDetector', label: 'Smoke Detector', icon: SmokeDetectorIcon, category: 'accessibility' },
  { code: 'carbonMonoxide', label: 'CO Detector', icon: CoDetectorIcon, category: 'accessibility' },

  // Location
  { code: 'waterfront', label: 'Waterfront', icon: WaterfrontIcon, category: 'location' },
  { code: 'beachfront', label: 'Beachfront', icon: WaterfrontIcon, category: 'location' },
  { code: 'mountainView', label: 'Mountain View', icon: MountainViewIcon, category: 'location' },
  { code: 'cityView', label: 'City View', icon: CityViewIcon, category: 'location' },
  { code: 'waterView', label: 'Water View', icon: WaterViewIcon, category: 'location' },

  // Parking
  { code: 'parking', label: 'Parking', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'streetParking', label: 'Street Parking', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'streetParkingFree', label: 'Street Parking Free', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'coveredParking', label: 'Covered Parking', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'coveredParkingFree', label: 'Covered Parking Free', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'uncoveredParking', label: 'Uncovered Parking', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'uncoveredParkingFree', label: 'Uncovered Parking Free', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'garageParking', label: 'Garage Parking', icon: GarageIcon, category: 'parking' },
  { code: 'garageParkingFree', label: 'Garage Parking Free', icon: GarageIcon, category: 'parking' },
  { code: 'evCharging', label: 'EV Charging', icon: EvChargingIcon, category: 'parking' },

  // Kitchen
  { code: 'kitchen', label: 'Kitchen', icon: KitchenEssentialsIcon, category: 'kitchen' },
  { code: 'garbageDisposal', label: 'Garbage Disposal', icon: GarbageDisposalIcon, category: 'kitchen' },
  { code: 'dishwasher', label: 'Dishwasher', icon: DishwasherIcon, category: 'kitchen' },
  { code: 'fridge', label: 'Refrigerator', icon: RefrigeratorIcon, category: 'kitchen' },
  { code: 'oven', label: 'Oven', icon: OvenStoveIcon, category: 'kitchen' },
  { code: 'stove', label: 'Stove', icon: OvenStoveIcon, category: 'kitchen' },
  { code: 'kitchenEssentials', label: 'Kitchen Essentials', icon: KitchenEssentialsIcon, category: 'kitchen' },

  // Luxury
  { code: 'fireplace', label: 'Fireplace', icon: FireplaceIcon, category: 'luxury' },
  { code: 'fitnessCenter', label: 'Fitness Center', icon: GymIcon, category: 'luxury' },
  { code: 'gym', label: 'Gym', icon: GymIcon, category: 'luxury' },
  { code: 'balcony', label: 'Balcony', icon: BalconyIcon, category: 'luxury' },
  { code: 'patio', label: 'Patio', icon: PatioIcon, category: 'luxury' },
  { code: 'sunroom', label: 'Sunroom', icon: SunroomIcon, category: 'luxury' },
  { code: 'firepit', label: 'Firepit', icon: FireplaceIcon, category: 'luxury' },
  { code: 'pool', label: 'Pool', icon: PoolIcon, category: 'luxury' },
  { code: 'sauna', label: 'Sauna', icon: SaunaIcon, category: 'luxury' },
  { code: 'hotTub', label: 'Hot Tub', icon: HotTubIcon, category: 'luxury' },
  { code: 'jacuzzi', label: 'Jacuzzi', icon: HotTubIcon, category: 'luxury' },
  { code: 'grill', label: 'Grill', icon: GrillIcon, category: 'luxury' },

  // Laundry
  { code: 'laundryFacilities', label: 'Laundry Facilities', icon: InUnitOrOnSiteLaundryIcon, category: 'laundry' },
  { code: 'washerInUnit', label: 'Washer In Unit', icon: InUnitLaundryIcon, category: 'laundry' },
  { code: 'washerHookup', label: 'Washer Hookup', icon: InUnitLaundryIcon, category: 'laundry' },
  { code: 'washerNotAvailable', label: 'Washer Not Available', icon: NoLaundryPreferenceIcon, category: 'laundry' },
  { code: 'washerInComplex', label: 'Washer In Complex', icon: InUnitOrOnSiteLaundryIcon, category: 'laundry' },
  { code: 'dryerInUnit', label: 'Dryer In Unit', icon: InUnitLaundryIcon, category: 'laundry' },
  { code: 'dryerHookup', label: 'Dryer Hookup', icon: InUnitLaundryIcon, category: 'laundry' },
  { code: 'dryerNotAvailable', label: 'Dryer Not Available', icon: NoLaundryPreferenceIcon, category: 'laundry' },
  { code: 'dryerInComplex', label: 'Dryer In Complex', icon: InUnitOrOnSiteLaundryIcon, category: 'laundry' },

  // Other
  { code: 'elevator', label: 'Elevator', icon: Dumbbell, category: 'other' },
  { code: 'doorman', label: 'Doorman', icon: Dumbbell, category: 'other' },
  { code: 'hairDryer', label: 'Hair Dryer', icon: Dumbbell, category: 'other' },
  { code: 'iron', label: 'Iron', icon: Dumbbell, category: 'other' },
  { code: 'petsAllowed', label: 'Pets Allowed', icon: PetsAllowedIcon, category: 'other' },
  { code: 'smokingAllowed', label: 'Smoking Allowed', icon: Dumbbell, category: 'other' },
  { code: 'eventsAllowed', label: 'Events Allowed', icon: Dumbbell, category: 'other' },
  { code: 'privateEntrance', label: 'Private Entrance', icon: Dumbbell, category: 'other' },
  { code: 'storageShed', label: 'Storage Shed', icon: Dumbbell, category: 'other' },
  { code: 'tv', label: 'TV', icon: Dumbbell, category: 'other' },
  { code: 'workstation', label: 'Workstation', icon: Dumbbell, category: 'other' },
  { code: 'microwave', label: 'Microwave', icon: KitchenEssentialsIcon, category: 'other' },
  { code: 'linens', label: 'Linens', icon: Dumbbell, category: 'other' },
  { code: 'privateBathroom', label: 'Private Bathroom', icon: Dumbbell, category: 'other' },
]

export const iconAmenities = [
  // Basics
  { code: 'airConditioner', label: 'Air Conditioner', icon: AirConditioningIcon, category: 'basics' },
  { code: 'heater', label: 'Heater', icon: HeatingIcon, category: 'basics' },
  { code: 'wifi', label: 'WiFi', icon: WifiIcon, category: 'basics' },
  { code: 'dedicatedWorkspace', label: 'Dedicated Workspace', icon: DedicatedWorkspaceIcon, category: 'basics' },

  // Accessibility
  { code: 'wheelchairAccess', label: 'Wheelchair Accessible', icon: WheelchairAccessibleIcon, category: 'accessibility' },
  { code: 'keylessEntry', label: 'Keyless Entry', icon: KeylessEntryIcon, category: 'accessibility' },
  { code: 'alarmSystem', label: 'Alarm System', icon: AlarmSystemIcon, category: 'accessibility' },
  { code: 'gatedEntry', label: 'Gated Entry', icon: GatedEntryIcon, category: 'accessibility' },
  { code: 'smokeDetector', label: 'Smoke Detector', icon: SmokeDetectorIcon, category: 'accessibility' },
  { code: 'carbonMonoxide', label: 'CO Detector', icon: CoDetectorIcon, category: 'accessibility' },
  { code: 'security', label: 'Security System', icon: SecuritySystemIcon, category: 'accessibility' },

  // Kitchen
  { code: 'garbageDisposal', label: 'Garbage Disposal', icon: GarbageDisposalIcon, category: 'kitchen' },
  { code: 'dishwasher', label: 'Dishwasher', icon: DishwasherIcon, category: 'kitchen' },
  { code: 'fridge', label: 'Refrigerator', icon: RefrigeratorIcon, category: 'kitchen' },
  { code: 'oven', label: 'Oven', icon: OvenStoveIcon, category: 'kitchen' },
  { code: 'stove', label: 'Stove', icon: OvenStoveIcon, category: 'kitchen' },
  { code: 'kitchenEssentials', label: 'Kitchen Essentials', icon: KitchenEssentialsIcon, category: 'kitchen' },
  { code: 'microwave', label: 'Microwave', icon: KitchenEssentialsIcon, category: 'kitchen' },

  // Laundry
  { code: 'washerInUnit', label: 'In Unit', icon: InUnitLaundryIcon, category: 'laundry' },
  { code: 'washerInComplex', label: 'In Complex', icon: InUnitOrOnSiteLaundryIcon, category: 'laundry' },
  { code: 'washerNotAvailable', label: 'No Laundry', icon: NoLaundryPreferenceIcon, category: 'laundry' },

  // Location
  { code: 'waterfront', label: 'Waterfront', icon: WaterfrontIcon, category: 'location' },
  { code: 'waterView', label: 'Water View', icon: WaterViewIcon, category: 'location' },
  { code: 'mountainView', label: 'Mountain View', icon: MountainViewIcon, category: 'location' },
  { code: 'cityView', label: 'City View', icon: CityViewIcon, category: 'location' },

  // Luxury
  { code: 'balcony', label: 'Balcony', icon: BalconyIcon, category: 'luxury' },
  { code: 'pool', label: 'Pool', icon: PoolIcon, category: 'luxury' },
  { code: 'patio', label: 'Patio', icon: PatioIcon, category: 'luxury' },
  { code: 'sunroom', label: 'Sunroom', icon: SunroomIcon, category: 'luxury' },
  { code: 'gym', label: 'Gym', icon: GymIcon, category: 'luxury' },
  { code: 'sauna', label: 'Sauna', icon: SaunaIcon, category: 'luxury' },
  { code: 'hotTub', label: 'Hot Tub', icon: HotTubIcon, category: 'luxury' },
  { code: 'grill', label: 'Grill', icon: GrillIcon, category: 'luxury' },
  { code: 'fireplace', label: 'Fireplace', icon: FireplaceIcon, category: 'luxury' },

  // Other
  { code: 'fencedInYard', label: 'Fenced Yard', icon: FencedYardIcon, category: 'other' },

  // Parking
  { code: 'uncoveredParkingFree', label: 'Free Parking', icon: OffStreetParkingIcon, category: 'parking' },
  { code: 'garageParking', label: 'Garage', icon: GarageIcon, category: 'parking' },
]

export const highlightAmenities = [
  { code: 'singleFamily', label: 'Single Family Home', icon: SingleFamilyIcon },
  { code: 'townhome', label: 'Townhome', icon: TownhouseIcon },
  { code: 'singleRoom', label: 'Single Room', icon: PrivateRoomIcon },
  { code: 'furnished', label: 'Fully Furnished', icon: FurnishedIcon, falseIcon: UnfurnishedIcon },
  { code: 'petsAllowed', label: 'Pet Friendly', icon: PetsAllowedIcon, falseIcon: NoPetsIcon },
  { code: 'utilitiesIncluded', label: 'Utilities Included', icon: UtilitiesIncludedIcon, falseIcon: UtilitiesNotIncludedIcon },
]

export { amenities };
