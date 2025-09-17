'use client';

import { X } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTripContext } from '@/contexts/trip-context-provider';
import { CategoryType, getFiltersByCategory } from '@/constants/filters';

interface FilterDisplayProps {
  className?: string;
  onOpenFilter?: () => void;
}

export const FilterDisplay: React.FC<FilterDisplayProps> = ({ className = "", onOpenFilter }) => {
  const { state: { filters, listings, showListings, likedListings }, actions: { updateFilters } } = useTripContext();
  
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
    
    // Search radius - >= 100 means unlimited
    if (filterKey === 'searchRadius' && value > 0 && value < 100) return `Within ${value} miles`;
    if (filterKey === 'searchRadius' && value >= 100) return null; // Don't show unlimited as a filter
    
    // For non-amenity arrays that should be grouped together
    if (Array.isArray(value) && value.length > 0) {
      return value.join(', ');
    }
    
    return null;
  };
  
  // Collect all active filters
  const activeFilters: { key: string; label: string; value: any; individualValue?: string }[] = [];
  
  // Check all filter categories
  Object.entries(filters).forEach(([key, value]) => {
    // Skip if maxPrice is handled with minPrice
    if (key === 'maxPrice' && filters.minPrice) return;
    
    // Skip empty arrays or false booleans
    if (Array.isArray(value) && value.length === 0) return;
    if (typeof value === 'boolean' && !value) return;
    if (value === null || value === 0) return;
    
    // Handle amenity arrays individually
    const amenityCategories = ['accessibility', 'location', 'parking', 'kitchen', 'basics', 'luxury', 'laundry', 'other'];
    if (amenityCategories.includes(key) && Array.isArray(value)) {
      const amenityLabels: Record<string, string> = {
        // Basics
        airConditioner: 'Air Conditioner',
        heater: 'Heater',
        wifi: 'WiFi',
        dedicatedWorkspace: 'Dedicated Workspace',
        
        // Accessibility and Safety
        wheelchairAccess: 'Wheelchair Access',
        security: 'Security',
        secureLobby: 'Secure Lobby',
        keylessEntry: 'Keyless Entry',
        alarmSystem: 'Alarm System',
        gatedEntry: 'Gated Entry',
        smokeDetector: 'Smoke Detector',
        carbonMonoxide: 'CO Detector',
        
        // Location
        waterfront: 'Waterfront',
        beachfront: 'Beachfront',
        mountainView: 'Mountain View',
        cityView: 'City View',
        waterView: 'Water View',
        
        // Parking
        parking: 'Parking',
        streetParking: 'Street Parking',
        streetParkingFree: 'Street Parking Free',
        coveredParking: 'Covered Parking',
        coveredParkingFree: 'Covered Parking Free',
        uncoveredParking: 'Uncovered Parking',
        uncoveredParkingFree: 'Uncovered Parking Free',
        garageParking: 'Garage Parking',
        garageParkingFree: 'Garage Parking Free',
        evCharging: 'EV Charging',
        
        // Kitchen
        kitchen: 'Kitchen',
        garbageDisposal: 'Garbage Disposal',
        dishwasher: 'Dishwasher',
        fridge: 'Refrigerator',
        oven: 'Oven',
        stove: 'Stove',
        kitchenEssentials: 'Kitchen Essentials',
        
        // Luxury
        fireplace: 'Fireplace',
        fitnessCenter: 'Fitness Center',
        gym: 'Gym',
        balcony: 'Balcony',
        patio: 'Patio',
        sunroom: 'Sunroom',
        firepit: 'Firepit',
        pool: 'Pool',
        sauna: 'Sauna',
        hotTub: 'Hot Tub',
        jacuzzi: 'Jacuzzi',
        grill: 'Grill',
        
        // Laundry
        laundryFacilities: 'Laundry Facilities',
        washerInUnit: 'Washer In Unit',
        washerHookup: 'Washer Hookup',
        washerNotAvailable: 'Washer Not Available',
        washerInComplex: 'Washer In Complex',
        dryerInUnit: 'Dryer In Unit',
        dryerHookup: 'Dryer Hookup',
        dryerNotAvailable: 'Dryer Not Available',
        dryerInComplex: 'Dryer In Complex',
        
        // Other
        elevator: 'Elevator',
        doorman: 'Doorman',
        hairDryer: 'Hair Dryer',
        iron: 'Iron',
        petsAllowed: 'Pets Allowed',
        smokingAllowed: 'Smoking Allowed',
        eventsAllowed: 'Events Allowed',
        privateEntrance: 'Private Entrance',
        storageShed: 'Storage Shed',
        tv: 'TV',
        workstation: 'Workstation',
        microwave: 'Microwave',
        linens: 'Linens',
        privateBathroom: 'Private Bathroom',
        fencedInYard: 'Fenced Yard',
      };
      
      value.forEach((item: string) => {
        const label = amenityLabels[item] || item;
        // Check if this exact filter already exists to prevent duplicates
        const exists = activeFilters.some(filter => 
          filter.key === key && filter.individualValue === item
        );
        if (!exists) {
          activeFilters.push({ key, label, value, individualValue: item });
        }
      });
      return;
    }
    
    const label = getFilterLabel(key, value);
    if (label) {
      activeFilters.push({ key, label, value });
    }
  });
  
  // Function to remove a specific filter
  const removeFilter = (filterKey: string, individualValue?: string) => {
    const newFilters = { ...filters };
    
    if (filterKey === 'minPrice' || filterKey === 'maxPrice') {
      newFilters.minPrice = null;
      newFilters.maxPrice = null;
    } else if (filterKey === 'furnished' || filterKey === 'unfurnished') {
      newFilters.furnished = false;
      newFilters.unfurnished = false;
    } else if (individualValue && Array.isArray(newFilters[filterKey as keyof typeof filters])) {
      // Remove individual amenity from array
      const currentArray = newFilters[filterKey as keyof typeof filters] as string[];
      newFilters[filterKey as keyof typeof filters] = currentArray.filter(item => item !== individualValue) as any;
    } else if (Array.isArray(newFilters[filterKey as keyof typeof filters])) {
      newFilters[filterKey as keyof typeof filters] = [] as any;
    } else if (typeof newFilters[filterKey as keyof typeof filters] === 'boolean') {
      (newFilters[filterKey as keyof typeof filters] as any) = false;
    } else if (typeof newFilters[filterKey as keyof typeof filters] === 'number') {
      // Special handling for searchRadius to use most inclusive value
      if (filterKey === 'searchRadius') {
        (newFilters[filterKey as keyof typeof filters] as any) = 100;
      } else {
        (newFilters[filterKey as keyof typeof filters] as any) = 0;
      }
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
      searchRadius: 100, // Set to most inclusive value (unlimited)
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
  
  // Calculate results including liked listings (since they're shown on the map)
  const likedListingsCount = likedListings?.length || 0;
  const showListingsCount = showListings?.length || 0;
  const totalResults = likedListingsCount + showListingsCount;
  const totalListings = listings?.length || 0;
  const numFiltered = totalListings - totalResults;
  

  // Show results with "No filters" badge when no filters are active
  if (activeFilters.length === 0) {
    return (
      <div className={`w-full space-y-3 mb-4 ${className}`}>
        {/* Results row */}
        <div className="flex w-full items-center justify-start">
          <div className="text-sm text-gray-600">
            {totalResults.toLocaleString()} Results
          </div>
        </div>

        {/* No filters card - styled like active filters */}
        <Card className="flex w-full items-center justify-between p-3 rounded-lg border border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="inline-flex items-center justify-center px-3 py-1.5 bg-gray-50 rounded-full border border-gray-300 hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
              onClick={onOpenFilter}
            >
              <span className="font-medium text-gray-700 text-sm">
                No Filters
              </span>
            </Badge>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`w-full space-y-3 mb-4 ${className}`}>
      {/* Results row */}
      <div className="flex w-full items-center justify-start">
        <div className="text-sm text-gray-600">
          {totalResults.toLocaleString()} Results
          {numFiltered > 0 && (
            <span className="text-gray-500"> ({numFiltered} filtered out)</span>
          )}
        </div>
      </div>
      
      {/* Filter tags row */}
      <Card className="flex w-full items-center justify-between p-3 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.key}-${index}`}
              variant="outline"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-300 hover:bg-gray-100 cursor-pointer"
              onClick={() => removeFilter(filter.key, filter.individualValue)}
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