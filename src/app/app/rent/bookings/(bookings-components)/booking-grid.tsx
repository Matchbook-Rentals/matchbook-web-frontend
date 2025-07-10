'use client';

import React, { useState } from 'react';
import BookingCard from './booking-card';
import { Booking } from '@prisma/client';
import { deleteBooking } from '@/app/actions/bookings';
import { useToast } from '@/components/ui/use-toast';

interface BookingGridProps {
  initialBookings: Booking[];
}

const BookingGrid: React.FC<BookingGridProps> = ({ initialBookings }) => {
  const [bookings, setBookings] = useState(initialBookings);
  const [deletingBookings, setDeletingBookings] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const handleDelete = async (bookingId: string) => {
    try {
      // Track that this booking is being deleted
      setDeletingBookings(prev => new Set(prev).add(bookingId));

      // Optimistic update
      const bookingToDelete = bookings.find(b => b.id === bookingId);
      setBookings(bookings.filter(booking => booking.id !== bookingId));

      // Use server action
      await deleteBooking(bookingId);

      // Success! Show toast and clean up
      toast({
        title: `Booking deleted`,
        variant: "warning",
      });
      setDeletingBookings(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    } catch (error) {
      // Show error toast
      toast({
        title: 'Failed to delete booking',
        variant: "destructive",
      });
      // Restore only this specific booking if deletion failed
      setBookings(prev => {
        const bookingToRestore = initialBookings.find(b => b.id === bookingId);
        return bookingToRestore ? [...prev, bookingToRestore] : prev;
      });
      setDeletingBookings(prev => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  return (
    <div>
      <div className="grid mx-auto grid-cols-1 justify-between gap-y-6 max-w-[2000px]">
        {bookings.map((booking) => (
          <div key={booking.id}>
            <BookingCard
              booking={booking}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingGrid;