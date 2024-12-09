import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import TripGrid from './(trips-components)/trip-grid';
import { APP_PAGE_MARGIN } from '@/constants/styles';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips();

  return (
    <div className={`bg-background ${APP_PAGE_MARGIN}`}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--Major-Text, #404040)', fontFamily: 'Lora', fontSize: '36px', fontStyle: 'normal', fontWeight: '500', lineHeight: 'normal' }}>Searches</h1>
      <TripGrid initialTrips={trips} />
    </div>
  );
};

export default TripsPage;
