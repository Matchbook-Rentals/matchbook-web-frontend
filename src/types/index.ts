
export type Trip = {
  id: string;
  locationString: string;
  numAdults?: number;
  numPets?: number;
  numChilren?: number;
  city?: string; // Optional field
  state?: string; // Optional field
  postalCode?: string; // Optional field
  locationLatLng?: string; // Optional field
  createdAt?: Date; // or string if you're using ISO strings
  startDate?: Date; // or string
  endDate?: Date; // or string
  maxPrice?: number;
  minBedroom?: number;
  minBathroom?: number;
  isSponsored?: boolean;
  sponsorID?: string;
  userId: string;
};