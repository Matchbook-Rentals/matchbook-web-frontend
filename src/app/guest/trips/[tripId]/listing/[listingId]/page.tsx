import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import { PAGE_MARGIN } from '@/constants/styles'
import PlatformNavbar from '@/components/platform-components/platformNavbar'
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

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { listingImages: true, bedrooms: true, user: true },
  }) as ListingAndImages | null

  const trip = await prisma.trip.findUnique({
    where: { id: params.tripId },
  }) as Trip | null

  const calculatedPrice = calculateRent({ listing, trip })

  if (!listing) {
    redirect('/platform/listings')
  }

  return (
    <>
      <PlatformNavbar />
      <div className={`${PAGE_MARGIN} font-montserrat `}>
        <ListingDetailsView listing={listing} locationString={trip.locationString} calculatedPrice={calculatedPrice} />
      </div>
    </>
  )
}