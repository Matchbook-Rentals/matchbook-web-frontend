"use client";

import { Listing, Trip } from "@prisma/client"; // Assuming Trip is a model in your Prisma schema
import { createContext, useState } from "react";

type TripContextProviderProps = {
  tripData: Trip;
  listingData: Listing[];
  children: React.ReactNode;
};

// Adjust Values to Provider Here
type TTripContext = {
  trip: Trip,
  setTrip: Function,
  headerText: string,
  setHeaderText: Function,
  listings: Listing[],
  setListings: Function,
};

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({ tripData, listingData, children }: TripContextProviderProps) {
  const [trip, setTrip] = useState<Trip>(tripData);
  const [listings, setListings] = useState<Listing[]>(listingData);
  const [headerText, setHeaderText] = useState('');

  // Event handlers / actions

  return (
    <TripContext.Provider
      value={{
        trip,
        setTrip,
        headerText,
        setHeaderText,
        listings,
        setListings
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
