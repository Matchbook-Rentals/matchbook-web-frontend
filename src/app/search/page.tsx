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

  return (
    <SearchPageClient
      listings={listings}
      center={{ lat, lng }}
      locationString={locationString}
      isSignedIn={!!user?.id}
    />
  );
}
