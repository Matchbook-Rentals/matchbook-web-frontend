import React from 'react';
import { useSearchContext } from '@/contexts/search-context-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SearchMatchbookTab() {
  const { state } = useSearchContext();
  const { matchedListings } = state;

  if (matchedListings.length === 0) {
    return <p>No matched listings found.</p>;
  }

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
            <Button className="w-full">BOOK NOW</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}