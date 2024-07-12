'use server'

import prisma from '@/lib/prismadb'

export async function getHousingRequestsByListingId(listingId: string) {
  try {
    const housingRequests = await prisma.housingRequest.findMany({
      where: {
        listingId: listingId,
      },
      include: {
        user: true,
      },
    });

    return housingRequests;
  } catch (error) {
    console.error('Error fetching housing requests:', error);
    throw new Error('Failed to fetch housing requests');
  }
}
