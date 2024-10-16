"use client";
import React, { useContext, useState } from "react";
import { Listing, Trip } from "@prisma/client";
import ListingBar from "../listing-bar";
import TripContextProvider, {
  TripContext,
} from "@/contexts/trip-context-provider";
import Link from "next/link";

export default function RankView({ updateFavoriteRank }) {
  const { trip, getUpdatedTrip, listings } = useContext(TripContext);

  // State to track the order of the listings based on their favorite ranking
  const [orderedListings, setOrderedListings] = useState(
    [...trip.favorites]
      .sort((a, b) => a.rank - b.rank)
      .map((favorite) =>
        listings.find((listing) => listing.id === favorite.listingId),
      )
      .filter((listing) => listing !== undefined),
  );
  console.log("TRIP", trip);
  console.log("Ordered", orderedListings);

  const handleDragStart = (idx) => (event) => {
    event.dataTransfer.setData("text/plain", idx);
  };

  const handleDrop = (idx: number) => async (event) => {
    event.preventDefault();
    const draggedIdx = event.dataTransfer.getData("text/plain");
    const newListings = [...orderedListings];
    const [reorderedItem] = newListings.splice(draggedIdx, 1);
    newListings.splice(idx, 0, reorderedItem);
    updateFavoriteRank(newListings, trip.id);
    getUpdatedTrip();
    setOrderedListings(newListings);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <div className="flex justify-start">
        <div className="flex flex-col gap-4 pl-5 pr-20 w-full">
          {orderedListings.length > 0 ? (
            orderedListings.map((listing, idx) => (
              <div
                key={listing.id}
                draggable="true"
                onDragStart={handleDragStart(idx)}
                onDrop={handleDrop(idx, listing.id, trip.id)}
                onDragOver={handleDragOver}
                className="draggable-listing"
              >
                <ListingBar listing={listing} trip={trip} idx={idx} />
              </div>
            ))
          ) : (
            <p className="text-lg text-gray-600">
              You haven&apos;t liked any properties for this trip yet. Check out
              more properties in
              <Link href={`/platform/trips/${trip.id}/search`}>
                <a className="font-semibold"> New possibilities </a>
              </Link>
              to find some you like!
            </p>
          )}
        </div>
      </div>
    </>
  );
}
