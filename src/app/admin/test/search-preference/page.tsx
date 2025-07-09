'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Paddle from '@/components/ui/paddle';
import CurrencyInput from '@/components/ui/currency-input';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Settings } from 'lucide-react';

interface FilterOptions {
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  furnished: boolean;
  unfurnished: boolean;
  utilities: string[];
  pets: string[];
  minBedrooms: number;
  minBathrooms: number;
}

export default function SearchPreferenceTest() {
  const [filters, setFilters] = useState<FilterOptions>({
    propertyTypes: [],
    minPrice: null,
    maxPrice: null,
    furnished: false,
    unfurnished: false,
    utilities: [],
    pets: [],
    minBedrooms: 0,
    minBathrooms: 0
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

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    setPriceInputs(prev => ({
      ...prev,
      [type]: value
    }));

    const numericValue = parseInt(value.replace(/[$,\s]/g, '')) || null;
    handleFilterChange(
      type === 'min' ? 'minPrice' : 'maxPrice',
      numericValue
    );
  };

  const propertyTypeOptions = [
    {
      value: 'singleFamily',
      label: 'Single Family',
      icon: <AmenitiesIcons.UpdatedSingleFamilyIcon className="w-full h-full" />
    },
    {
      value: 'apartment',
      label: 'Apartment',
      icon: <AmenitiesIcons.UpdatedApartmentIcon className="w-full h-full" />
    },
    {
      value: 'privateRoom',
      label: 'Private Room',
      icon: <AmenitiesIcons.UpdatedSingleRoomIcon className="w-full h-full" />
    },
    {
      value: 'townhouse',
      label: 'Townhouse',
      icon: <AmenitiesIcons.UpdatedTownhouseIcon className="w-full h-full" />
    },
  ];

  const handleSavePreferences = () => {
    console.log('Saving preferences:', filters);
    alert('Preferences saved! Check console for details.');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Search className="h-8 w-8" />
          Search Preference Test
        </h1>
        <p className="text-muted-foreground">
          Test the search preference UI components and functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Search Preferences
          </CardTitle>
          <p className="text-muted-foreground">
            Configure your search preferences for finding the perfect place
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full rounded-md border p-4">
            {/* Property Types Section */}
            <div className="space-y-4 border-b-2 pb-3">
              <h3 className="text-[18px] font-medium text-[#404040]">Property Types</h3>
              <div className="flex flex-wrap xxs:flex-nowrap justify-between gap-x-2 sm:gap-4">
                {propertyTypeOptions.map(({ value, label, icon }) => {
                  const isSelected = filters.propertyTypes.includes(value);
                  return (
                    <Paddle
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[231.361px] w-[153.441px] cursor-pointer box-border hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px]'
                        : 'border-[#2D2F2E40] border-[2px]'
                        }`}
                      labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                      onClick={() => {
                        const updatedPropertyTypes = isSelected
                          ? filters.propertyTypes.filter(type => type !== value)
                          : [...filters.propertyTypes, value];
                        handleFilterChange('propertyTypes', updatedPropertyTypes);
                      }}
                    />
                  );
                })}
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
                    icon: <AmenitiesIcons.UpdatedFurnishedIcon className="w-full h-full" />
                  },
                  {
                    value: 'unfurnished',
                    label: 'Unfurnished',
                    icon: <AmenitiesIcons.UpdatedUnfurnishedIcon className="w-full h-full" />
                  }
                ].map(({ value, label, icon }) => {
                  const isSelected = value === 'furnished' ? filters.furnished : filters.unfurnished;
                  return (
                    <Paddle
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[231.361px] w-[153.441px] cursor-pointer box-border hover:bg-gray-100 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px]'
                        : 'border-[#2D2F2E40] border-[2px]'
                        }`}
                      labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
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
                    icon: <AmenitiesIcons.UpdatedUtilitiesIncludedIcon className="w-full h-full" />
                  },
                  {
                    value: 'utilitiesNotIncluded',
                    label: 'Utilities Not Included',
                    icon: <AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon className="w-full h-full" />
                  }
                ].map(({ value, label, icon }) => {
                  const isSelected = filters.utilities.includes(value);
                  return (
                    <Paddle
                      key={value}
                      icon={icon}
                      label={label}
                      className={`h-[231.361px] w-[153.441px] cursor-pointer box-border hover:bg-gray-100 transition-[background-color] duration-200 ${isSelected
                        ? 'border-[#2D2F2E] border-[3px]'
                        : 'border-[#2D2F2E40] border-[2px]'
                        }`}
                      labelClassNames={`text-[14px] font-normal leading-tight ${isSelected ? 'text-[#2D2F2E80]' : 'text-[#2D2F2E80]'
                        }`}
                      iconClassNames="w-[80px] h-[80px] flex items-center justify-center"
                      onClick={() => {
                        const updatedUtilities = isSelected
                          ? filters.utilities.filter(item => item !== value)
                          : [...filters.utilities, value];
                        handleFilterChange('utilities', updatedUtilities);
                      }}
                    />
                  );
                })}
              </div>
            </div>

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

            {/* Submit button */}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSavePreferences}
                className="py-2 rounded-full text-[14px] px-4"
              >
                Save Preferences
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Current Filters Display */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Filter State</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(filters, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}