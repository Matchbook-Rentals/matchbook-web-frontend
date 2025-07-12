'use server'

import prisma from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server';

const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

export const getFirstListingInCreation = async (): Promise<{ id: string } | null> => {
  try {
    const userId = await checkAuth();

    const listingInCreation = await prisma.listingInCreation.findFirst({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true
      }
    });

    return listingInCreation;
  } catch (error) {
    console.error('Error fetching listing in creation:', error);
    return null;
  }
};