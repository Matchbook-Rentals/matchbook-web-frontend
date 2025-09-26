import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { GuestSessionService } from '@/utils/guest-session';
import { pullGuestListingsFromDb } from '@/app/actions/guest-listings';
import { createTripFromGuestSession } from '@/app/actions/trips';
import { convertGuestSessionToTrip } from '@/app/actions/guest-to-trip';
import { checkExistingGuestConversion } from '@/app/actions/guest-conversion';
import GuestSearchClient from './guest-search-client';

export default async function GuestSearchPage({
  params,
  searchParams
}: {
  params: { sessionId: string };
  searchParams: { tab?: string };
}) {
  const { userId } = auth();
  const sessionId = params.sessionId;
  const cookieStore = cookies();
  const cookieHeader = cookieStore.toString();

  // Get session data from cookies (server-side accessible)
  const sessionData = GuestSessionService.getSessionByIdFromCookies(sessionId, cookieHeader);

  // If no session data found, redirect to home
  if (!sessionData) {
    redirect('/');
  }

  // If user is authenticated, handle conversion SERVER-SIDE
  if (userId) {
    // Check if this session has already been converted
    const conversionCheck = await checkExistingGuestConversion(sessionId);

    if (conversionCheck.success && conversionCheck.existingTrip) {
      // Already converted, redirect to existing trip
      redirect(`/app/rent/searches/${conversionCheck.existingTrip.id}`);
    }

    // Try to convert the guest session
    let tripId: string | null = null;
    try {
      const newTripResult = await createTripFromGuestSession(sessionData);
      if (newTripResult.success && newTripResult.tripId) {
        // Convert guest favorites/dislikes to trip
        await convertGuestSessionToTrip(sessionId, newTripResult.tripId);
        tripId = newTripResult.tripId;
      }
    } catch (error) {
      console.error('Error during server-side conversion:', error);
      // On error, redirect to home
      redirect('/');
    }

    // Redirect based on result (outside try-catch)
    if (tripId) {
      redirect(`/app/rent/searches/${tripId}`);
    } else {
      redirect('/');
    }
  }

  // Guest user - fetch listings server-side
  try {
    const locationArray = sessionData.searchParams.location.split(',');
    const state = locationArray[locationArray.length - 1]?.trim() || 'CA';

    const listings = await pullGuestListingsFromDb(
      sessionData.searchParams.lat,
      sessionData.searchParams.lng,
      100, // 100 mile radius
      state,
      sessionData.searchParams.startDate || new Date(),
      sessionData.searchParams.endDate || new Date()
    );

    // Pass everything to client component
    return (
      <GuestSearchClient
        sessionId={sessionId}
        sessionData={sessionData}
        listings={listings}
        initialTab={searchParams.tab || 'recommended'}
      />
    );
  } catch (error) {
    console.error('Error fetching guest listings:', error);
    // On error, still render client with empty listings
    return (
      <GuestSearchClient
        sessionId={sessionId}
        sessionData={sessionData}
        listings={[]}
        initialTab={searchParams.tab || 'recommended'}
      />
    );
  }
}