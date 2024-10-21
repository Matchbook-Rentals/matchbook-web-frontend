import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import Link from 'next/link';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips();

  return (
    <div className='bg-backround'>
      <h1>YOUR TRIPS</h1>
      {trips.map((trip) => (
        <Link
          href={`/platform/trips/${trip.id}`}
          key={trip.id}
          className="trip-item border rounded-full text-center my-2 mx-auto w-1/5
                     cursor-pointer"
        >
          <p>{trip.locationString}</p>
          <p> {trip.startDate?.toDateString()} - {trip.endDate?.toDateString()} </p>
          <p>{trip.favorites.length}</p>
        </Link>
      ))}
    </div>
  );
};

export default TripsPage;
