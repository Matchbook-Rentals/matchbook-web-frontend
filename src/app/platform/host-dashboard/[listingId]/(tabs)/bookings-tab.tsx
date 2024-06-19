
import React from "react";
import CardWithHeader from "@/components/ui/card-with-header";
import 'react-calendar/dist/Calendar.css';
import DisplayCalendar from "@/components/ui/custom-calendar/display-only-calendar";

export default function BookingsTab() {
  return (
    <div className="flex py-2 ">
      <div className="flex flex-col  border-red-500 gap-y-4 w-full">
        <CardWithHeader className="w-full" title="Payments" content={<div>Payment content goes here.</div>} />
        <CardWithHeader className="w-full" title="Leases" content={<div>Lease content goes here.</div>} />
      </div>
      <div className="flex flex-col border-6 border-red-500 gap-y-4 w-full">
        {/* <Calendar
          className="w-full max-w-4xl"
          onChange={(e) => console.log(e)}
          value={new Date()}
        /> */}
        <DisplayCalendar />
      </div>
    </div>
  );
}