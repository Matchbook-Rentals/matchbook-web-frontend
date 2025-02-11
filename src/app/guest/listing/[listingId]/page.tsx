import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import ListingDetailsView from '@/app/guest/listing/(listing-components)/listing-details-view'
import MatchbookHeader from '@/components/marketing-landing-components/matchbook-header'
import { PAGE_MARGIN } from '@/constants/styles'
import PlatformNavbar from '@/components/platform-components/platformNavbar'

interface ListingPageProps {
  params: {
    listingId: string
  }
}

export default async function ListingPage({ params }: ListingPageProps) {

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { listingImages: true, bedrooms: true, user: true },
  }) as ListingAndImages | null

  if (!listing) {
    redirect('/platform/listings')
  }

  return (
    <>
      <PlatformNavbar />
      <div className={`${PAGE_MARGIN} font-montserrat `}>
       <ListingDetailsView listing={listing} />
      </div>
    </>
  )
}