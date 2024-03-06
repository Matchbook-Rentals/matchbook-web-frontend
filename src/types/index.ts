export type Trip = {
  id: string;
  locationString: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  locationLatLng: string | null; // Assuming string, adjust if it's a more complex type
  createdAt: Date | string; // Date object or ISO string representation
  startDate: Date | string | null;
  endDate: Date | string | null;
  maxPrice: number | null;
  minBedroom: number | null;
  minBathroom: number | null;
  isSponsored: boolean;
  numAdults: number;
  numPets: number;
  numChildren: number;
  sponsorID: string | null;
  userId: string;
  tripStatus: string;
};
