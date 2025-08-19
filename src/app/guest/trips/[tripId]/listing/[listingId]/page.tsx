import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { PAGE_MARGIN } from '@/constants/styles'
import RenterNavbar from '@/components/platform-components/renterNavbar'
import { calculateRent, calculateLengthOfStay } from '@/lib/calculate-rent';
import ListingDetailsView from '../(listing-components)/listing-details-view'
import { Trip } from '@prisma/client'

interface ListingPageProps {
  params: {
    listingId: string
    tripId: string
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { userId } = auth()
  const user = await currentUser()

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { listingImages: true, bedrooms: true, user: true, monthlyPricing: true },
  }) as ListingAndImages | null

  const trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
  }) as Trip | null

  const calculatedPrice = calculateRent({ listing, trip })

  if (!listing || !trip) {
    redirect('/app/listings')
  }

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
      <RenterNavbar userId={userId} user={userObject} isSignedIn={!!userId} />
      <div className={`${PAGE_MARGIN} font-montserrat `}>
        <ListingDetailsView listing={listing} locationString={trip.locationString} calculatedPrice={calculatedPrice} />
      </div>
    </>
  )
}
