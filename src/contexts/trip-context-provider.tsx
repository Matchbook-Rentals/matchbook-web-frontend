"use client";

import { Trip } from "@prisma/client"; // Assuming Trip is a model in your Prisma schema
import { createContext, useState } from "react";

type TripContextProviderProps = {
  data: Trip[];
  children: React.ReactNode;
};

type TripEssentials = Omit<Trip, 'id'>; // Assuming all Trip fields except 'id'

type TTripContext = {
  trips: Trip[];
  selectedTripId: Trip["id"] | null;
  selectedTrip: Trip | undefined;
  numberOfTrips: number;
  addTrip: (newTrip: TripEssentials) => void;
  editTrip: (tripId: Trip["id"], newTripData: TripEssentials) => void;
  deleteTrip: (tripId: Trip["id"]) => void;
  selectTrip: (tripId: Trip["id"]) => void;
};

export const TripContext = createContext<TTripContext | null>(null);

export default function TripContextProvider({ data, children }: TripContextProviderProps) {
  const [trips, setTrips] = useState<Trip[]>(data);
  const [selectedTripId, setSelectedTripId] = useState<Trip["id"] | null>(null);

  // Derived state
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);
  const numberOfTrips = trips.length;

  // Event handlers / actions
  const addTrip = (newTrip: TripEssentials) => {
    const id = Math.random().toString(); // Simple unique ID generator for example purposes
    setTrips([...trips, { ...newTrip, id }]);
  };

  const editTrip = (tripId: Trip["id"], newTripData: TripEssentials) => {
    setTrips(trips.map(trip => trip.id === tripId ? { ...trip, ...newTripData } : trip));
  };

  const deleteTrip = (tripId: Trip["id"]) => {
    setTrips(trips.filter(trip => trip.id !== tripId));
    if (selectedTripId === tripId) {
      setSelectedTripId(null); // Deselect if the deleted trip was selected
    }
  };

  const selectTrip = (tripId: Trip["id"]) => {
    setSelectedTripId(tripId);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        selectedTripId,
        selectedTrip,
        numberOfTrips,
        addTrip,
        editTrip,
        deleteTrip,
        selectTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}
