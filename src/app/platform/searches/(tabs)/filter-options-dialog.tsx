//Imports
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Tile from "@/components/ui/tile";
import * as AmenitiesIcons from '@/components/icons/amenities';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ScrollArea } from "@/components/ui/scroll-area"
import CurrencyInput from '@/components/ui/currency-input';
import { TallDialogContent, TallDialogTitle, TallDialogTrigger, TallDialogTriggerText } from '@/constants/styles';
import { FilterIcon, UpdatedFilterIcon } from '@/components/icons';
import { Wifi } from 'lucide-react'; // Import Wifi icon
import { logger } from '@/lib/logger';

interface FilterOptions {
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number;
  minBeds: number;
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
  basics: string[]; // Renamed from climateControl
  luxury: string[];
  laundry: string[];
}

interface FilterOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

const FilterOptionsDialog: React.FC<FilterOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  className,
}) => {
  const { state: { filters: contextFilters, listings }, actions: { updateFilters } } = useTripContext();
  const [localFilters, setLocalFilters] = useState(contextFilters);
  const [priceInputs, setPriceInputs] = useState({
    min: `$${contextFilters.minPrice || ''}`,
    max: `$${contextFilters.maxPrice || ''}`
  });

  const propertyTypeOptions = [
    {
      value: 'singleFamily',
      label: 'Single Family',
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="p-1 mt-0" />
    },
    {
      value: 'apartment',
      label: 'Apartment',
      icon: <AmenitiesIcons.UpdatedApartmentIcon className="p-1 mt-0" />
    },
    {
      value: 'privateRoom',
      label: 'Private Room',
      icon: <AmenitiesIcons.UpdatedSingleRoomIcon className="p-1 mt-0" />
    },
    {
      value: 'townhouse',
      label: 'Townhouse',
      icon: <AmenitiesIcons.UpdatedTownhouseIcon className="p-1 mt-0" />
    },
  ];

  const accessibilityOptions = [
    {
      value: 'wheelchairAccess',
      label: 'Wheelchair Accessible',
      icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-1 mt-0" />
      //icon: <AmenitiesIcons.UpdatedWheelchairAccessibleIcon className="p-0 mt-0" />
    },
    {
      value: 'fencedInYard',
      label: 'Fenced Yard',
      icon: <AmenitiesIcons.UpdatedFencedYardIcon className="p-1 mt-0" />
    },
    {
      value: 'keylessEntry',
      label: 'Keyless Entry',
      icon: <AmenitiesIcons.UpdatedKeylessEntryIcon className="p-1 mt-0" />
    },
    {
      value: 'alarmSystem',
      label: 'Alarm System',
      icon: <AmenitiesIcons.UpdatedAlarmSystemIcon className="p-1 mt-0" />
    },
    {
      value: 'gatedEntry',
      label: 'Gated Entry',
      icon: <AmenitiesIcons.UpdatedGatedEntryIcon className="p-1 mt-0" />
    },
    {
      value: 'smokeDetector',
      label: 'Smoke Detector',
      icon: <AmenitiesIcons.UpdatedSmokeDetectorIcon className="p-1 mt-0" />
    },
    {
      value: 'carbonMonoxide',
      label: 'CO Detector',
      icon: <AmenitiesIcons.UpdatedCarbonMonoxideDetectorIcon className="p-1 mt-0" />
    },
    {
      value: 'security',
      label: 'Security System',
      icon: <AmenitiesIcons.UpdatedSecurityIcon className="p-1 mt-0" />
    }
  ];

  const locationOptions = [
    {
      value: 'mountainView',
      label: 'Mountain View',
      icon: <AmenitiesIcons.UpdatedMountainViewIcon className="p-1 mt-0" />
    },
    {
      value: 'cityView',
      label: 'City View',
      icon: <AmenitiesIcons.UpdatedCityViewIcon className="p-1 mt-0" />
    },
    {
      value: 'waterfront',
      label: 'Waterfront',
      icon: <AmenitiesIcons.UpdatedWaterfrontIcon className="p-0 mt-1" />
    },
    {
      value: 'waterView',
      label: 'Water View',
      icon: <AmenitiesIcons.UpdatedWaterViewIcon className="p-1 mt-0" />
    }
  ];

  const parkingOptions = [
    {
      value: 'offStreetParking',
      label: 'Off Street',
      icon: <AmenitiesIcons.UpdatedParkingIcon className="p-1 mt-0" />
    },
    {
      value: 'evCharging',
      label: 'EV Charging',
      icon: <AmenitiesIcons.UpdatedEvChargingIcon className="p-1 mt-0 ml-3" />
    },
    {
      value: 'garageParking',
      label: 'Garage',
      icon: <AmenitiesIcons.UpdatedGarageIcon className="p-1 mt-0" />
    }
  ];

  const kitchenOptions = [
    {
      value: 'garbageDisposal',
      label: 'Garbage Disposal',
      icon: <AmenitiesIcons.UpdatedGarbageDisposalIcon className="p-1 my-0" />
    },
    {
      value: 'dishwasher',
      label: 'Dishwasher',
      icon: <AmenitiesIcons.UpdatedDishwasherIcon className="p-1 mt-0" />
    },
    {
      value: 'fridge',
      label: 'Refrigerator',
      icon: <AmenitiesIcons.UpdatedFridgeIcon className="p-1 mt-0 " />
    },
    {
      value: 'oven',
      label: 'Oven/Stove',
      icon: <AmenitiesIcons.UpdatedOvenIcon className="p-1 mt-0" />
    },
    {
      value: 'grill',
      label: 'Grill',
      icon: <AmenitiesIcons.UpdatedGrillIcon className="p-1" />
    },
    {
      value: 'kitchenEssentials',
      label: 'Kitchen Essentials',
      icon: <AmenitiesIcons.UpdatedKitchenEssentialsIcon className="p-1 mt-0" />
    }
  ];

  const basicsOptions = [
    {
      value: 'airConditioner',
      label: 'Air Conditioning',
      icon: <AmenitiesIcons.UpdatedAirConditioningIcon className="p-1 mt-0" />
    },
    {
      value: 'heater',
      label: 'Heater',
      icon: <AmenitiesIcons.UpdatedHeaterIcon className="p-1 mt-0" />
    },
    {
      value: 'wifi',
      label: 'WiFi',
      icon: <Wifi className="h-[65px] w-[65px]" /> // Use correct icon if available
    },
    {
      value: 'dedicatedWorkspace',
      label: 'Dedicated Workspace',
      icon: <AmenitiesIcons.UpdatedDedicatedWorkspaceIcon className="p-1 mt-0" />
    },
  ];

  const laundryOptions = [
    {
      value: 'washerInUnit',
      label: 'In-Unit Laundry',
      id: 'inUnit',
    },
    {
      value: 'washerInComplex',
      label: 'In-Unit or On-Site Laundry',
      id: 'inComplex',
    },
    {
      value: 'washerNotAvailable',
      label: 'No Laundry Preference',
      id: 'notAvailable',
    }
  ];

  const luxuryOptions = [
    {
      value: 'fireplace',
      label: 'Fireplace',
      icon: <AmenitiesIcons.UpdatedFireplaceIcon className="p-1 mt-0" />
    },
    {
      value: 'gym',
      label: 'Gym',
      icon: <AmenitiesIcons.UpdatedGymIcon className="p-1 mt-0" />
    },
    {
      value: 'sauna',
      label: 'Sauna',
      icon: <AmenitiesIcons.UpdatedSaunaIcon className="p-1 mt-0" />
    },
    {
      value: 'balcony',
      label: 'Balcony',
      icon: <AmenitiesIcons.UpdatedBalconyIcon className="p-1 mt-0" />
    },
    {
      value: 'pool',
      label: 'Pool',
      icon: <AmenitiesIcons.PoolIcon className="p-0 mt-2" />
    },
    {
      value: 'hotTub',
      label: 'Hot Tub',
      icon: <AmenitiesIcons.UpdatedHotTubIcon className="p-1 mt-0" />
    },
    {
      value: 'patio',
      label: 'Patio',
      icon: <AmenitiesIcons.UpdatedPatioIcon className="p-1 mt-0" />
    },
    {
      value: 'sunroom',
      label: 'Sunroom',
      icon: <AmenitiesIcons.UpdatedSunroomIcon className="p-1 mt-0" />
    }
  ];

  const minimumOptions = [
    {
      key: 'minBedrooms',
      label: 'Bedrooms',
    },
    {
      key: 'minBathrooms',
      label: 'Bathrooms',
    }
  ];

  const MINIMUM_OPTIONS = [
    { label: 'Any', value: 0 },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
    { label: '5+', value: 5 },
    { label: '6+', value: 6 },
  ];

  // Calculate filtered listings count based on local filters
  const filteredListingsCount = useMemo(() => {
    return listings.filter(listing => {
      // Property type filter
      const matchesPropertyType = localFilters.propertyTypes.length === 0 ||
        localFilters.propertyTypes.includes(listing.category);

      // Price filter - use calculatedPrice instead of price
      const price = listing.calculatedPrice || 0;
      const matchesPrice = (
        (!localFilters.minPrice && !localFilters.maxPrice) || // No price filters set
        (localFilters.minPrice && !localFilters.maxPrice && price >= localFilters.minPrice) || // Only min price set
        (!localFilters.minPrice && localFilters.maxPrice && price <= localFilters.maxPrice) || // Only max price set
        (localFilters.minPrice && localFilters.maxPrice && price >= localFilters.minPrice && price <= localFilters.maxPrice) // Both prices set
      );

      const matchesRadius = localFilters.searchRadius === 0 || (listing.distance || 100) < localFilters.searchRadius;

      // Room filters
      const matchesBedrooms = !localFilters.minBedrooms || (listing.bedrooms?.length || 0) >= localFilters.minBedrooms;
      const matchesBaths = !localFilters.minBathrooms || listing.bathroomCount >= localFilters.minBathrooms;

      // Furniture filter
      const matchesFurniture =
        (!localFilters.furnished && !localFilters.unfurnished) ||
        (localFilters.furnished && listing.furnished) ||
        (localFilters.unfurnished && !listing.furnished);


      // Utilities filter
      const matchesUtilities =
        localFilters.utilities.length === 0 || localFilters.utilities.length === 2 ||
        (localFilters.utilities.includes('utilitiesIncluded') && listing.utilitiesIncluded) ||
        (localFilters.utilities.includes('utilitiesNotIncluded') && !listing.utilitiesIncluded);

      // Pets filter
      const matchesPets =
        localFilters.pets.length === 0 || localFilters.pets.length === 2 ||
        (localFilters.pets.includes('petsAllowed') && listing.petsAllowed) ||
        (localFilters.pets.includes('petsNotAllowed') && !listing.petsAllowed);

      // Amenity filters
      const matchesAccessibility = localFilters.accessibility?.length === 0 ||
        localFilters.accessibility?.every(option => listing[option]);

      const matchesLocation = localFilters.location?.length === 0 ||
        localFilters.location?.every(option => listing[option]);

      const matchesParking = localFilters.parking?.length === 0 ||
        localFilters.parking?.every(option => listing[option]);

      const matchesKitchen = localFilters.kitchen?.length === 0 ||
        localFilters.kitchen?.every(option => listing[option]);

      const matchesBasics = localFilters.basics?.length === 0 ||
        localFilters.basics?.every(option => listing[option]);

      const matchesLuxury = localFilters.luxury?.length === 0 ||
        localFilters.luxury?.every(option => listing[option]);

      // Reason for filter.laundry.length ===3 is right now we are only doing a check for
      // (inComplex, inUnit, notAvailable). If we need to add dryer or
      // another category this must change
      const matchesLaundry = localFilters.laundry?.length === 0 || localFilters.laundry?.length === 3 ||
        localFilters.laundry?.some(option => listing[option]);

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
        matchesBasics && // Renamed from matchesClimateControl
        matchesLuxury &&
        matchesLaundry;
    }).length;
  }, [listings, localFilters]);

  // Reset local filters when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(contextFilters);
      setPriceInputs({
        min: `$${contextFilters.minPrice || ''}`,
        max: `$${contextFilters.maxPrice || ''}`
      });
    }
  }, [isOpen, contextFilters]);

  const handleLocalFilterChange = (key: keyof FilterOptions, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Check if filters have changed
  const hasChanges = useMemo(() => {
    return JSON.stringify(localFilters) !== JSON.stringify(contextFilters);
  }, [localFilters, contextFilters]);

  const handleSave = () => {
    updateFilters(localFilters);
    onOpenChange(false);
  };

  // Handle price input changes
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    // Update the price inputs state
    setPriceInputs(prev => ({
      ...prev,
      [type]: value
    }));

    // Extract numeric value for filters
    const numericValue = parseInt(value.replace(/[$,\s]/g, '')) || 0;
    handleLocalFilterChange(
      type === 'min' ? 'minPrice' : 'maxPrice',
      numericValue
    );
  };

  const clearFilters = () => {
    const defaultFilters = {
      propertyTypes: [],
      minPrice: null,
      maxPrice: null,
      minBedrooms: 0,
      minBeds: 0,
      minBathrooms: 0,
      furnished: false,
      unfurnished: false,
      utilities: [],
      pets: [],
      searchRadius: 50,
      accessibility: [],
      location: [],
      parking: [],
      kitchen: [],
      basics: [], // Renamed from climateControl
      luxury: [],
      laundry: [],
    };

    setLocalFilters(defaultFilters);
    setPriceInputs({
      min: '',
      max: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Filter Button Trigger */}
      <DialogTrigger asChild>
        <Button variant="outline" className={`flex justify-between rounded-[5px] items-center gap-x-1 h-fit px-2 py-1 ${className}`}>
          <UpdatedFilterIcon className='h-[18px]  ' />
          <span className="text-[#404040] text-center  text-[10px] font-normal">Filters</span>
        </Button>
      </DialogTrigger>

      {/* Main Dialog Content */}
      <DialogContent aria-describedby='Filter selection modal' className={TallDialogContent}>
        <DialogTitle className={TallDialogTitle}>
          Filters
        </DialogTitle>
        {/* Scrollable Filter Content Area */}
        <ScrollArea className="flex-1  px-6 py-0 ">
          <div className="">
            <div className="w-full">

              {/* Filter Options Container */}
              <div className="">
                {/* Property Types Section */}
                <div className="space-y-4 border-b-2 pb-3">
                  <h3 className="text-[18px] font-medium text-[#404040]">Property Types</h3>
                  <div className="flex flex-wrap xxs:flex-nowrap justify-between gap-x-2 sm:gap-4">
                    {propertyTypeOptions.map(({ value, label, icon }) => {
                      const isSelected = localFilters.propertyTypes.includes(value);
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            const updatedPropertyTypes = isSelected
                              ? localFilters.propertyTypes.filter(type => type !== value)
                              : [...localFilters.propertyTypes, value];
                            handleLocalFilterChange('propertyTypes', updatedPropertyTypes);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Price Range Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px]  font-medium text-[#404040]">Price Range</h3>
                  <div className="flex items-center justify-between gap-4">
                    <CurrencyInput
                      id="min-price"
                      label="Minimum"
                      value={priceInputs.min}
                      onChange={(value) => handlePriceChange('min', value)}
                      placeholder="$0"
                      className='w-full'
                    />
                    <div className="border w-10  border-[#404040] mt-6" />
                    <CurrencyInput
                      id="max-price"
                      label="Maximum"
                      value={priceInputs.max}
                      onChange={(value) => handlePriceChange('max', value)}
                      placeholder="$10000"
                      className='w-full'
                    />
                  </div>
                </div>

                {/* Furnishings Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Furnishings</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'furnished',
                        label: 'Furnished',
                        icon: <AmenitiesIcons.UpdatedFurnishedIcon className="p-1" />
                      },
                      {
                        value: 'unfurnished',
                        label: 'Unfurnished',
                        icon: <AmenitiesIcons.UpdatedUnfurnishedIcon className="p-1" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = value === 'furnished' ? localFilters.furnished : localFilters.unfurnished;
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            if (value === 'furnished') {
                              handleLocalFilterChange('furnished', !localFilters.furnished);
                            } else {
                              handleLocalFilterChange('unfurnished', !localFilters.unfurnished);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Utilities Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Utilities</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'utilitiesIncluded',
                        label: 'Utilities Included',
                        icon: <AmenitiesIcons.UpdatedUtilitiesIncludedIcon className="p-1" />
                      },
                      {
                        value: 'utilitiesNotIncluded',
                        label: 'Utilities Not Included',
                        icon: <AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon className="p-1" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = localFilters.utilities.includes(value);
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            const updatedUtilities = isSelected
                              ? localFilters.utilities.filter(item => item !== value) // Remove if selected
                              : [...localFilters.utilities, value]; // Add if not selected
                            handleLocalFilterChange('utilities', updatedUtilities);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Pets Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Pets</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'petsAllowed',
                        label: 'Pets Allowed',
                        icon: <AmenitiesIcons.UpdatedPetFriendlyIcon className="mt-1" />
                      },
                      {
                        value: 'petsNotAllowed',
                        label: 'No Pets',
                        icon: <AmenitiesIcons.UpdatedPetUnfriendlyIcon className="" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = localFilters.pets.includes(value);
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            const updatedPets = isSelected
                              ? localFilters.pets?.filter(item => item !== value) || []
                              : [...(localFilters.pets || []), value];
                            handleLocalFilterChange('pets', updatedPets);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Search Radius Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px]  font-medium text-[#404040]">Search Radius</h3>
                  <div className="px-4">
                    <div className="flex justify-end ">
                      <span className=" font-medium text-[14px] text-[#2D2F2E80]">
                        {localFilters.searchRadius || 50} miles
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={localFilters.searchRadius || 50}
                      onChange={(e) => handleLocalFilterChange('searchRadius', parseInt(e.target.value))}
                      className={`
                        w-full
                        h-2
                        bg-gray-200
                        rounded-lg
                        appearance-none
                        cursor-pointer
                        accent-[#4F4F4F]
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-6
                        [&::-webkit-slider-thumb]:h-6
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[#4F4F4F]
                        [&::-moz-range-thumb]:w-6
                        [&::-moz-range-thumb]:h-6
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[#4F4F4F]
                        [&::-moz-range-thumb]:border-0
                      `}
                    />
                  </div>
                </div>

                {/* Laundry Section */}
                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-col border-black space-y-[3px]">
                      <AmenitiesIcons.DryerIcon className="w-[49px] h-[53px]" />
                      <AmenitiesIcons.WasherIcon className="w-[49px] h-[53px]" />
                    </div>
                    <div className="flex flex-col justify-between space-y-3">
                      {laundryOptions.map((option) => (
                        <div key={option.id} className='flex items-center gap-x-2'>
                          <input
                            type="radio"
                            id={option.id}
                            name="laundry"
                            checked={
                              (option.value === 'washerInUnit' && localFilters.laundry?.length === 1) ||
                              (option.value === 'washerInComplex' && localFilters.laundry?.length === 2) ||
                              (option.value === 'washerNotAvailable' && localFilters.laundry?.length === 3)
                            }
                            className='appearance-none w-[25px] h-[25px] border-[#70707045] border rounded-full cursor-pointer
                             relative flex items-center justify-center before:content-[""] before:w-[15px] before:h-[15px] before:rounded-full
                             checked:before:bg-[#4F4F4F] checked:border-[#4F4F4F] md:hover:border-[#4F4F4F] transition-colors'
                            onChange={() => { }}
                            onClick={() => {
                              // If clicking the currently selected option, clear the selection
                              if (
                                (option.value === 'washerInUnit' && localFilters.laundry?.length === 1) ||
                                (option.value === 'washerInComplex' && localFilters.laundry?.length === 2) ||
                                (option.value === 'washerNotAvailable' && localFilters.laundry?.length === 3)
                              ) {
                                handleLocalFilterChange('laundry', []);
                                return;
                              }

                              // Handle different selections
                              switch (option.value) {
                                case 'washerInUnit':
                                  handleLocalFilterChange('laundry', ['washerInUnit']);
                                  break;
                                case 'washerInComplex':
                                  handleLocalFilterChange('laundry', ['washerInUnit', 'washerInComplex']);
                                  break;
                                case 'washerNotAvailable':
                                  handleLocalFilterChange('laundry', ['washerInUnit', 'washerInComplex', 'washerNotAvailable']);
                                  break;
                              }
                            }}
                          />
                          <label
                            htmlFor={option.id}
                            className='text-[#2D2F2E80]  font-medium cursor-pointer'
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Tiles Section */}
          {/* Basics Section - Moved Up */}
          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Basics</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-start gap-4">
                {basicsOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.basics?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        const updatedAmenities = isSelected
                          ? (localFilters.basics || []).filter(item => item !== value)
                          : [...(localFilters.basics || []), value];
                        handleLocalFilterChange('basics', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Accessibility and Safety Section */}
          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Accessibility and Safety</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-start gap-4">
                {accessibilityOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.accessibility?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        logger.debug('Filter selection clicked', { localFilters, value });
                        const updatedAmenities = isSelected
                          ? (localFilters.accessibility || []).filter(item => item !== value)
                          : [...(localFilters.accessibility || []), value];
                        handleLocalFilterChange('accessibility', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Location</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-between gap-4">
                {locationOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.location?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] md:hover:bg-gray-100 transition-[background-color] duration-200 p-1 cursor-pointer box-border ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        const updatedAmenities = isSelected
                          ? (localFilters.location || []).filter(item => item !== value)
                          : [...(localFilters.location || []), value];
                        handleLocalFilterChange('location', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Parking</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-start gap-4">
                {parkingOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.parking?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        const updatedAmenities = isSelected
                          ? (localFilters.parking || []).filter(item => item !== value)
                          : [...(localFilters.parking || []), value];
                        handleLocalFilterChange('parking', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Kitchen</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-start gap-4">
                {kitchenOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.kitchen?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        const updatedAmenities = isSelected
                          ? (localFilters.kitchen || []).filter(item => item !== value)
                          : [...(localFilters.kitchen || []), value];
                        handleLocalFilterChange('kitchen', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Climate Control Section - Removed/Replaced by Basics */}
          {/* <div className="space-y-4 border-b-2 py-6"> ... </div> */}

          <div className="space-y-4 border-b-2 py-6">
            <h3 className="text-[18px] font-medium text-[#404040]">Luxury</h3>
            <div className='flex flex-wrap'>
              <div className="flex flex-wrap justify-start gap-4">
                {luxuryOptions.map(({ value, label, icon }) => {
                  const isSelected = localFilters.luxury?.includes(value);
                  return (
                    <Tile
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[109px] w-[109px] p-1 cursor-pointer box-border md:hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                        : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                        }`}
                      labelClassNames={`text-[14px]  font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      onClick={() => {
                        const updatedAmenities = isSelected
                          ? (localFilters.luxury || []).filter(item => item !== value)
                          : [...(localFilters.luxury || []), value];
                        handleLocalFilterChange('luxury', updatedAmenities);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Minimum Requirements Section */}
          <div className='border-b-2 py-6'>
            <h3 className="text-[18px] font-medium text-[#404040] mb-6">Minimum Requirements</h3>
            <div className="space-y-4">
              {minimumOptions.map(({ key, label }) => (
                <div key={key} className="text-center">
                  <h4 className="text-[16px] font-normal text-[#404040] text-left mb-2 font-200">{label}</h4>
                  <div className="flex flex-wrap justify-start gap-2">
                    {MINIMUM_OPTIONS.map(({ label: optionLabel, value }) => (
                      <Button
                        key={value}
                        variant={localFilters[key] === value ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => {
                          if (localFilters[key] === value) {
                            if (value === 0) { return; }
                            handleLocalFilterChange(key, 0);
                          }
                          else {
                            handleLocalFilterChange(key, value)
                          }
                        }}
                      >
                        {optionLabel}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>


        {/* Footer Actions Section */}
        <div className="border-t border-gray-200 bg-background py-2 px-4 xxs:px-6 mt-0">
          <div className="flex justify-between space-x-2 items-center ">
            <Button variant='outline' className='rounded-full text-[12px] xxs:text-[14px] px-2 xxs:px-4' onClick={clearFilters} >
              Clear filters
            </Button>
            <div className="flex space-x-2 xxs:space-x-4 ">
              <Button
                variant="outline"
                className='rounded-full text-[12px] xxs:text-[14px] px-2 xxs:px-4'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className='py-0 rounded-full text-[12px] xxs:text-[14px] px-2 xxs:px-4'
              >
                Show {filteredListingsCount} listings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterOptionsDialog;
