import React from 'react';
import { getAllUserTrips } from '@/app/actions/trips';
import TripsContent from './(trips-components)/trips-content';

const TripsPage: React.FC = async () => {
  const trips = await getAllUserTrips({ next: { tags: ['user-trips'] } });

  return <TripsContent trips={trips} />;
};

export default TripsPage;
