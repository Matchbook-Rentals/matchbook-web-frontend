"use client";

import { Listing, Trip, Favorite } from "@prisma/client"; // Assuming Trip is a model in your Prisma schema
import { createContext, useState } from "react";
import { Dispatch, SetStateAction } from 'react';

type TripContextProviderProps = {
  tripData: Trip;
  pullTripFromDb: Function;
  createDbFavorite: Function;
  listingData: Listing[];
  children: React.ReactNode;
};

// Adjust Values to Provider Here
type TTripContext = {
  trip: Trip;
  setTrip: Dispatch<SetStateAction<Trip>>;
  getUpdatedTrip: Function;
  createDbFavorite: Function;
  headerText: string;
  setHeaderText: Dispatch<SetStateAction<string>>;
  listings: Listing[];
  setListings: Dispatch<SetStateAction<Listing[]>>;
};

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({ tripData, listingData, pullTripFromDb, createDbFavorite, children }: TripContextProviderProps) {
  const [trip, setTrip] = useState<Trip>(tripData);
  const [listings, setListings] = useState<Listing[]>(listingData);
  const [headerText, setHeaderText] = useState('');

  // Event handlers / actions

  const getUpdatedTrip = async () => {
    const tempTrip: Trip = await pullTripFromDb(trip.id);
    setTrip(tempTrip)
  }

  return (
    <TripContext.Provider
      value={{
        trip,
        setTrip,
        headerText,
        setHeaderText,
        listings,
        setListings,
        getUpdatedTrip,
        createDbFavorite,

      }}
    >
      {children}
    </TripContext.Provider>
  );
}
