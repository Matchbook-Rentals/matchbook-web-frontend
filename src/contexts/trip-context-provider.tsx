"use client";

import React from "react";
import { ListingAndImages, TripAndMatches } from "@/types";
import { createContext, useState } from "react";
import { Dispatch, SetStateAction } from 'react';

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
  const favoriteListingIds = new Set(trip.favorites.map(favorite => favorite.listingId));
  const requestedIds = new Set(trip.housingRequests.map(request => request.listingId));
  const rankMap = new Map(trip.favorites.map(favorite => [favorite.listingId, favorite.rank]));

  const getRank = (listingId: string) => rankMap.get(listingId) ?? Infinity;

  const [listings, setListings] = useState({
    allListings: listingData,
    favIds: favoriteListingIds,
    reqIds: requestedIds,
    showListings: listingData
      .filter((listing) => favoriteListingIds.has(listing.id)),
    likedListings: listingData
      .filter((listing) => !favoriteListingIds.has(listing.id))
      .sort((a, b) => getRank(a.id) - getRank(b.id)),
  });


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
