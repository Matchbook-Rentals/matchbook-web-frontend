'use client'
import { useRouter } from 'next/navigation'
import { getTripById } from '@/app/actions/trips'
import prisma from '@/lib/prismadb'
import SearchListingDetailsView from '@/app/platform/searches/(trips-components)/search-listing-details-view'
import { useTripContext } from '@/contexts/trip-context-provider'
import { useUser } from '@clerk/nextjs'
import { PAGE_MARGIN } from '@/constants/styles'

interface ListingPageProps {
  params: {
    tripId: string
    listingId: string
  }
}

export default function SearchListingPage({ params }: ListingPageProps) {
  const { user } = useUser()
  const { state } = useTripContext()
  const router = useRouter()

  // Show loading state while trip or user data is being fetched
  if (!state.trip || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Check if the trip belongs to the user
  if (state.trip?.userId !== user?.id) {
    console.log("Not invited to trip, showing default listing view")
    setTimeout(() => {
      router.push(`/guest/listing/${params.listingId}`)
    }, 2000)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="font-mona-sans text-4xl md:text-6xl font-bold text-gray-900 mb-4 text-center">
          Not Invited to Trip
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 text-center">
          Redirecting to default listing view...
        </p>
        <div className="w-12 h-12 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
      <div className={`${PAGE_MARGIN} pt-2 md:pt-6`}>
        <SearchListingDetailsView listingId={params.listingId} />
      </div>
  )
}
