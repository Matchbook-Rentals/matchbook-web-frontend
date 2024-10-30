import React from 'react';
//import { useSearchContext } from '@/contexts/search-context-provider';
import { useTripContext } from '@/contexts/trip-context-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export function SearchMatchbookTab() {
  const { state } = useTripContext();
  const { matchedListings, trip } = state;

  if (matchedListings.length === 0) {
    return <p>No matched listings found.</p>;
  }

  const getMatchId = (listingId: string) => {
    const match = trip?.matches.find((match) => match.listingId === listingId);
    return match?.id;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {matchedListings.map((listing) => (
        <Card key={listing.id}>
          <CardHeader>
            <CardTitle>{listing.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Price: ${listing.price}</p>
            <p>Bedrooms: {listing.roomCount}</p>
            <p>Bathrooms: {listing.bathroomCount}</p>
            {listing.squareFootage && <p>Area: {listing.squareFootage} sq ft</p>}
          </CardContent>
          <CardFooter>
            <Link href={`/platform/searches/book/${getMatchId(listing.id)}`} className="w-full">
              <Button className="w-full">BOOK NOW</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
