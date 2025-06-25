import React from "react";
import prisma from "@/lib/prismadb";
import { currentUser, User, auth } from "@clerk/nextjs/server";
import { HostPropertiesProvider } from "@/contexts/host-properties-provider";
import { ListingAndImages, RequestWithUser } from "@/types";
import { checkHostAccess } from "@/utils/roles";
import { redirect } from "next/navigation";

const fetchListingsFromDb = async (): Promise<ListingAndImages[]> => {
  'use server';

  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("User not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: clerkUser.id,
      },
      include: {
        boldSignTemplates: true,
      },
    });

    const listings = await prisma.listing.findMany({
      where: {
        userId: user!.id,
      },
      include: {
        bedrooms: true,
        listingImages: true,
        housingRequests: true,
        unavailablePeriods: true,
        bookings: true,
        monthlyPricing: true,
      },
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
    });
    const updatedListings = listings.map((listing) => {
      listing.user = user;
      return listing;
    });
    return updatedListings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error; // Re-throw the error for further handling
  }
};

export async function getListingHousingRequests(listingId: string): Promise<RequestWithUser[]> {
  'use server'

  try {
    const housingRequests = await prisma.housingRequest.findMany({
      where: {
        listingId: listingId,
      },
      include: {
        user: {
          include: {
            applications: {
              where: {
                isDefault: true,
              },
              include: {
                verificationImages: true,
                incomes: true,
                identifications: true,
              },
            },
          },
        },
        trip: true,
      },
    });

    return housingRequests;
  } catch (error) {
    console.error('Error fetching housing requests:', error);
    throw new Error('Failed to fetch housing requests');
  }
}


async function HostDashboardDataWrapper({ children }: { children: React.ReactNode }) {
  const listings = await fetchListingsFromDb();
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return (
    <HostPropertiesProvider listings={listings} getListingHousingRequests={getListingHousingRequests}>
      {children}
    </HostPropertiesProvider>
  );
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Check for host access at layout level for stronger protection
  const hasHostAccess = await checkHostAccess()
  
  if (!hasHostAccess) {
    redirect('/unauthorized')
  }

  return (
    <React.Suspense fallback={
      <div className="md:w-4/5 w-[95%] mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        <p className="text-gray-600 text-lg">Loading your properties...</p>
      </div>
    }>
      <HostDashboardDataWrapper>
        {children}
      </HostDashboardDataWrapper>
    </React.Suspense>
  );
}
