"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";

export const BookingsResultsSection = (): JSX.Element => {
  const { user } = useUser();

  return (
    <div className="flex items-end gap-4 relative w-full">
      <div className="flex items-end gap-6 relative flex-1">
        <div className="flex flex-col items-start gap-2 relative flex-1">
          <div className="relative font-medium text-gray-900 text-2xl leading-tight">
            Your Bookings
          </div>
          <div className="relative font-normal text-gray-500 text-base leading-6">
            Hello {user?.firstName || 'there'}, here are your bookings
          </div>
        </div>
      </div>
    </div>
  );
};