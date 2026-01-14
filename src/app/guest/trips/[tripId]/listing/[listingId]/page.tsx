import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { PAGE_MARGIN } from '@/constants/styles'
import RenterNavbar from '@/components/platform-components/renterNavbar'
import GuestSearchNavbar from '@/components/marketing-landing-components/guest-search-navbar'
import { calculateRent, calculateLengthOfStay } from '@/lib/calculate-rent';
import ListingDetailsView from '../(listing-components)/listing-details-view'
import { Trip } from '@prisma/client'
import { getGuestSession } from '@/app/actions/guest-session-db'

interface ListingPageProps {
  params: {
    listingId: string
    tripId: string  // This could be a trip ID or guest session ID
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { userId } = auth()
  const user = await currentUser()

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { listingImages: true, bedrooms: true, user: true, monthlyPricing: true },
  }) as ListingAndImages | null

  // Try to find a trip first
  let trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
  }) as Trip | null

  // If no trip found, check if it's a guest session ID
  let guestSession = null;
  let locationString = '';

  if (!trip) {
    guestSession = await getGuestSession(params.tripId);
    if (guestSession) {
      // Create a mock trip object for price calculation
      trip = {
        id: params.tripId,
        startDate: guestSession.searchParams.startDate,
        endDate: guestSession.searchParams.endDate,
        latitude: guestSession.searchParams.lat,
        longitude: guestSession.searchParams.lng,
        locationString: guestSession.searchParams.location,
      } as Trip;
      locationString = guestSession.searchParams.location;
    }
  } else {
    locationString = trip.locationString;
  }

  if (!listing || !trip) {
    redirect(guestSession ? '/' : '/app/listings')
  }

  const calculatedPrice = calculateRent({ listing, trip })

  // Serialize user data for navbar
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })) || [],
    publicMetadata: user.publicMetadata ? JSON.parse(JSON.stringify(user.publicMetadata)) : {}
  } : null

  return (
    <>
      {guestSession ? (
        <GuestSearchNavbar userId={null} user={null} isSignedIn={false} buttonText="Sign In" />
      ) : (
        <RenterNavbar userId={userId} user={userObject} isSignedIn={!!userId} />
      )}
      <div className={`${PAGE_MARGIN} font-montserrat `}>
        <ListingDetailsView listing={listing} locationString={locationString} calculatedPrice={calculatedPrice} trip={trip} />
      </div>
    </>
  )
}
