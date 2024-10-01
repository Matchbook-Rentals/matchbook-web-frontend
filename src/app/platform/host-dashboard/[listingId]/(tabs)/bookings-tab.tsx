import React from "react";
import CardWithHeader from "@/components/ui/card-with-header";
import DisplayCalendar from "@/components/ui/custom-calendar/display-only-calendar";
import { useHostProperties } from "@/contexts/host-properties-provider";
import { Button } from "@/components/ui/button";

export default function BookingsTab() {
  const { currListing } = useHostProperties();

  return (
    <div className="flex py-2 ">
      <div className="flex flex-col  border-red-500 gap-y-4 w-full">
        <CardWithHeader className="w-full" title="Bookings" content={<div>Payment content goes here.</div>} />
      </div>
      <div className="flex flex-col border-6 border-red-500 gap-y-4 w-full">
        <DisplayCalendar bookings={currListing?.bookings} unavailablePeriods={currListing?.unavailablePeriods} />
      </div>
    </div>
  );
}
