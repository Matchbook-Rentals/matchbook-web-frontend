import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getListingsNearLocation } from '@/app/actions/listings';
import { getTripById, createTripFromGuestSession } from '@/app/actions/trips';
import { getGuestSession } from '@/app/actions/guest-session-db';
import { convertGuestSessionToTrip } from '@/app/actions/guest-to-trip';
import SearchPageClient from './search-page-client';

const OGDEN_UT = { lat: 41.223, lng: -111.9738, city: 'Ogden', state: 'UT' };


interface SearchPageProps {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    tripId?: string;
    sessionId?: string;
  }>;
}

const serializeUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map((email: any) => ({
      emailAddress: email.emailAddress,
    })),
    publicMetadata: user.publicMetadata,
  };
};

export interface TripData {
  startDate: string | null;
  endDate: string | null;
  numAdults: number;
  numChildren: number;
  numPets: number;
  locationString: string;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  let tripId = params.tripId || undefined;
  let sessionId = params.sessionId || undefined;

  const user = await currentUser();
  const userObject = serializeUser(user);

  // Authed user with a guest session but no trip → convert and redirect
  if (user?.id && sessionId && !tripId) {
    const guestSession = await getGuestSession(sessionId);
    if (guestSession) {
      const result = await createTripFromGuestSession(guestSession);
      if (result.success && result.tripId) {
        await convertGuestSessionToTrip(sessionId, result.tripId);
        redirect(`/search?tripId=${result.tripId}`);
      }
    }
  }

  // Resolve location + tripData from trip/session record, URL params, or Ogden default
  let lat: number;
  let lng: number;
  let locationString: string;
  let tripData: TripData | null = null;
  let hasLocationParams = false;

  if (tripId && user?.id) {
    try {
      const trip = await getTripById(tripId);
      if (trip) {
        lat = trip.latitude ?? OGDEN_UT.lat;
        lng = trip.longitude ?? OGDEN_UT.lng;
        locationString = trip.locationString || 'this area';
        tripData = {
          startDate: trip.startDate ? trip.startDate.toISOString() : null,
          endDate: trip.endDate ? trip.endDate.toISOString() : null,
          numAdults: trip.numAdults ?? 0,
          numChildren: trip.numChildren ?? 0,
          numPets: trip.numPets ?? 0,
          locationString,
        };
        hasLocationParams = true;
      } else {
        tripId = undefined;
        lat = OGDEN_UT.lat;
        lng = OGDEN_UT.lng;
        locationString = `${OGDEN_UT.city}, ${OGDEN_UT.state}`;
      }
    } catch {
      tripId = undefined;
      lat = OGDEN_UT.lat;
      lng = OGDEN_UT.lng;
      locationString = `${OGDEN_UT.city}, ${OGDEN_UT.state}`;
    }
  } else if (sessionId) {
    try {
      const session = await getGuestSession(sessionId);
      if (session) {
        lat = session.searchParams.lat ?? OGDEN_UT.lat;
        lng = session.searchParams.lng ?? OGDEN_UT.lng;
        locationString = session.searchParams.location || 'this area';
        tripData = {
          startDate: session.searchParams.startDate ? new Date(session.searchParams.startDate).toISOString() : null,
          endDate: session.searchParams.endDate ? new Date(session.searchParams.endDate).toISOString() : null,
          numAdults: session.searchParams.guests.adults,
          numChildren: session.searchParams.guests.children,
          numPets: session.searchParams.guests.pets,
          locationString,
        };
        hasLocationParams = true;
      } else {
        sessionId = undefined;
        lat = OGDEN_UT.lat;
        lng = OGDEN_UT.lng;
        locationString = `${OGDEN_UT.city}, ${OGDEN_UT.state}`;
      }
    } catch {
      sessionId = undefined;
      lat = OGDEN_UT.lat;
      lng = OGDEN_UT.lng;
      locationString = `${OGDEN_UT.city}, ${OGDEN_UT.state}`;
    }
  } else {
    // No trip/session — use lat/lng URL params or Ogden default
    const parsedLat = parseFloat(params.lat || '');
    const parsedLng = parseFloat(params.lng || '');
    hasLocationParams = !isNaN(parsedLat) && !isNaN(parsedLng);
    lat = hasLocationParams ? parsedLat : OGDEN_UT.lat;
    lng = hasLocationParams ? parsedLng : OGDEN_UT.lng;
    locationString = hasLocationParams ? 'this area' : `${OGDEN_UT.city}, ${OGDEN_UT.state}`;
  }

  const PREFETCH_RADIUS_MILES = 25;
  const PREFETCH_COUNT = 100;
  const listings = await getListingsNearLocation(lat, lng, PREFETCH_COUNT, PREFETCH_RADIUS_MILES);

  return (
    <SearchPageClient
      listings={listings}
      center={{ lat, lng }}
      locationString={locationString}
      isSignedIn={!!user?.id}
      userId={user?.id || null}
      user={userObject}
      tripId={tripId}
      sessionId={sessionId}
      tripData={tripData}
      hasLocationParams={hasLocationParams}
    />
  );
}
