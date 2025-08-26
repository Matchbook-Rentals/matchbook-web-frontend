import React, { useState } from "react";
import { Trip } from "@prisma/client";
import { SearchCard } from "./SearchCard";
import { deleteTrip } from "@/app/actions/trips";

interface SearchContainerSectionProps {
  trips: Trip[];
}

export const SearchContainerSection = ({ trips }: SearchContainerSectionProps): JSX.Element => {
  const [localTrips, setLocalTrips] = useState(trips);
  
  // Mock data if no trips are available
  const searchData = localTrips.length > 0 ? localTrips : [
    {
      id: "1",
      locationString: "Ogden, UT", 
      startDate: new Date("2024-08-03"),
      endDate: new Date("2024-09-08"),
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      minPrice: null,
      maxPrice: null,
    } as Trip,
    {
      id: "2", 
      locationString: "Ogden, UT",
      startDate: new Date("2024-08-03"),
      endDate: new Date("2024-09-08"), 
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      minPrice: null,
      maxPrice: null,
    } as Trip,
    {
      id: "3",
      locationString: "Ogden, UT",
      startDate: new Date("2024-08-03"), 
      endDate: new Date("2024-09-08"),
      numAdults: 1,
      numChildren: 0,
      numPets: 0,
      minPrice: null,
      maxPrice: null,
    } as Trip,
  ];

  const handleTripUpdate = (updatedTrip: Trip) => {
    setLocalTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      )
    );
  };

  const handleContinueSearch = (trip: Trip) => {
    console.log("Continue search for:", trip);
    // TODO: Implement continue search logic
  };

  const handleEdit = (trip: Trip) => {
    console.log("Edit search:", trip);
    // TODO: Implement edit search logic
  };

  const handleMenu = (trip: Trip) => {
    console.log("Menu for search:", trip);
    // TODO: Implement menu logic
  };

  const handleDelete = async (trip: Trip) => {
    console.log("Delete search:", trip);
    // Optimistically remove from UI
    setLocalTrips(prevTrips => 
      prevTrips.filter(t => t.id !== trip.id)
    );
    
    try {
      const result = await deleteTrip(trip.id);
      if (!result.success) {
        console.error('Failed to delete trip:', result.message);
        // Restore the trip if deletion failed
        setLocalTrips(prevTrips => [...prevTrips, trip]);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      // Restore the trip if deletion failed
      setLocalTrips(prevTrips => [...prevTrips, trip]);
      // TODO: Show error message to user
    }
  };

  return (
    <section className="flex flex-col items-start gap-6 w-full">
      {searchData.map((trip, index) => (
        <SearchCard
          key={trip.id || index}
          trip={trip}
          onContinueSearch={handleContinueSearch}
          onEdit={handleEdit}
          onMenu={handleMenu}
          onTripUpdate={handleTripUpdate}
          onDelete={handleDelete}
        />
      ))}
    </section>
  );
};