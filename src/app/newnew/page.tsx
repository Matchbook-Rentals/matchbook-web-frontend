import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SearchNavbar from "@/components/newnew/search-navbar";
import PopularListingsSectionWrapper from "@/components/home-components/popular-listings-section-wrapper";
import Footer from "@/components/marketing-landing-components/footer";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { getMostRecentTrip, getAllUserTrips } from "@/app/actions/trips";
import { getGuestSessionLocation } from "@/app/actions/guest-session-db";
import { RecentSearch } from "@/components/newnew/search-navbar";
import { HomePageWrapper } from "@/components/home-page-wrapper";
import { getPopularListingAreas } from "@/app/actions/listings";
import { getHomepageUserState, HomepageUserState } from "@/app/actions/homepage-user-state";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Monthly Rentals',
  description: 'MatchBook is a monthly rental platform built to make renting easier and more affordable for hosts and renters. Find furnished and unfurnished rentals, with leases from 30 days to 1 year.',
};

const serializeUser = (user: any) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map((email: any) => ({
      emailAddress: email.emailAddress
    })),
    publicMetadata: user.publicMetadata
  };
};

const NewNewHomePage = async () => {
  const [user, popularAreas] = await Promise.all([
    currentUser(),
    getPopularListingAreas(5) // Fetch 5 to account for potential skips
  ]);

  const userObject = serializeUser(user);

  // Build recent searches from user's trips
  let recentSearches: RecentSearch[] = [];
  if (user?.id) {
    try {
      const trips = await getAllUserTrips();
      recentSearches = trips.slice(0, 3).map((trip) => {
        const formatDate = (d: Date | null | undefined) =>
          d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const totalRenters = (trip.numAdults ?? 0) + (trip.numChildren ?? 0);
        const dateStr = trip.startDate && trip.endDate
          ? `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
          : 'Flexible dates';
        const renterStr = totalRenters === 0
          ? 'Add Renters'
          : `${totalRenters} Renter${totalRenters !== 1 ? 's' : ''}`;
        return {
          tripId: trip.id,
          location: trip.locationString || 'Unknown location',
          details: `${dateStr} - ${renterStr}`,
        };
      });
    } catch {
      // User may not be authenticated or trips may fail - that's fine
    }
  }

  // Get user's most recent trip location and user state if signed in
  let userTripLocation = null;
  let recentTripId: string | null = null;
  let userState: HomepageUserState | null = null;

  if (user?.id) {
    const [recentTrip, fetchedUserState] = await Promise.all([
      getMostRecentTrip(),
      getHomepageUserState()
    ]);

    userState = fetchedUserState;
    recentTripId = recentTrip?.id || null;

    if (recentTrip?.city || recentTrip?.locationString) {
      userTripLocation = {
        city: recentTrip.city,
        state: recentTrip.state,
        locationString: recentTrip.locationString,
        latitude: recentTrip.latitude,
        longitude: recentTrip.longitude,
        searchRadius: recentTrip.searchRadius,
      };
    }
  }

  // Guest fallback: use guest session location when not signed in
  if (!user?.id && !userTripLocation) {
    const cookieStore = await cookies();
    const guestSessionId = cookieStore.get('matchbook_guest_session_id')?.value;
    if (guestSessionId) {
      const guestLocation = await getGuestSessionLocation(guestSessionId);
      if (guestLocation?.city || guestLocation?.locationString) {
        userTripLocation = {
          city: guestLocation.city,
          state: guestLocation.state,
          locationString: guestLocation.locationString,
          latitude: guestLocation.latitude,
          longitude: guestLocation.longitude,
          searchRadius: null,
        };
      }
    }
  }

  return (
    <HomePageWrapper>
      <div className="overflow-x-hidden bg-background">
        <SearchNavbar
          userId={user?.id || null}
          user={userObject}
          isSignedIn={!!user?.id}
          recentSearches={recentSearches}
          suggestedLocations={popularAreas.map((area) => ({
            title: `Monthly Rentals in ${area.city}, ${area.state}`,
          }))}
        />
        <div className="h-[40px]" />
        <PopularListingsSectionWrapper
          isSignedIn={!!user?.id}
          userTripLocation={userTripLocation}
          popularAreas={popularAreas}
          userState={userState}
          recentTripId={recentTripId}
        />
        <div className="h-[40px]" />
        <Footer />
      </div>
    </HomePageWrapper>
  );
};

export default NewNewHomePage;
