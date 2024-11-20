export interface FilterOptions {
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

// You might want to add default values or other filter-related constants here
export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  minPrice: 0,
  maxPrice: 10000,
  bedrooms: 'Any',
  beds: 'Any',
  baths: 'Any',
  furnished: false,
  unfurnished: false,
  moveInDate: new Date(),
  moveOutDate: new Date(),
  flexibleMoveIn: false,
  flexibleMoveOut: false,
  flexibleMoveInStart: new Date(),
  flexibleMoveInEnd: new Date(),
  flexibleMoveOutStart: new Date(),
  flexibleMoveOutEnd: new Date(),
  propertyTypes: [],
  utilities: [],
};