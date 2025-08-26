import { notFound } from 'next/navigation'
import { getBookingDetails } from '../../_actions'
import BookingEditForm from './booking-edit-form'

interface BookingEditPageProps {
  params: {
    bookingId: string;
  };
}

export default async function BookingEditPage({ params }: BookingEditPageProps) {
  const booking = await getBookingDetails(params.bookingId);

  if (!booking) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <BookingEditForm booking={booking} />
    </div>
  );
}