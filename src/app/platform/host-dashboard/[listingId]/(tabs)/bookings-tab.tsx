import React from "react";
import CardWithHeader from "@/components/ui/card-with-header";
import 'react-calendar/dist/Calendar.css';
import DisplayCalendar from "@/components/ui/custom-calendar/display-only-calendar";

export default function BookingsTab() {
  const currentDate = new Date();
  const endDate = new Date();
  endDate.setDate(currentDate.getDate() + 30);

  const previousMonthStartDate = new Date();
  previousMonthStartDate.setMonth(currentDate.getMonth() - 1);
  previousMonthStartDate.setDate(1);

  const previousMonthEndDate = new Date(previousMonthStartDate);
  previousMonthEndDate.setMonth(previousMonthStartDate.getMonth() + 1);
  previousMonthEndDate.setDate(0);

  const thirdBookingStartDate = new Date(endDate);
  thirdBookingStartDate.setDate(endDate.getDate() + 2);
  const thirdBookingEndDate = new Date(thirdBookingStartDate);
  thirdBookingEndDate.setDate(thirdBookingStartDate.getDate() + 7);

  const sampleBookings = [
    {
      id: "1",
      userId: "user123",
      listingId: "listing123",
      startDate: currentDate,
      endDate: endDate,
      totalPrice: 500,
      createdAt: new Date("2023-09-01T00:00:00Z"),
      status: 'active',
      user: {
        id: "user123",
        name: "John Doe"
      },
      listing: {
        id: "listing123",
        title: "Sample Listing"
      }
    },
    {
      id: "2",
      userId: "user456",
      listingId: "listing456",
      startDate: previousMonthStartDate,
      endDate: previousMonthEndDate,
      totalPrice: 300,
      createdAt: new Date("2023-08-01T00:00:00Z"),
      status: "finished",
      user: {
        id: "user456",
        name: "Jane Smith"
      },
      listing: {
        id: "listing456",
        title: "Another Sample Listing"
      }
    },
    {
      id: "3",
      userId: "user789",
      listingId: "listing789",
      startDate: thirdBookingStartDate,
      endDate: thirdBookingEndDate,
      totalPrice: 400,
      createdAt: new Date(),
      status: "reserved",
      user: {
        id: "user789",
        name: "Alice Johnson"
      },
      listing: {
        id: "listing789",
        title: "Third Sample Listing"
      }
    }
  ];

  return (
    <div className="flex py-2 ">
      <div className="flex flex-col  border-red-500 gap-y-4 w-full">
        <CardWithHeader className="w-full" title="Bookings" content={<div>Payment content goes here.</div>} />
      </div>
      <div className="flex flex-col border-6 border-red-500 gap-y-4 w-full">
        <DisplayCalendar bookings={sampleBookings} />
      </div>
    </div>
  );
}