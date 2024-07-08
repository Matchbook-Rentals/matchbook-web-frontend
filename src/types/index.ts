import { HousingRequest, ListingImage, Match, Favorite, Trip, User, Listing } from "@prisma/client";

export interface TripAndMatches extends Trip {
  favorites: Favorite[]
  matches: Match[]
};

export interface ListingAndImages extends Listing {
  listingImages: ListingImage[]
};


