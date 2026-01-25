import { notFound } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from "@/components/marketing-landing-components/footer";
import { PAGE_MARGIN } from '@/constants/styles'
import PublicListingDetailsView from '@/app/guest/listing/[listingId]/(components)/public-listing-details-view'
import { currentUser } from "@clerk/nextjs/server";
import { Metadata } from 'next';
import { getHostListingsCountForUser } from "@/app/actions/listings";

interface ListingPageProps {
  params: {
    listingId: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const listing = await prisma.listing.findUnique({
    where: {
      id: params.listingId,
      approvalStatus: 'approved',
      markedActiveByUser: true
    },
    select: {
      title: true,
      description: true,
      city: true,
      state: true,
      listingImages: {
        take: 1,
        select: { url: true }
      }
    },
  })

  if (!listing) {
    return {
      title: 'Listing Not Found - MatchBook Rentals',
      description: 'The requested listing could not be found.'
    }
  }

  const imageUrl = listing.listingImages?.[0]?.url
  const location = `${listing.city}, ${listing.state}`

  return {
    title: `${listing.title} - ${location} | MatchBook Rentals`,
    description: listing.description || `Find your perfect rental in ${location} with MatchBook`,
    openGraph: {
      title: `${listing.title} - ${location}`,
      description: listing.description || `Find your perfect rental in ${location} with MatchBook`,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} - ${location}`,
      description: listing.description || `Find your perfect rental in ${location} with MatchBook`,
      images: imageUrl ? [imageUrl] : [],
    }
  }
}

export default async function SearchListingPage({ params }: ListingPageProps) {
  // Fetch listing with approval and active status restrictions
  const listing = await prisma.listing.findUnique({
    where: {
      id: params.listingId,
      approvalStatus: 'approved',
      markedActiveByUser: true
    },
    include: {
      listingImages: true,
      bedrooms: true,
      user: true,
      monthlyPricing: true
    },
  }) as ListingAndImages | null

  // Return 404 if listing doesn't exist or doesn't meet criteria
  if (!listing) {
    notFound()
  }

  // Get current user for header (optional for public page)
  const user = await currentUser();

  // Serialize user data to plain object
  const userObject = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    emailAddresses: user.emailAddresses?.map(email => ({ emailAddress: email.emailAddress })),
    publicMetadata: user.publicMetadata
  } : null;

  const hasListings = user?.id ? await getHostListingsCountForUser(user.id) > 0 : false;

  // Default location string for display
  const locationString = `${listing.city}, ${listing.state}`

  return (
    <>
      <MatchbookHeader
        userId={user?.id || null}
        user={userObject}
        isSignedIn={!!user?.id}
        className={`${PAGE_MARGIN} px-0`}
        hasListings={hasListings}
      />
      <div className={`${PAGE_MARGIN} font-montserrat min-h-screen`}>
        <PublicListingDetailsView
          listing={listing}
          locationString={locationString}
        />
      </div>
      <Footer />
    </>
  )
}
