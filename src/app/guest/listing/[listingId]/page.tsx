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
  const { userId } = auth()

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { listingImages: true, bedrooms: true, user: true },
  }) as ListingAndImages | null

  if (!listing) {
    redirect('/platform/listings')
  }

  return (
    <div className={`${PAGE_MARGIN} font-montserrat max-w-[1440px] mx-auto px-4 md:px-6`}>
      <MatchbookHeader customMargin={false} />
      <ListingDetailsView listing={listing} />
    </div>
  )
}