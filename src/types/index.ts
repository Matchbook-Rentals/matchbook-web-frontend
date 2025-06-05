//Imports
import {
  HousingRequest,
  Application,
  Dislike,
  ListingImage,
  Match,
  Favorite,
  Trip,
  User,
  Listing,
  Bedroom,
  VerificationImage,
  Income,
  Identification,
  ListingUnavailability,
  Booking,
  Lease,
  BoldSignLease,
  Maybe,
} from "@prisma/client";
export * from './websocket';

export interface TripAndMatches extends Trip {
  favorites: Favorite[];
  matches: Match[];
  housingRequests: HousingRequest[];
  dislikes: Dislike[];
}

export interface ListingAndImages extends Listing {
  listingImages: ListingImage[];
  bedrooms?: Bedroom[];
  distance?: number;
  user?: User;
  price?: number;
  calculatedPrice?: number;
  uScore?: number;
  unavailablePeriods?: ListingUnavailability[];
  bookings?: Booking[];
  availableStart?: Date;
  availableEnd?: Date;
  isActuallyAvailable?: boolean; // Helper flag from calculation
}

export interface RequestWithUser extends HousingRequest {
  user?: User;
  trip?: Trip;
}

export interface ApplicationWithArrays extends Application {
  verificationImages: VerificationImage[];
  incomes: Income[];
  identifications: Identification[];
}
export interface TripAndMatches extends Trip {
  favorites: Favorite[]
  matches: Match[]
  housingRequests: HousingRequest[]
  dislikes: Dislike[]
  maybes: Maybe[]
};

export interface ListingAndImages extends Listing {
  listingImages: ListingImage[]
  bedrooms?: Bedroom[]
  distance?: number
  user?: User
  price?: number
  calculatedPrice?: number
  uScore?: number
  unavailablePeriods?: ListingUnavailability[]
  bookings?: Booking[]
};

export interface RequestWithUser extends HousingRequest {
  user?: User
  trip?: Trip
}

export interface ApplicationWithArrays extends Application {
  verificationImages: VerificationImage[]
  incomes: Income[]
  identifications: Identification[]
}

export interface MatchWithRelations extends Match {
  Lease?: Lease
  BoldSignLease: BoldSignLease
  listing: Listing
  trip: Trip
}

export interface SuggestedLocation {
  description: string;
  lat: number | null;
  lng: number | null;
}

// Notification Email Types
export interface NotificationEmailData {
  companyName: string;
  headerText: string;
  contentTitle: string;
  contentText: string;
  buttonText: string;
  buttonUrl: string;
  companyAddress: string;
  companyCity: string;
  companyWebsite: string;
}

export interface SendNotificationEmailInput {
  to: string;
  subject: string;
  emailData: NotificationEmailData;
}

export type SendNotificationEmailResponse =
  | { success: true; emailId: string }
  | { success: false; error: string };
