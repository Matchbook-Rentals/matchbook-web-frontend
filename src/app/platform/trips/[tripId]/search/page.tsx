import prisma from '@/lib/prismadb'
import MatchBar from '../matchBar';
import ListingPhotos from '../listingPhotos';
import TripIdPageClient from '../tripID-page-client';


type TripsPageProps = {
  params: { tripId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};


const pullMockListings = async () => {
  'use server';

  try {
    const listings = await prisma.listing.findMany({
      where: {
        id: {
          in: ["1", "2", "3"], // Looks for listings where the value field is either "1", "2", or "3"
        },
      },
    });
    return listings;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error; // Re-throw the error for further handling
  }
}

const pullTripFromDb = async (tripId) => {
  'use server'

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { favorites: true, matches: true, } })

  return trip
}

const addListingToFavorites = async (listingId, tripId) => {
  'use server';

  try {
    const favorite = await prisma.favorite.create({
      data: {
        tripId: tripId,
        listingId: listingId,
      },
    });
    console.log('Listing added to favorites successfully:', favorite);
  } catch (error) {
    console.error('Failed to add listing to favorites:', error);
    // throw error; // Or handle the error as needed
  }
};


export default async function TripsPage({ params, searchParams }: TripsPageProps) {

  return (
    <>
      <TripIdPageClient addListingToFavorites={addListingToFavorites} />
    </>
  );
}

