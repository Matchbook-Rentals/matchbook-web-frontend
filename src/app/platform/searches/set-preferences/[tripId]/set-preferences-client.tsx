'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Paddle from '@/components/ui/paddle';
import CurrencyInput from '@/components/ui/currency-input';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

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

interface PreferencesData {
  minPrice: number | null;
  maxPrice: number | null;
  furnished: boolean;
  unfurnished: boolean;
  utilitiesIncluded: boolean;
  singleFamily: boolean;
  apartment: boolean;
  privateRoom: boolean;
  townhouse: boolean;
  minBedrooms: number | null;
  minBathrooms: number | null;
}

interface SetPreferencesClientProps {
  tripId: string;
  updatePreferences: (data: PreferencesData) => Promise<{ success: boolean; tripId: string }>;
}

export default function SetPreferencesClient({ tripId, updatePreferences }: SetPreferencesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transform filters into an object compatible with the updateTripFilters action
      const preferencesData = {
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        furnished: filters.furnished,
        unfurnished: filters.unfurnished,
        utilitiesIncluded: filters.utilities.includes('utilitiesIncluded'),
        singleFamily: filters.propertyTypes.includes('singleFamily'),
        apartment: filters.propertyTypes.includes('apartment'),
        privateRoom: filters.propertyTypes.includes('privateRoom'),
        townhouse: filters.propertyTypes.includes('townhouse'),
        minBedrooms: filters.minBedrooms,
        minBathrooms: filters.minBathrooms,
      };
      
      // Call the server action to update preferences
      const result = await updatePreferences(preferencesData);
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Preferences saved!",
          description: "Redirecting you to properties that match your preferences..."
        });
        
        // Redirect to the trip page
        setTimeout(() => {
          router.push(`/platform/trips/${tripId}?tab=recommended`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Failed to save preferences",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-[700px]">
      <h1 className="text-2xl font-bold mb-6">Tell us more about what you're looking for in a place</h1>

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
                      ? filters.utilities.filter(item => item !== value) // Remove if selected
                      : [...filters.utilities, value]; // Add if not selected
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
            className="py-2 rounded-full text-[14px] px-4"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}