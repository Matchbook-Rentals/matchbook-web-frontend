import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';
import { TripContextProvider } from '@/contexts/trip-context-provider';
import TripClientComponent from './TripClientComponent';

export default async function TripPage({
  params
}: {
  params: { tripId: string }
}) {
  const trip = await getTripById(params.tripId, { next: { tags: [`trip-${params.tripId}`, 'user-trips'] } });
  if (!trip) { return <p> NO TRIP FOUND </p> }

  // Run these promises in parallel
  const [listings, application] = await Promise.all([
    pullListingsFromDb(trip.latitude, trip.longitude, 100),
    getUserApplication()
  ]);
  const hasApplicationData = !!application;

  return (
    <TripContextProvider
      tripData={trip}
      listingData={listings}
      hasApplicationData={hasApplicationData}
      application={application || null}
    >
      <TripClientComponent />
    </TripContextProvider>
  );
}
