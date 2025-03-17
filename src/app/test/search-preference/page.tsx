'use client';

import React, { useState } from 'react';
import Tile from '@/components/ui/tile';
import CurrencyInput from '@/components/ui/currency-input';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FilterOptions {
  minPrice: number | null;
  maxPrice: number | null;
  furnished: boolean;
  unfurnished: boolean;
  utilities: string[];
  pets: string[];
}

export default function SearchPreferenceDisplay() {
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    furnished: false,
    unfurnished: false,
    utilities: [],
    pets: []
  });

  const [priceInputs, setPriceInputs] = useState({
    min: '',
    max: ''
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle price input changes
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    // Update the price inputs state
    setPriceInputs(prev => ({
      ...prev,
      [type]: value
    }));

    // Extract numeric value for filters
    const numericValue = parseInt(value.replace(/[$,\s]/g, '')) || null;
    handleFilterChange(
      type === 'min' ? 'minPrice' : 'maxPrice',
      numericValue
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Search Preferences</h1>

      <ScrollArea className="h-[600px] w-full rounded-md border p-4">
        {/* Price Range Section */}
        <div className="space-y-4 border-b-2 py-6">
          <h3 className="text-[18px] font-medium text-[#404040]">Price Range</h3>
          <div className="flex items-center justify-between gap-4">
            <CurrencyInput
              id="min-price"
              label="Minimum"
              value={priceInputs.min}
              onChange={(value) => handlePriceChange('min', value)}
              placeholder="$0"
              className='w-full'
            />
            <div className="border w-10 border-[#404040] mt-6" />
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
              const isSelected = value === 'furnished' ? filters.furnished : filters.unfurnished;
              return (
                <Tile
                  key={value}
                  icon={icon}
                  label={label}
                  className={`h-[109px] w-[109px] p-1 cursor-pointer box-border hover:bg-gray-100 ${isSelected
                    ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                    : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                    }`}
                  labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                    }`}
                  onClick={() => {
                    if (value === 'furnished') {
                      handleFilterChange('furnished', !filters.furnished);
                    } else {
                      handleFilterChange('unfurnished', !filters.unfurnished);
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
              const isSelected = filters.utilities.includes(value);
              return (
                <Tile
                  key={value}
                  icon={icon}
                  label={label}
                  className={`h-[109px] w-[109px] p-1 cursor-pointer box-border hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                    ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                    : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                    }`}
                  labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                    }`}
                  onClick={() => {
                    const updatedUtilities = isSelected
                      ? filters.utilities.filter(item => item !== value) // Remove if selected
                      : [...filters.utilities, value]; // Add if not selected
                    handleFilterChange('utilities', updatedUtilities);
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
              const isSelected = filters.pets.includes(value);
              return (
                <Tile
                  key={value}
                  icon={icon}
                  label={label}
                  className={`h-[109px] w-[109px] p-1 cursor-pointer box-border hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                    ? 'border-[#2D2F2E] border-[3px] !p-[3px]'
                    : 'border-[#2D2F2E40] border-[2px] !p-[4px]'
                    }`}
                  labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                    }`}
                  onClick={() => {
                    const updatedPets = isSelected
                      ? filters.pets.filter(item => item !== value) || []
                      : [...(filters.pets || []), value];
                    handleFilterChange('pets', updatedPets);
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-6 flex justify-end">
          <Button 
            className="py-2 rounded-full text-[14px] px-4"
          >
            Save Preferences
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}