import React from 'react';
import { getUserBookings } from '@/app/actions/bookings';
import BookingsContent from './(bookings-components)/bookings-content';

const BookingsPage: React.FC = async () => {
  const bookings = await getUserBookings();

  return <BookingsContent bookings={bookings} />;
};

export default BookingsPage;