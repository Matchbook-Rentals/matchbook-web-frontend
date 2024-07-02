import React from 'react'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache';
import TripContextProvider from '@/contexts/trip-context-provider';
import { Trip, Listing } from '@prisma/client';

// Update this fx so that it includes favorites (a relation to the trip model)
const pullTripFromDb = async (tripId: string) => {
  'use server'

  console.log("IM HERE")
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { favorites: true, matches: true, } })

  if (trip) {
    if (!trip.latitude || !trip.longitude) {
      const locationIQApiKey = process.env.LOCATIONIQ_API_KEY;
      const locationString = encodeURIComponent(trip.locationString);
      const url = `https://us1.locationiq.com/v1/search.php?key=${locationIQApiKey}&q=${locationString}&format=json`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];

          await prisma.trip.update({
            where: { id: tripId },
            data: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
            },
          });

          trip.latitude = parseFloat(lat);
          trip.longitude = parseFloat(lon);
        }
      } catch (error) {
        console.error('Error fetching location data:', error);
      }
    }
    return trip;
  }
}

const pullListingsFromDb = async (lat: number, lng: number, radiusMiles: number) => {
  'use server';

  const earthRadiusMiles = 3959; // Earth's radius in miles

  try {
    // Input validation
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Invalid latitude. Must be a number between -90 and 90.');
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Invalid longitude. Must be a number between -180 and 180.');
    }
    if (typeof radiusMiles !== 'number' || isNaN(radiusMiles) || radiusMiles <= 0) {
      throw new Error('Invalid radius. Must be a positive number.');
    }

    const listingIds = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id, 
    (${earthRadiusMiles} * acos(
      cos(radians(${lat})) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(latitude))
    )) AS distance
    FROM Listing
    HAVING distance <= ${radiusMiles}
    ORDER BY distance
  `;

    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: listingIds.map(item => item.id)
        }
      },
      include: {
        listingImages: true
      },
      orderBy: {
        // You might want to preserve the original distance-based ordering
        id: 'asc' // This assumes IDs were returned in the correct order
      }
    });


    return listings;
  } catch (error) {
    console.error('Error in pullListingsFromDb:', error);
    throw error; // Re-throw the error for the caller to handle
  }
}
const createDbFavorite = async (tripId: string, listingId: string) => {
  'use server'
  console.log('Creating new favrorite with trip and listing ->', tripId, listingId)
  try {
    // Check if a favorite with the same tripId and listingId already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        tripId,
        listingId,
      },
    });

    if (existingFavorite) {
      throw new Error('Favorite already exists for this trip and listing');
    }

    // Get the highest rank for the current trip
    const highestRank = await prisma.favorite.findFirst({
      where: { tripId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });

    const newRank = (highestRank?.rank || 0) + 1;

    // Create the new favorite
    const newFavorite = await prisma.favorite.create({
      data: {
        tripId,
        listingId,
        rank: newRank,
      },
    });

    console.log('Favorite Created', newFavorite)

    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/favorites');

    return newFavorite;
  } catch (error) {
    console.error('Error creating favorite:', error);
    throw error;
  }
}

export default async function TripLayout({ children, params }: { children: React.ReactNode, params: { tripId: string } }) {
  const trip = await pullTripFromDb(params.tripId) as Trip;
  const listings = await pullListingsFromDb(trip.latitude, trip.longitude, 100);

  return (
    <TripContextProvider
      tripData={trip}
      listingData={listings}
      pullTripFromDb={pullTripFromDb}
      createDbFavorite={createDbFavorite}
    >
      {children}
    </TripContextProvider>
  );
}
