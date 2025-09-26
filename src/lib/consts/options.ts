import { FilterOptions } from '@/lib/listing-filters';

// Legacy interface for backward compatibility
export interface LegacyFilterOptions {
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
  moveInDate: Date;
  moveOutDate: Date;
  flexibleMoveIn: boolean;
  flexibleMoveOut: boolean;
  flexibleMoveInStart: Date;
  flexibleMoveInEnd: Date;
  flexibleMoveOutStart: Date;
  flexibleMoveOutEnd: Date;
  propertyTypes: string[];
  utilities: string[];
}

// Complete default filter options matching the FilterOptions interface
export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  propertyTypes: [],
  minPrice: null,
  maxPrice: null,
  minBedrooms: 0,
  minBeds: null,
  minBathrooms: 0,
  furnished: false,
  unfurnished: false,
  utilities: [],
  pets: [],
  searchRadius: 100,
  accessibility: [],
  location: [],
  parking: [],
  kitchen: [],
  basics: [],
  luxury: [],
  laundry: [],
};