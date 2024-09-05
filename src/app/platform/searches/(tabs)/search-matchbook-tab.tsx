import React from 'react';
import { useSearchContext } from '@/contexts/search-context-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export function SearchMatchbookTab() {
  const { state } = useSearchContext();
  const { matchedListings, currentSearch } = state;

  if (matchedListings.length === 0) {
    return <p>No matched listings found.</p>;
  }

  const getMatchId = (listingId: string) => {
    const match = currentSearch?.matches.find((match) => match.listingId === listingId);
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
            <Button className="w-full">
              <Link href={`/platform/searches/book/${getMatchId(listing.id)}`}>BOOK NOW</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}