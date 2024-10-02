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
} from "@prisma/client";

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
