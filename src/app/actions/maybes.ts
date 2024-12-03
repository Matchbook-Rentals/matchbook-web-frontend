'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'

export const createDbMaybe = async (tripId: string, listingId: string): Promise<string> => {
  console.log('Creating new maybe with trip and listing ->', tripId, listingId)
  try {
    // Check if a maybe with the same tripId and listingId already exists
    const existingMaybe = await prisma.maybe.findFirst({
      where: {
        tripId,
        listingId,
      },
    });

    if (existingMaybe) {
      throw new Error('Maybe already exists for this trip and listing');
    }

    // Create the new maybe
    const newMaybe = await prisma.maybe.create({
      data: {
        tripId,
        listingId,
      },
    });

    console.log('Maybe Created', newMaybe)

    // Revalidate the maybes page or any other relevant pages
    revalidatePath('/maybes');

    return newMaybe.id;
  } catch (error) {
    console.error('Error creating maybe:', error);
    throw error;
  }
}

export const deleteDbMaybe = async (maybeId: string) => {
  console.log('Deleting maybe with ID ->', maybeId)
  try {
    // Delete the maybe
    const deletedMaybe = await prisma.maybe.delete({
      where: { id: maybeId },
    });

    console.log('Maybe Deleted', deletedMaybe)

    // Revalidate the maybes page or any other relevant pages
    revalidatePath('/maybes');

    return deletedMaybe;
  } catch (error) {
    console.error('Error deleting maybe:', error);
    throw error;
  }
}

export const optimisticMaybe = async (
  tripId: string,
  listingId: string,
): Promise<{ success: boolean, maybeId?: string, error?: string }> => {
  try {
    // Perform DB operation - createDbMaybe already handles duplicate checking
    console.log('CREATING MAYBE: trip:', tripId);
    const newMaybeId = await createDbMaybe(tripId, listingId);

    return {
      success: true,
      maybeId: newMaybeId
    };
  } catch (error) {
    // If the error is our duplicate check from createDbMaybe
    if (error instanceof Error && error.message.includes('Maybe already exists')) {
      return {
        success: false,
        error: 'Already in maybes'
      };
    }

    // For any other errors
    console.error('Maybe operation failed:', error);
    return {
      success: false,
      error: 'Failed to add to maybes'
    };
  }
}

export const optimisticRemoveMaybe = async (
  tripId: string,
  listingId: string,
): Promise<{ success: boolean, error?: string }> => {
  console.log('Starting optimisticRemoveMaybe with:', { tripId, listingId });
  try {
    const result = await prisma.maybe.deleteMany({
      where: {
        tripId,
        listingId
      }
    });

    console.log('Delete operation result:', result);
    revalidatePath('/maybes');

    return { success: true };
  } catch (error) {
    console.error('Remove maybe operation failed:', error);
    return {
      success: false,
      error: 'Failed to remove from maybes'
    };
  }
}
