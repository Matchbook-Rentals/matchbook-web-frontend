'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { TripAndMatches } from '@/types';

export const createDbDislike = async (tripId: string, listingId: string): Promise<string> => {
  console.log('Creating new dislike with trip and listing ->', tripId, listingId)
  try {
    // Create the new dislike
    const newDislike = await prisma.dislike.create({
      data: {
        tripId,
        listingId,
      },
    });

    console.log('Dislike Created', newDislike)

    // Revalidate the dislikes page or any other relevant pages
    revalidatePath('/dislikes');

    return newDislike.id;
  } catch (error) {
    console.error('Error creating dislike:', error);
    throw error;
  }
}

export const deleteDbDislike = async (dislikeId: string) => {
  console.log('Deleting favorite with ID ->', dislikeId)
  try {
    // Delete the favorite
    const deletedDislike = await prisma.dislike.delete({
      where: { id: dislikeId },
    });

    console.log('Favorite Deleted', deletedDislike)

    // Revalidate the favorites page or any other relevant pages
    revalidatePath('/favorites');

    return deletedDislike;
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw error;
  }
}

export const optimisticDislike = async (
  tripId: string,
  listingId: string,
  currentTrip: TripAndMatches
): Promise<{ success: boolean, dislikeId?: string, error?: string }> => {
  try {
    // Optimistic check for duplicate
    const existingDislike = currentTrip.dislikes.find(
      dislike => dislike.listingId === listingId && dislike.tripId === tripId
    );

    if (existingDislike) {
      return { success: false, error: 'Already disliked' };
    }

    // Perform DB operation
    const newDislikeId = await createDbDislike(tripId, listingId);

    return {
      success: true,
      dislikeId: newDislikeId
    };
  } catch (error) {
    console.error('Dislike operation failed:', error);
    return {
      success: false,
      error: 'Failed to create dislike'
    };
  }
}