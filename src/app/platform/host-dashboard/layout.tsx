import React from "react";
import prisma from "@/lib/prismadb";
import { type Listing } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { HostPropertiesProvider } from "@/contexts/host-properties-provider";

const fetchListingsFromDb = async (): Promise<Listing[]> => {
  "use server";

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
      },
    });
    return listings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error; // Re-throw the error for further handling
  }
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const listings = await fetchListingsFromDb();

  return (
    <HostPropertiesProvider listings={listings}>
      {children}
    </HostPropertiesProvider>
  );
}
