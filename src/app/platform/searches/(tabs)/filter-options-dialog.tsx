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

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[18px] font-medium text-[#404040]">Property Types</h3>
                  <div className="flex justify-around gap-4">
                    {propertyTypeOptions.map(({ value, label, icon }) => {
                      const isSelected = localFilters.propertyTypes.includes(value);
                      return (
                        <Tile
                          key={value}
                          icon={icon}
                          label={label}
                          className={`h-[109px] w-[109px] p-1 cursor-pointer box-border ${
                            isSelected
                              ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                              : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                          }`}
                          labelClassNames={`text-[14px] font-montserrat-medium leading-tight ${
                            isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
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

                <div className="space-y-4">
                  <h3 className="text-[18px] font-medium text-[#404040]">Price Range</h3>
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

                {['bedrooms', 'beds', 'baths'].map((category) => (
                  <CategoryFilter
                    key={category}
                    category={category}
                    value={localFilters[category as keyof FilterOptions] as string}
                    onFilterChange={handleLocalFilterChange}
                  />
                ))}

                <FilterGrouping
                  title='Furniture'
                  options={[
                    { label: 'Furnished', imageSrc: '/icon_png/furnished.png', height: 90, width: 120 },
                    { label: 'Unfurnished', imageSrc: '/icon_png/unfurnished.png', height: 90, width: 90 },
                  ]}
                  selectedOptions={[
                    ...(localFilters.furnished ? ['Furnished'] : []),
                    ...(localFilters.unfurnished ? ['Unfurnished'] : []),
                  ]}
                  onFilterChange={(label, checked) => {
                    if (label === 'Furnished') {
                      handleLocalFilterChange('furnished', checked);
                    } else if (label === 'Unfurnished') {
                      handleLocalFilterChange('unfurnished', checked);
                    }
                  }}
                />

                <FilterGrouping
                  title='Utilities'
                  options={[{ label: 'Included In Rent', imageSrc: '/icon_png/utilites.png', height: 90, width: 90 }]}
                  selectedOptions={localFilters.utilities}
                  onFilterChange={(label, checked) => {
                    const updatedUtilities = checked
                      ? [...localFilters.utilities, label]
                      : localFilters.utilities.filter(item => item !== label);
                    handleLocalFilterChange('utilities', updatedUtilities);
                  }}
                />

              </div>
            </div>
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
