import { notFound } from 'next/navigation'
import { ListingWithRelations } from '@/types'
import prisma from '@/lib/prismadb'
import MatchbookHeader from "@/components/marketing-landing-components/matchbook-header";
import Footer from "@/components/marketing-landing-components/footer";
import { PAGE_MARGIN } from '@/constants/styles'
import PublicListingDetailsView from './(components)/public-listing-details-view'
import { RenterListingActionBoxProvider } from './(components)/renter-listing-action-box-context'
import { currentUser } from "@clerk/nextjs/server";
import { Metadata } from 'next';
import { getHostListingsCountForUser } from "@/app/actions/listings";
import { getOrCreateTripForListing } from '@/app/actions/trips';

interface ListingPageProps {
  params: {
    listingId: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
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

export default async function PublicListingPage({ params, searchParams }: ListingPageProps) {
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
      monthlyPricing: true,
      unavailablePeriods: true,
      bookings: { where: { status: { in: ['reserved', 'pending_payment', 'confirmed', 'active'] } } },
    },
  }) as ListingWithRelations | null

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

  // Check if listing is favorited on any of the user's trips
  let isFavorited = false;
  if (user) {
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        listingId: params.listingId,
        trip: { userId: user.id },
      },
      select: { id: true },
    });
    isFavorited = !!existingFavorite;
  }

  // Default location string for display
  const locationString = `${listing.city}, ${listing.state}`

  // Parse date/guest params (passed through auth redirect)
  const startDateParam = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined;
  const endDateParam = typeof searchParams.endDate === 'string' ? searchParams.endDate : undefined;
  const isApplying = searchParams.isApplying === 'true';
  const numAdults = Number(searchParams.numAdults) || 0;
  const numChildren = Number(searchParams.numChildren) || 0;
  const numPets = Number(searchParams.numPets) || 0;

  const initialStartDate = startDateParam ? new Date(startDateParam) : null;
  const initialEndDate = endDateParam ? new Date(endDateParam) : null;
  const initialGuests = (numAdults > 0) ? { adults: numAdults, children: numChildren, pets: numPets } : undefined;

  // If authed user arrived with dates (e.g. post-auth redirect), create a trip
  let tripId: string | undefined;
  if (user && initialStartDate && initialEndDate) {
    const tripResult = await getOrCreateTripForListing(params.listingId, {
      startDate: initialStartDate,
      endDate: initialEndDate,
    });
    if (tripResult.success && tripResult.trip) {
      tripId = tripResult.trip.id;
    }
  }

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
        <RenterListingActionBoxProvider
          listing={listing}
          isAuthenticated={!!user}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          initialGuests={initialGuests}
          autoApply={!!(user && isApplying && tripId)}
        >
          <PublicListingDetailsView
            listing={listing}
            locationString={locationString}
            isAuthenticated={!!user}
            isFavorited={isFavorited}
            tripId={tripId}
          />
        </RenterListingActionBoxProvider>
      </div>
      <Footer />
    </>
  )
}