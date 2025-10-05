import React from 'react';
import { getUserBookings } from '@/app/actions/bookings';
import { getHostListingsCount } from '@/app/actions/listings';
import BookingsContent from './(bookings-components)/bookings-content';

const BookingsPage: React.FC = async () => {
  const bookings = await getUserBookings();
  const listingsCount = await getHostListingsCount();

  return <BookingsContent bookings={bookings} hasListings={listingsCount > 0} />;
};

export default BookingsPage;