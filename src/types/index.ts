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

export type Listing = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  createdAt: Date;
  category?: string | null;
  roomCount: number;
  bathroomCount: number;
  guestCount?: number | null;
  latLng: string;
  locationString: string;
  city: string;
  state: string;
  streetAddress1: string;
  streetAddress2?: string | null;
  postalCode?: string | null;
  userId: string;
  price: number;
  wifi: boolean;
  airConditioning: boolean;
  heating: boolean;
  kitchen: boolean;
  washer: boolean;
  dryer: boolean;
  parking: boolean;
  pool: boolean;
  hotTub: boolean;
  gym: boolean;
  elevator: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  eventsAllowed: boolean;
  privateEntrance: boolean;
  secure: boolean;
  fireplace: boolean;
  waterfront: boolean;
  beachfront: boolean;
  mountainView: boolean;
  user: User; // Placeholder for actual User type
  reservations: Reservation[]; // Placeholder for actual Reservation type array
  housingRequests: HousingRequest[]; // Placeholder for actual HousingRequest type array
  Trip?: Trip | null; // Placeholder for actual Trip type, optional
  tripId?: string | null;
  images: ListingImage[]; // Placeholder for actual ListingImage type array
};
