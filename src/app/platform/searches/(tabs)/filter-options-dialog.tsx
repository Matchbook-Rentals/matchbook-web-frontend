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
import DateDaySelector from '@/components/ui/custom-calendar/date-day-selector/date-day-selector';
import FilterGrouping from '../(components)/FilterGrouping';

interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  moveInDate: Date;
  moveOutDate: Date;
  flexibleMoveInStart: Date;
  flexibleMoveInEnd: Date;
  flexibleMoveOutStart: Date;
  flexibleMoveOutEnd: Date;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
  flexibleMoveIn: boolean;
  flexibleMoveOut: boolean;
  utilities: string[];
  propertyTypes: string[];
}

interface FilterOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: string | number | boolean | string[]) => void;
  className: string;
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
        <Button variant="outline" className={`flex items-center rounded-full p-2 w-[156px] ${className}`}>
          <FilterIcon className="mr-2 w-[28px] h-[15px] text-charcoalBrand/80" />
          <span className='text-charcoalBrand/80' style={{ color: 'var(--Major-Text, #404040)', fontFamily: 'Montserrat', fontSize: '24px', fontStyle: 'normal', fontWeight: '500', lineHeight: 'normal' }}>Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[100vw] sm:h-[100vh] sm:m-0 p-0">
        <div className="p-6 h-full overflow-y-auto flex flex-col items-center">
          <div className="w-full ">
            <div className="flex justify-center items-center mb-6">
              <h2 className="text-3xl font-semibold">Filters</h2>
            </div>

            <div className="space-y-6 ">
              <div className="flex justify-between max-w-md mx-auto items-center">
                <div className="flex flex-col items-center">
                  <Label htmlFor="flexible-move-in" className="mb-2">Flexible move in</Label>
                  <Switch
                    id="flexible-move-in"
                    checked={filters.flexibleMoveIn}
                    onCheckedChange={(checked) => onFilterChange('flexibleMoveIn', checked)}
                    className="data-[state=checked]:bg-primaryBrand"
                  />
                  <span className="text-sm text-gray-500 mt-1">
                    {filters.flexibleMoveIn ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Label htmlFor="flexible-move-out" className="mb-2">Flexible move out</Label>
                  <Switch
                    id="flexible-move-out"
                    checked={filters.flexibleMoveOut}
                    onCheckedChange={(checked) => onFilterChange('flexibleMoveOut', checked)}
                    className="data-[state=checked]:bg-primaryBrand"
                  />
                  <span className="text-sm text-gray-500 mt-1">
                    {filters.flexibleMoveOut ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center w-full">
                <div className="flex justify-center w-full space-x-4">
                  <div className="flex flex-col items-center">
                    <Label htmlFor="move-in-date" className="mb-2">Move in date</Label>
                    <DateDaySelector
                      id="move-in-date"
                      selectedDate={filters.moveInDate}
                      tripDate={filters.moveInDate}
                      onDateSelect={(dates) => {
                        onFilterChange('flexibleMoveInStart', dates[0]);
                        onFilterChange('flexibleMoveInEnd', dates[1]);
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-center">
                    <Label htmlFor="move-out-date" className="mb-2">Move out date</Label>
                    <DateDaySelector
                      id="move-out-date"
                      selectedDate={filters.moveOutDate}
                      tripDate={filters.moveOutDate}
                      onDateSelect={(dates) => {
                        onFilterChange('flexibleMoveOutStart', dates[0]);
                        onFilterChange('flexibleMoveOutEnd', dates[1]);
                      }}
                    />
                  </div>
                </div>
              </div>

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
