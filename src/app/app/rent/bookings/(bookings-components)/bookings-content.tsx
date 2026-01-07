'use client';

import React from 'react';
import { Booking } from '@prisma/client';
import { BookingsResultsSection } from './BookingsResultsSection';
import { BookingsContainerSection } from './BookingsContainerSection';

interface BookingsContentProps {
  bookings: Booking[];
  hasListings: boolean;
}

const BookingsContent: React.FC<BookingsContentProps> = ({ bookings, hasListings }) => {
  return (
    <main className="flex flex-col mx-auto max-w-[1280px] items-start gap-6 px-6 py-8 relative min-h-screen">
      <div className="flex flex-col items-start gap-6 relative w-full">
        <BookingsResultsSection />
        <BookingsContainerSection bookings={bookings} hasListings={hasListings} />
      </div>
    </main>
  );
};

export default BookingsContent;
