"use client";

import { Listing, Trip } from "@prisma/client"; // Assuming Trip is a model in your Prisma schema
import { createContext, useState } from "react";

type TripContextProviderProps = {
  tripData: Trip;
  pullTripFromDb: Function;
  listingData: Listing[];
  children: React.ReactNode;
};

// Adjust Values to Provider Here
type TTripContext = {
  trip: Trip;
  setTrip: Function;
  getUpdatedTrip: Function;
  headerText: string;
  setHeaderText: Function;
  listings: Listing[];
  setListings: Function;
};

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({
  tripData,
  listingData,
  pullTripFromDb,
  children,
}: TripContextProviderProps) {
  const [trip, setTrip] = useState<Trip>(tripData);
  const [listings, setListings] = useState<Listing[]>(listingData);
  const [headerText, setHeaderText] = useState("");

  // Event handlers / actions

  const getUpdatedTrip = async () => {
    const tempTrip: Trip = await pullTripFromDb(trip.id);
    setTrip(tempTrip);
  };

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
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
