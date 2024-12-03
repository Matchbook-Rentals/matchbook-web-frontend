import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import Link from 'next/link';
import TripCard from './(trips-components)/trip-card';
import { APP_PAGE_MARGIN } from '@/constants/styles';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips();

  return (
    <div className={`bg-background ${APP_PAGE_MARGIN}`}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--Major-Text, #404040)', fontFamily: 'Lora', fontSize: '36px', fontStyle: 'normal', fontWeight: '500', lineHeight: 'normal' }}>Searches</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trips.map((trip) => (
          <Link
            href={`/platform/trips/${trip.id}`}
            key={trip.id}
            className="block hover:no-underline"
          >
            <TripCard
              city={trip?.city || trip.locationString.split(',')[0]}
              state={trip?.state || trip.locationString.split(',')[1]?.trim()}
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
