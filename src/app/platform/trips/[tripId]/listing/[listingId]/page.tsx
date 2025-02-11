import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getTripById } from '@/app/actions/trips'
import { TripContextProvider } from '@/contexts/trip-context-provider'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import ListingDetailsView from '@/app/platform/trips/(trips-components)/listing-details-view'

interface ListingPageProps {
  params: {
    tripId: string
    listingId: string
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const trip = await getTripById(params.tripId)
  if (!trip) {
    redirect('/platform/trips')
  }

  // Check if the trip belongs to the user
  if (trip.userId !== userId) {
    console.log("Not invited to trip, showing default listing view")
    redirect('/platform/trips/not-invited')
  }

  // Get the listing
  // const listing = await prisma.listing.findUnique({
  //   where: { id: params.listingId },
  //   include: {
  //     listingImages: true,
  //     bedrooms: true,
  //     user: true,
  //     unavailablePeriods: true,
  //     bookings: true
  //   }
  // }) as ListingAndImages | null

  // if (!listing) {
  //   redirect('/platform/trips')
  // }

  return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        <ListingDetailsView listingId={params.listingId} />
      </div>
  )
}