"use client";

import React, { useState } from "react";
import { Booking } from "@prisma/client";
import BookingCard from "./booking-card";
import { deleteBooking } from "@/app/actions/bookings";
import { useToast } from "@/components/ui/use-toast";

interface BookingsContainerSectionProps {
  bookings: Booking[];
}

export const BookingsContainerSection = ({ bookings }: BookingsContainerSectionProps): JSX.Element => {
  const [localBookings, setLocalBookings] = useState(bookings);
  const { toast } = useToast();

  const handleDelete = async (bookingId: string) => {
    // Optimistically remove from UI
    const bookingToDelete = localBookings.find(b => b.id === bookingId);
    setLocalBookings(prevBookings => 
      prevBookings.filter(booking => booking.id !== bookingId)
    );
    
    try {
      await deleteBooking(bookingId);
      
      toast({
        title: "Booking deleted",
        variant: "warning",
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      // Restore the booking if deletion failed
      if (bookingToDelete) {
        setLocalBookings(prevBookings => [...prevBookings, bookingToDelete]);
      }
      toast({
        title: "Failed to delete booking",
        variant: "destructive",
      });
    }
  };

  if (localBookings.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg bg-white w-full">
        <p className="text-lg text-gray-600">You currently don't have any bookings.</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-start gap-6 w-full">
      {localBookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onDelete={handleDelete}
        />
      ))}
    </section>
  );
};