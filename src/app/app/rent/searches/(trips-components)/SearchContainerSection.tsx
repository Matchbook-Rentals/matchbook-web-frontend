import React from "react";
import { Trip } from "@prisma/client";
import { SearchCard } from "./SearchCard";
import { deleteTrip } from "@/app/actions/trips";

interface SearchContainerSectionProps {
  trips: Trip[];
}

export const SearchContainerSection = ({ trips }: SearchContainerSectionProps): JSX.Element => {
  const handleTripUpdate = (updatedTrip: Trip) => {
    // This function is no longer needed since we don't manage local state
    // The parent component (TripsContent) should handle updates
    console.log("Trip update:", updatedTrip);
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

    try {
      const result = await deleteTrip(trip.id);
      if (!result.success) {
        console.error('Failed to delete trip:', result.message);
        // TODO: Show error message to user
      } else {
        // Refresh the page or notify parent to refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      // TODO: Show error message to user
    }
  };

  if (trips.length === 0) {
    return (
      <section className="flex flex-col items-center gap-8 justify-center py-12 text-gray-500 w-full">
        <img
          src="/host-dashboard/empty/applications.png"
          alt="No searches"
          className="w-full h-auto max-w-[260px] mb-0"
        />
        <div className="text-lg font-medium text-center">
          No searches yet. Start by creating your first search!
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-start gap-6 w-full">
      {trips.map((trip, index) => (
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