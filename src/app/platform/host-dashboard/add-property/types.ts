// Property Details Interface
interface PropertyDetails {
  // Location information
  locationString?: string; // Full address as string
  latitude?: number;
  longitude?: number;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // Other property details can be added here as needed
  propertyType?: string;
  furnishingType?: string;
  utilitiesIncluded?: boolean;
  petsAllowed?: boolean;
  
  // Add more fields as needed
}

export type { PropertyDetails };