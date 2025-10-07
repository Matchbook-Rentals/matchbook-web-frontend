"use client";

import React, { useState } from "react";
import { Booking } from "@prisma/client";
import BookingCard from "./booking-card";
import { deleteBooking } from "@/app/actions/bookings";
import { useToast } from "@/components/ui/use-toast";
import { BrandButton } from "@/components/ui/brandButton";

interface BookingsContainerSectionProps {
  bookings: Booking[];
  hasListings: boolean;
}

export const BookingsContainerSection = ({ bookings, hasListings }: BookingsContainerSectionProps): JSX.Element => {
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
      <section className="flex flex-col items-center gap-8 justify-center py-12 text-gray-500 w-full">
        <img
          src="/host-dashboard/empty/applications.png"
          alt="No bookings"
          className="w-full h-auto max-w-[260px] mb-0"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg font-medium text-center">
            You currently don&apos;t have any bookings.
          </div>
          {hasListings && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-gray-600">Looking for your Host bookings?</p>
              <BrandButton href="/app/host/dashboard">View Host Bookings</BrandButton>
            </div>
          )}
        </div>
      </section>
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