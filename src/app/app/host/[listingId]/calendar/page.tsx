import { getListingById } from '@/app/actions/listings';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { CalendarClient } from './calendar-client';

// Actual booking structure from Prisma schema
interface Booking {
  id: string;
  userId: string;
  listingId: string;
  tripId?: string;
  matchId: string;
  startDate: Date;
  endDate: Date;
  totalPrice?: number;
  monthlyRent?: number;
  createdAt: Date;
  status: string;
  moveInCompletedAt?: Date | null;
  // Optional related data
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}


interface CalendarPageProps {
  params: { listingId: string };
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { listingId } = params;
  
  const [listing, bookings] = await Promise.all([
    getListingById(listingId),
    getBookingsByListingId(listingId)
  ]);

  if (!listing) {
    notFound();
  }


  return (
    <div className={HOST_PAGE_STYLE}>
      <CalendarClient 
        listing={listing}
        bookings={bookings}
      />
    </div>
  );
}
