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
  BoldSignLease, // @deprecated - Use Match.tenantSignedAt and Match.landlordSignedAt instead
  Maybe,
  ListingMonthlyPricing,
} from "@prisma/client";
export * from './websocket';

export interface TripAndMatches extends Trip {
  favorites: Favorite[];
  matches: Match[];
  housingRequests: HousingRequest[];
  dislikes: Dislike[];
  maybes: Maybe[];
}

/** Listing with its DB relations and query-computed fields */
export interface ListingWithRelations extends Listing {
  listingImages: ListingImage[];
  bedrooms?: Bedroom[];
  user?: User;
  unavailablePeriods?: ListingUnavailability[];
  bookings?: Booking[];
  monthlyPricing?: ListingMonthlyPricing[];
  distance?: number;        // computed in SQL haversine query
  displayCategory?: string; // computed in action via getCategoryDisplay()
  averageRating?: number;   // computed from published reviews
  reviewCount?: number;     // count of published reviews
}

/** Listing enriched with client-side price calculations */
export interface SearchListing extends ListingWithRelations {
  calculatedPrice?: number;
  price?: number;
}

/** @deprecated Use ListingWithRelations or SearchListing */
export type ListingAndImages = SearchListing;

export interface RequestWithUser extends HousingRequest {
  user?: User;
  trip?: Trip;
}

export interface ApplicationWithArrays extends Application {
  verificationImages: VerificationImage[];
  incomes: Income[];
  identifications: Identification[];
}

export interface MatchWithRelations extends Match {
  Lease?: Lease
  BoldSignLease: BoldSignLease // @deprecated - Use Match.tenantSignedAt and Match.landlordSignedAt instead
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
  senderLine?: string;
  footerText?: string;
  tagLink?: {
    text: string;
    url: string;
  };
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
}

export interface SendNotificationEmailInput {
  to: string;
  subject: string;
  emailData: NotificationEmailData;
}

export type SendNotificationEmailResponse =
  | { success: true; emailId: string }
  | { success: false; error: string };

// User's existing relationships with a listing (bookings, matches, applications)
export interface UserListingRelationship {
  type: 'booking' | 'match' | 'application';
  id: string;
  tripId: string;
  startDate: string; // ISO string for server/client serialization
  endDate: string;
  status?: string;
}

export interface UserListingRelationships {
  bookings: UserListingRelationship[];
  matches: UserListingRelationship[];
  applications: UserListingRelationship[];
}
