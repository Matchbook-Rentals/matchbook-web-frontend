"use client";

import React from "react";
import { ListingAndImages, TripAndMatches } from "@/types";
import { Listing, Trip, Favorite } from "@prisma/client"; // Assuming Trip is a model in your Prisma schema
import { createContext, useState } from "react";
import { Dispatch, SetStateAction } from 'react';
//import { TTripContext } from "@/types";

type TripContextProviderProps = {
  tripData: TripAndMatches;
  pullTripFromDb: Function;
  createDbFavorite: Function;
  listingData: ListingAndImages[];
  children: React.ReactNode;
};

// convert this to an interace
type TTripContext = {
  trip: TripAndMatches;
  setTrip: Dispatch<SetStateAction<TripAndMatches>>;
  getUpdatedTrip: Function;
  createDbFavorite: Function;
  listings: ListingAndImages[];
  //showListings: ListingAndImages[];
  setListings: Dispatch<SetStateAction<ListingAndImages[]>>;
  favoriteListingIds: Set<string | null>;
};

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({ tripData, listingData, pullTripFromDb, createDbFavorite, children }: TripContextProviderProps) {
  const [trip, setTrip] = useState(tripData);
  const [listings, setListings] = useState(listingData);
  const favoriteListingIds = new Set(trip.favorites.map(favorite => favorite.listingId));

  // Event handlers / actions
  const getUpdatedTrip = async () => {
    const tempTrip = await pullTripFromDb(trip.id);
    setTrip(tempTrip)
  }

  return (
    <TripContext.Provider
      value={{
        trip,
        setTrip,
        listings,
        setListings,
        favoriteListingIds,
        getUpdatedTrip,
        createDbFavorite,

      }}
    >
      {children}
    </TripContext.Provider>
  );
}
