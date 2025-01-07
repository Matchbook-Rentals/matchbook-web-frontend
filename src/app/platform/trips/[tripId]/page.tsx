import { pullListingsFromDb } from '@/app/actions/listings';
import { getTripById } from '@/app/actions/trips';
import { getUserApplication } from '@/app/actions/applications';
import { TripContextProvider } from '@/contexts/trip-context-provider';
import TripClientComponent from './TripClientComponent';

const createTimeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
};

export default async function TripPage({
  params
}: {
  params: { tripId: string }
}) {
  try {
    const tripResult = await Promise.race([
      getTripById(params.tripId, { next: { tags: [`trip-${params.tripId}`, 'user-trips'] } }),
      createTimeout(5000)
    ]);

    if (!tripResult) {
      return <p>NO TRIP FOUND</p>;
    }

    const trip = tripResult;

    const [rawListings, application] = await Promise.race([
      Promise.all([
        pullListingsFromDb(trip.latitude, trip.longitude, 100),
        getUserApplication()
      ]),
      createTimeout(15000)
    ]) as [RawListingResult[], typeof application];

    const hasApplicationData = !!application;

    return (
      <TripContextProvider
        tripData={trip}
        listingData={rawListings}
        hasApplicationData={hasApplicationData}
        application={application || null}
      >
        <TripClientComponent />
      </TripContextProvider>
    );
  } catch (error) {
    if (error instanceof Error) {
      // You might want to log this error to your error tracking service
      console.error('Error loading trip page:', error);

      return (
        <div className="p-4">
          <h2 className="text-xl font-semibold text-red-600">
            {error.message.includes('timed out')
              ? 'Request took too long. Please try again.'
              : 'Something went wrong. Please try again later.'}
          </h2>
        </div>
      );
    }
    throw error; // Re-throw unexpected errors
  }
}
