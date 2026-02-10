import { notFound } from 'next/navigation'
import { ListingAndImages } from '@/types'
import prisma from '@/lib/prismadb'
import ListingDetailNavbar from "@/components/listing-detail-navbar";
import { PAGE_MARGIN } from '@/constants/styles'
import { currentUser } from "@clerk/nextjs/server";
import { Metadata } from 'next';
import { getHostListingsCountForUser } from "@/app/actions/listings";
import { getListingApplicationState } from "@/app/actions/housing-requests";
import { getTripApplication } from '@/app/actions/applications';
import { calculateRent } from '@/lib/calculate-rent';
import { Trip } from '@prisma/client';
import ListingDetailWithWizard from './(components)/listing-detail-with-wizard';

interface ListingPageProps {
  params: {
    listingId: string
  }
  searchParams: {
    tripId?: string
    startDate?: string
    endDate?: string
    isApplying?: string
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

export default async function SearchListingPage({ params, searchParams }: ListingPageProps) {
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

  // Parse query params for trip context
  // Priority: dates > tripId
  const { tripId, startDate: startDateStr, endDate: endDateStr } = searchParams;
  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  // Build trip context
  let tripContext: { tripId?: string; startDate: Date; endDate: Date; numAdults?: number; numChildren?: number; numPets?: number } | null = null;
  let calculatedPrice: number | null = null;

  // If dates are provided, use them directly
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    // If tripId is also provided, fetch guest counts from trip
    let guestCounts: { numAdults?: number; numChildren?: number; numPets?: number } = {};
    if (tripId && user) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { userId: true, numAdults: true, numChildren: true, numPets: true }
      });
      if (trip && trip.userId === user.id) {
        guestCounts = {
          numAdults: trip.numAdults ?? undefined,
          numChildren: trip.numChildren ?? undefined,
          numPets: trip.numPets ?? undefined,
        };
      }
    }

    tripContext = { tripId, startDate, endDate, ...guestCounts };

    // Calculate price using dates
    const mockTrip = { startDate, endDate } as Trip;
    const listingWithPricing = { ...listing, monthlyPricing: listing.monthlyPricing || [] };
    calculatedPrice = calculateRent({ listing: listingWithPricing, trip: mockTrip });
  }
  // Otherwise, if tripId is provided, fetch the trip to get dates
  else if (tripId && user) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (trip && trip.userId === user.id && trip.startDate && trip.endDate) {
      tripContext = {
        tripId: trip.id,
        startDate: trip.startDate,
        endDate: trip.endDate,
        numAdults: trip.numAdults ?? undefined,
        numChildren: trip.numChildren ?? undefined,
        numPets: trip.numPets ?? undefined,
      };
      const listingWithPricing = { ...listing, monthlyPricing: listing.monthlyPricing || [] };
      calculatedPrice = calculateRent({ listing: listingWithPricing, trip });
    }
  }

  // Get user's application state and application data (if authenticated)
  let listingState: { hasApplied: boolean; isMatched: boolean } | null = null;
  let userApplication: any = null;
  if (user) {
    listingState = await getListingApplicationState(params.listingId, tripId);
    // Load trip-specific application if exists, otherwise fall back to default
    const appResult = await getTripApplication(tripId);
    userApplication = appResult.success ? appResult.application : null;
  }

  // Default location string for display
  const locationString = `${listing.city}, ${listing.state}`

  // Determine if we should auto-apply (all conditions must be met)
  const shouldAutoApply = searchParams.isApplying === 'true' && !!user && !!tripContext;

  return (
    <>
      <ListingDetailNavbar
        userId={user?.id || null}
        user={userObject}
        isSignedIn={!!user?.id}
        hasListings={hasListings}
      />
      <div className={`${PAGE_MARGIN} font-montserrat min-h-screen`}>
        <ListingDetailWithWizard
          listing={listing}
          locationString={locationString}
          isAuthenticated={!!user}
          tripContext={tripContext}
          calculatedPrice={calculatedPrice}
          listingState={listingState}
          userApplication={userApplication}
          shouldAutoApply={shouldAutoApply}
        />
      </div>
    </>
  )
}
