import React from "react";
import prisma from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { HostPropertiesProvider } from "@/contexts/host-properties-provider";
import { ListingAndImages, RequestWithUser } from "@/types";

const fetchListingsFromDb = async (): Promise<ListingAndImages[]> => {
  'use server';

  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const listings = await prisma.listing.findMany({
      where: {
        userId: user.id,
      },
      include: {
        bedrooms: true,
        listingImages: true,
        housingRequests: true,
      },
    });
    return listings;
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


export default async function Layout({ children }: { children: React.ReactNode }) {
  const listings = await fetchListingsFromDb();

  return (
    <HostPropertiesProvider listings={listings} getListingHousingRequests={getListingHousingRequests}>
      {children}
    </HostPropertiesProvider>
  );
}