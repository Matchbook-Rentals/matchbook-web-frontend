import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getListingsNearLocation } from '@/app/actions/listings';
import SearchPageClient from './search-page-client';

interface SearchPageProps {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    city?: string;
    state?: string;
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const lat = parseFloat(params.lat || '');
  const lng = parseFloat(params.lng || '');

  if (isNaN(lat) || isNaN(lng)) {
    redirect('/newnew');
  }

  const locationString = [params.city, params.state].filter(Boolean).join(', ') || 'this area';

  const [user, listings] = await Promise.all([
    currentUser(),
    getListingsNearLocation(lat, lng, 100, 100),
  ]);

  const userObject = serializeUser(user);

  return (
    <SearchPageClient
      listings={listings}
      center={{ lat, lng }}
      locationString={locationString}
      isSignedIn={!!user?.id}
      userId={user?.id || null}
      user={userObject}
    />
  );
}
