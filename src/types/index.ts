import { HousingRequest, Dislike, ListingImage, Match, Favorite, Trip, User, Listing, Bedroom } from "@prisma/client";

export interface TripAndMatches extends Trip {
  favorites: Favorite[]
  matches: Match[]
  housingRequests: HousingRequest[]
  dislikes: Dislike[]
};

export interface ListingAndImages extends Listing {
  listingImages: ListingImage[]
  bedrooms?: Bedroom[]
};

export interface RequestWithUser extends HousingRequest {
  user: User
}
