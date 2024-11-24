import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import Link from 'next/link';
import TripCard from './(trips-components)/trip-card';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips();

  return (
    <div className='bg-background p-6'>
      <h1 className="text-2xl font-bold mb-6">YOUR TRIPS</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trips.map((trip) => (
          <Link
            href={`/platform/trips/${trip.id}`}
            key={trip.id}
            className="block hover:no-underline"
          >
            <TripCard
              city={trip.locationString.split(',')[0]}
              state={trip.locationString.split(',')[1]?.trim()}
              startDate={trip.startDate?.toLocaleDateString()}
              endDate={trip.endDate?.toLocaleDateString()}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TripsPage;
