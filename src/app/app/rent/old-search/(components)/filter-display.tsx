'use client';

import { X } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTripContext } from '@/contexts/trip-context-provider';
import { CategoryType, getFiltersByCategory } from '@/constants/filters';

interface FilterDisplayProps {
  onOpenFilter: () => void;
}

export const FilterDisplay: React.FC<FilterDisplayProps> = ({ onOpenFilter }) => {
  const { state: { filters, listings, showListings }, actions: { updateFilters } } = useTripContext();
  
  // Helper function to get filter label
  const getFilterLabel = (filterKey: string, value: any): string => {
    // Property types
    if (filterKey === 'propertyTypes' && Array.isArray(value)) {
      const typeLabels: Record<string, string> = {
        singleFamily: 'Single Family',
        apartment: 'Apartment',
        privateRoom: 'Private Room',
        townhouse: 'Townhouse',
      };
      return value.map(type => typeLabels[type] || type).join(', ');
    }
    
    // Price range
    if (filterKey === 'minPrice' && filters.maxPrice) {
      return `$${filters.minPrice} - $${filters.maxPrice}`;
    }
    if (filterKey === 'minPrice') return `Min $${value}`;
    if (filterKey === 'maxPrice' && !filters.minPrice) return `Max $${value}`;
    
    // Rooms
    if (filterKey === 'minBedrooms') return `${value}+ Bedrooms`;
    if (filterKey === 'minBathrooms') return `${value}+ Bathrooms`;
    if (filterKey === 'minBeds') return `${value}+ Beds`;
    
    // Furnished
    if (filterKey === 'furnished' && value) return 'Furnished';
    if (filterKey === 'unfurnished' && value) return 'Unfurnished';
    
    // Utilities
    if (filterKey === 'utilities' && Array.isArray(value)) {
      if (value.includes('utilitiesIncluded') && value.includes('utilitiesNotIncluded')) return null;
      if (value.includes('utilitiesIncluded')) return 'Utilities Included';
      if (value.includes('utilitiesNotIncluded')) return 'Utilities Not Included';
    }
    
    // Pets
    if (filterKey === 'pets' && Array.isArray(value)) {
      if (value.includes('petsAllowed') && value.includes('petsNotAllowed')) return null;
      if (value.includes('petsAllowed')) return 'Pets Allowed';
      if (value.includes('petsNotAllowed')) return 'Pets Not Allowed';
    }
    
    // Search radius
    if (filterKey === 'searchRadius' && value > 0) return `Within ${value} miles`;
    
    // Amenity arrays
    const amenityLabels: Record<string, string> = {
      wheelchairAccess: 'Wheelchair Accessible',
      fencedInYard: 'Fenced Yard',
      keylessEntry: 'Keyless Entry',
      alarmSystem: 'Alarm System',
      gatedEntry: 'Gated Entry',
      balcony: 'Balcony',
      patio: 'Patio',
      dishwasher: 'Dishwasher',
      refrigerator: 'Refrigerator',
      stove: 'Stove',
      microwave: 'Microwave',
      garbageDisposal: 'Garbage Disposal',
      heater: 'Heater',
      centralHeating: 'Central Heating',
      airConditioning: 'Air Conditioning',
      centralAir: 'Central Air',
      hardwoodFloor: 'Hardwood Floor',
      carpet: 'Carpet',
      fireplace: 'Fireplace',
      ceilingFan: 'Ceiling Fan',
      walkInCloset: 'Walk-in Closet',
      gym: 'Gym',
      pool: 'Pool',
      hotTub: 'Hot Tub',
      inUnit: 'In-Unit Laundry',
      inComplex: 'Laundry in Complex',
      notAvailable: 'No Laundry',
      garage: 'Garage',
      coveredParking: 'Covered Parking',
      offStreetParking: 'Off-Street Parking',
      onStreetParking: 'On-Street Parking',
    };
    
    if (Array.isArray(value) && value.length > 0) {
      return value.map(item => amenityLabels[item] || item).join(', ');
    }
    
    return null;
  };
  
  // Collect all active filters
  const activeFilters: { key: string; label: string; value: any }[] = [];
  
  // Check all filter categories
  Object.entries(filters).forEach(([key, value]) => {
    // Skip if maxPrice is handled with minPrice
    if (key === 'maxPrice' && filters.minPrice) return;
    
    // Skip empty arrays or false booleans
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'boolean' && !value) return;
    if (value === null || value === 0) return;
    
    const label = getFilterLabel(key, value);
    if (label) {
      activeFilters.push({ key, label, value });
    }
  });
  
  // Function to remove a specific filter
  const removeFilter = (filterKey: string, filterValue?: any) => {
    const newFilters = { ...filters };
    
    if (filterKey === 'minPrice' || filterKey === 'maxPrice') {
      newFilters.minPrice = null;
      newFilters.maxPrice = null;
    } else if (filterKey === 'furnished' || filterKey === 'unfurnished') {
      newFilters.furnished = false;
      newFilters.unfurnished = false;
    } else if (Array.isArray(newFilters[filterKey as keyof typeof filters])) {
      newFilters[filterKey as keyof typeof filters] = [] as any;
    } else if (typeof newFilters[filterKey as keyof typeof filters] === 'boolean') {
      (newFilters[filterKey as keyof typeof filters] as any) = false;
    } else if (typeof newFilters[filterKey as keyof typeof filters] === 'number') {
      (newFilters[filterKey as keyof typeof filters] as any) = 0;
    }
    
    updateFilters(newFilters);
  };
  
  // Function to clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
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
      searchRadius: 0,
      accessibility: [],
      location: [],
      parking: [],
      kitchen: [],
      basics: [],
      luxury: [],
      laundry: [],
    };
    updateFilters(clearedFilters);
  };
  
  const totalResults = showListings?.length || 0;
  const totalListings = listings?.length || 0;
  const numFiltered = totalListings - totalResults;
  
  // Don't show the filter display if no filters are active
  if (activeFilters.length === 0) {
    return (
      <div className="flex w-full items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {totalResults.toLocaleString()} Results
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilter}
          className="h-9 gap-2.5 px-3"
        >
          <span>Filters</span>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 5.83333H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-3 mb-4">
      {/* Results and filter button row */}
      <div className="flex w-full items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalResults.toLocaleString()} Results
          {numFiltered > 0 && (
            <span className="text-gray-500"> ({numFiltered} filtered out)</span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFilter}
          className="h-9 gap-2.5 px-3"
        >
          <span>Filters</span>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 5.83333H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Button>
      </div>
      
      {/* Filter tags row */}
      <Card className="flex w-full items-center justify-between p-3 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.key}-${index}`}
              variant="outline"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-300 hover:bg-gray-100 cursor-pointer"
              onClick={() => removeFilter(filter.key, filter.value)}
            >
              <span className="font-medium text-gray-700 text-sm">
                {filter.label}
              </span>
              <X className="w-4 h-4 text-gray-500" />
            </Badge>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-[#3c8787] font-semibold hover:text-[#2d6969] underline"
        >
          Clear Filters
        </Button>
      </Card>
    </div>
  );
};