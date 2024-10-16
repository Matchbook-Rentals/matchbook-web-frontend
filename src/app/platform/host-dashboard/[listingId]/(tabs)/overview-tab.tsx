import React from "react";
import CardWithHeader from "@/components/ui/card-with-header";

export default function OverviewTab() {
  return (
    <div className="flex py-2 ">
      <div className="flex flex-col  border-red-500 gap-y-4 w-full">
        <CardWithHeader
          className="w-full"
          title="Payments"
          content={<div>Payment content goes here.</div>}
        />
        <CardWithHeader
          className="w-full"
          title="Leases"
          content={<div>Lease content goes here.</div>}
        />
      </div>
      <div className="flex flex-col border-6 border-red-500 gap-y-4 w-full">
        <CardWithHeader
          className="w-full"
          title="Upcoming Bookings"
          content={<div>Bookings content goes here.</div>}
        />
      </div>
    </div>
  );
}
