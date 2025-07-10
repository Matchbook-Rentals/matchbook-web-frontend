'use server';

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";

export const fetchListingsFromDb = async () => {
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
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return listings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error; // Re-throw the error for further handling
  }
  return [];
};

export const revalidateHostDashboard = async () => {
  revalidatePath("/app/host-dashboard");
  return { revalidated: true };
};