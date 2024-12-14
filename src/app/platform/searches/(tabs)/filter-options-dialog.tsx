//Imports
import React from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { FilterIcon } from '@/components/icons/actions';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PriceFilter from '../(components)/PriceFilter';
import CategoryFilter from '../(components)/CategoryFilter';
import FurnitureFilter from '../(components)/FurnitureFilter';
import FilterGrouping from '../(components)/FilterGrouping';

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
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: string | number | boolean | string[]) => void;
  className?: string;
}

const FilterOptionsDialog: React.FC<FilterOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  filters,
  onFilterChange,
  className,
}) => {
  // Ensure that utilities and propertyTypes are initialized as arrays
  const safeFilters = {
    ...filters,
    utilities: filters.utilities || [],
    propertyTypes: filters.propertyTypes || [],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`flex items-center rounded-full p-2 px-4 ${className}`}>
          <span className="text-[#404040] text-center font-montserrat text-[16px] font-medium">Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[551px] sm:h-[90vh] sm:m-0 p-0">
        <div className="p-6 h-full overflow-y-auto flex flex-col items-center">
          <div className="w-full ">
            <div className="flex justify-center border-b border-gray-300 items-center mb-6">
              <h2 className="text-[20px] text-[#404040] text-center font-montserrat font-medium">Filters</h2>
            </div>

            <div className="space-y-6 ">
              <PriceFilter
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onFilterChange={onFilterChange}
              />

              {['bedrooms', 'beds', 'baths'].map((category) => (
                <CategoryFilter
                  key={category}
                  category={category}
                  value={filters[category as keyof FilterOptions] as string}
                  onFilterChange={onFilterChange}
                />
              ))}

              <FilterGrouping
                title='Furniture'
                options={[
                  { label: 'Furnished', imageSrc: '/icon_png/furnished.png', height: 90, width: 120 },
                  { label: 'Unfurnished', imageSrc: '/icon_png/unfurnished.png', height: 90, width: 90 },
                ]}
                selectedOptions={[
                  ...(filters.furnished ? ['Furnished'] : []),
                  ...(filters.unfurnished ? ['Unfurnished'] : []),
                ]}
                onFilterChange={(label, checked) => {
                  if (label === 'Furnished') {
                    onFilterChange('furnished', checked);
                  } else if (label === 'Unfurnished') {
                    onFilterChange('unfurnished', checked);
                  }
                }}
              />

              <FilterGrouping
                title='Utilities'
                options={[{ label: 'Included In Rent', imageSrc: '/icon_png/utilites.png', height: 90, width: 90 }]}
                selectedOptions={safeFilters.utilities}
                onFilterChange={(label, checked) => {
                  const updatedUtilities = checked
                    ? [...safeFilters.utilities, label]
                    : safeFilters.utilities.filter(item => item !== label);
                  onFilterChange('utilities', updatedUtilities);
                }}
              />
              <FilterGrouping
                title='Property Type'
                options={[
                  { label: 'Single Family', imageSrc: '/icon_png/single_family.png', height: 90, width: 90 },
                  { label: 'Apartment', imageSrc: '/icon_png/apartment.png', height: 90, width: 90 },
                  { label: 'Single Room', imageSrc: '/icon_png/single_room.png', height: 90, width: 90 },
                  { label: 'Townhouse', imageSrc: '/icon_png/townhouse.png', height: 90, width: 90 },
                ]}
                selectedOptions={safeFilters.propertyTypes}
                onFilterChange={(label, checked) => {
                  const updatedPropertyTypes = checked
                    ? [...safeFilters.propertyTypes, label]
                    : safeFilters.propertyTypes.filter(item => item !== label);
                  onFilterChange('propertyTypes', updatedPropertyTypes);
                }}
              />

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
};

export default FilterOptionsDialog;
