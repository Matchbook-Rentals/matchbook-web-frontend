"use client";
import { TripContext } from "@/contexts/trip-context-provider";
import React, { useContext } from "react";

export default function HeaderDisplay() {
  const { headerText, setHeaderText, trip } = useContext(TripContext);
  return (
    <>
      {headerText && (
        <h1 className="text-center text-3xl border-b w-1/2 mx-auto mb-2 pb-3">
          {headerText} {trip.locationString}
        </h1>
      )}
    </>
  );
}
