import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from "@clerk/nextjs/server";
import { checkAdminAccess } from "@/utils/roles";
import TripsPageClient from "@/components/newnew/trips-page-client";

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
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    redirect('/');
  }

  const user = await currentUser();
  const userObject = serializeUser(user);

  return (
    <TripsPageClient
      userId={user?.id || null}
      user={userObject}
      isSignedIn={!!user?.id}
      defaultCenter={SALT_LAKE_CITY}
    />
  );
}
