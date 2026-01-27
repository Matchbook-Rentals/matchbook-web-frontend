import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { currentUser } from "@clerk/nextjs/server";
import { checkAdminAccess } from "@/utils/roles";
import TripsPageClient from "@/components/newnew/trips-page-client";
import { getListingSections } from "@/lib/listings/get-listing-sections";
import { pullGuestFavoritesFromDb } from "@/app/actions/guest-favorites";

export const metadata: Metadata = {
  title: 'MatchBook Rentals | Find Your Next Home',
  description: 'Search for monthly rentals on an interactive map. Find furnished and unfurnished rentals with flexible lease terms.',
};

// Salt Lake City coordinates (fallback)
const SALT_LAKE_CITY = {
  lat: 40.7608,
  lng: -111.8910,
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

export default async function TripsPage() {
  if (process.env.NODE_ENV === 'production') {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      redirect('/');
    }
  }

  const user = await currentUser();
  const userObject = serializeUser(user);

  // Get listing sections using shared logic
  const { sections, tripData, listingToMatchMap } = await getListingSections(user?.id || null);

  // Load guest favorites for unauthenticated users
  let guestFavoriteIds: string[] = [];
  let initialGuestSessionId: string | null = null;
  if (!user?.id) {
    const cookieStore = cookies();
    const guestSessionCookie = cookieStore.get('matchbook_guest_session_id');
    if (guestSessionCookie?.value) {
      initialGuestSessionId = guestSessionCookie.value;
      const result = await pullGuestFavoritesFromDb(guestSessionCookie.value);
      if (result.success) {
        guestFavoriteIds = result.favoriteIds;
      }
    }
  }

  return (
    <TripsPageClient
      userId={user?.id || null}
      user={userObject}
      isSignedIn={!!user?.id}
      defaultCenter={SALT_LAKE_CITY}
      sections={sections}
      favoriteListingIds={tripData.favoriteListingIds}
      matchedListingIds={tripData.matchedListingIds}
      listingToMatchMap={listingToMatchMap}
      initialRequestedIds={tripData.requestedListingIds}
      guestFavoriteIds={guestFavoriteIds}
      initialGuestSessionId={initialGuestSessionId}
    />
  );
}
