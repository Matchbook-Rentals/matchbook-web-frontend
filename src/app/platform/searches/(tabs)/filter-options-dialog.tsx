//Imports
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import PriceFilter from '../(components)/PriceFilter';
import CategoryFilter from '../(components)/CategoryFilter';
import FilterGrouping from '../(components)/FilterGrouping';
import Tile from "@/components/ui/tile";
import Paddle from "@/components/ui/paddle";
import * as AmenitiesIcons from '@/components/icons/amenities';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ScrollArea } from "@/components/ui/scroll-area"
import CurrencyInput from '@/components/ui/currency-input';
import { CheckboxDemo } from '@/app/platform/preferences/custom-checkbox';


interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
  utilities: string[];
  propertyTypes: string[];
  pets: string[];
  searchRadius: number;
  laundry?: string[];
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
      value: 'single_family',
      label: 'Single Family',
      icon: <AmenitiesIcons.SingleFamilyIcon className="p-1 mt-2" />
    },
    {
      value: 'apartment',
      label: 'Apartment',
      icon: <AmenitiesIcons.ApartmentIcon className=" mt-2" />
    },
    {
      value: 'private_room',
      label: 'Private Room',
      icon: <AmenitiesIcons.SingleRoomIcon className="p-1 mt-2" />
    },
    {
      value: 'townhouse',
      label: 'Townhouse',
      icon: <AmenitiesIcons.TownhouseIcon className="p-1 mt-2" />
    },
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

      // Room filters
      const matchesBedrooms = !localFilters.bedrooms || listing.bedrooms === localFilters.bedrooms;
      const matchesBeds = !localFilters.beds || listing.beds === localFilters.beds;
      const matchesBaths = !localFilters.baths || listing.baths === localFilters.baths;

      // Furniture filter
      const matchesFurniture =
        (!localFilters.furnished && !localFilters.unfurnished) ||
        (localFilters.furnished && listing.furnished) ||
        (localFilters.unfurnished && !listing.furnished);

      // Utilities filter
      const matchesUtilities = localFilters.utilities.length === 0 ||
        localFilters.utilities.every(utility => listing.utilities?.includes(utility));

      return matchesPropertyType &&
        matchesPrice &&
        matchesBedrooms &&
        matchesBeds &&
        matchesBaths &&
        matchesFurniture &&
        matchesUtilities;
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`flex items-center rounded-full p-2 px-4 ${className}`}>
          <span className="text-[#404040] text-center font-lora text-[16px] font-medium">Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[536px] sm:h-[90vh] sm:m-0 p-0 flex flex-col font-montserrat">
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="w-full">
              <div className="flex justify-center border-b border-gray-300 items-center mb-6">
                <h2 className="text-[20px] text-[#404040] text-center font-montserrat font-medium">Filters</h2>
              </div>

              <div className="">
                <div className="space-y-4 border-b-2 pb-3">
                  <h3 className="text-[18px] font-medium text-[#404040]">Property Types</h3>
                  <div className="flex justify-around gap-4">
                    {propertyTypeOptions.map(({ value, label, icon }) => {
                      const isSelected = localFilters.propertyTypes.includes(value);
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px] font-montserrat-medium leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
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

                <div className="space-y-4  border-b-2 py-6">
                  <h3 className="text-[18px] font-montserrat-medium text-[#404040]">Price Range</h3>
                  <div className="flex items-center justify-center gap-4">
                    <CurrencyInput
                      id="min-price"
                      label="Minimum"
                      value={priceInputs.min}
                      onChange={(value) => handlePriceChange('min', value)}
                      placeholder="$0"
                    />
                    <div className="border-t-2 w-6 border-[#404040] mt-6" />
                    <CurrencyInput
                      id="max-price"
                      label="Maximum"
                      value={priceInputs.max}
                      onChange={(value) => handlePriceChange('max', value)}
                      placeholder="$10000"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Furnishings</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'furnished',
                        label: 'Furnished',
                        icon: <AmenitiesIcons.FurnishedIcon className="mt-4" />
                      },
                      {
                        value: 'unfurnished',
                        label: 'Unfurnished',
                        icon: <AmenitiesIcons.UnfurnishedIcon className="mt-4" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = value === 'furnished' ? localFilters.furnished : localFilters.unfurnished;
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px] font-montserrat-medium leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
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

                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Utilities</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'included',
                        label: 'Utilities Included',
                        icon: <AmenitiesIcons.UtilitiesIncludedIcon className="mt-1" />
                      },
                      {
                        value: 'not_included',
                        label: 'Utilities Not Included',
                        icon: <AmenitiesIcons.UtilitiesNotIncludedIcon className="mt-1" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = value === 'included'
                        ? localFilters.utilities.includes('Included In Rent')
                        : localFilters.utilities.includes('Not Included In Rent');
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px] font-montserrat-medium leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            const optionValue = value === 'included' ? 'Included In Rent' : 'Not Included In Rent';
                            const updatedUtilities = isSelected
                              ? localFilters.utilities.filter(item => item !== optionValue)
                              : [...localFilters.utilities, optionValue];
                            handleLocalFilterChange('utilities', updatedUtilities);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Pets</h3>
                  <div className="flex justify-start gap-4">
                    {[
                      {
                        value: 'allowed',
                        label: 'Pets Allowed',
                        icon: <AmenitiesIcons.PetFriendlyIcon className="mt-4" />
                      },
                      {
                        value: 'not_allowed',
                        label: 'No Pets',
                        icon: <AmenitiesIcons.PetUnfriendlyIcon className="mt-4" />
                      }
                    ].map(({ value, label, icon }) => {
                      const isSelected = value === 'allowed'
                        ? localFilters.pets?.includes('Allowed')
                        : localFilters.pets?.includes('Not Allowed');
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border ${isSelected
                            ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                            : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                            }`}
                          labelClassNames={`text-[14px] font-montserrat-medium leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                            }`}
                          onClick={() => {
                            const optionValue = value === 'allowed' ? 'Allowed' : 'Not Allowed';
                            const updatedPets = isSelected
                              ? localFilters.pets?.filter(item => item !== optionValue) || []
                              : [...(localFilters.pets || []), optionValue];
                            handleLocalFilterChange('pets', updatedPets);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-montserrat-medium text-[#404040]">Search Radius</h3>
                  <div className="px-4">
                    <div className="flex justify-end ">
                      <span className="font-montserrat-medium text-[14px] text-[#2D2F2E80]">
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

                <div className="space-y-4 border-b-2 py-6">
                  <h3 className="text-[18px] font-medium text-[#404040]">Laundry</h3>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-col">
                      <AmenitiesIcons.WasherIcon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {['In Unit', 'In Complex', 'Not Available'].map((option) => (
                        <CheckboxDemo
                          key={option}
                          label={option}
                          isChecked={localFilters.laundry?.includes(option)}
                          handleChange={() => {
                            const updatedLaundry = localFilters.laundry?.includes(option)
                              ? localFilters.laundry?.filter(item => item !== option) || []
                              : [...(localFilters.laundry || []), option];
                            handleLocalFilterChange('laundry', updatedLaundry);
                          }}
                          details={{ id: option }}
                          checkOnLeft={true}
                          labelClassName="text-[14px] text-[#2D2F2E80]"
                          checkboxClassName="rounded-[15px] border-gray-300"
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className='border-b-2 py-6'>
            {['bedrooms', 'beds', 'baths'].map((category) => (
              <CategoryFilter
                key={category}
                category={category}
                value={localFilters[category as keyof FilterOptions] as string}
                onFilterChange={handleLocalFilterChange}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-gray-200 bg-background p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredListingsCount} listings
            </span>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterOptionsDialog;
