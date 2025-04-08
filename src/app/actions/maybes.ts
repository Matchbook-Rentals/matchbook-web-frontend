'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export const createDbMaybe = async (tripId: string, listingId: string): Promise<string> => {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  console.log('Creating new maybe with trip and listing ->', tripId, listingId)
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    if (trip.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to modify this trip');
    }
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
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  console.log('Deleting maybe with ID ->', maybeId)
  try {
    const maybe = await prisma.maybe.findUnique({
      where: { id: maybeId },
      include: {
        trip: {
          select: { userId: true }
        }
      }
    });
    
    if (!maybe) {
      throw new Error('Maybe not found');
    }
    
    if (maybe.trip.userId !== userId) {
      throw new Error('Unauthorized: You do not have permission to delete this maybe');
    }
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
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      return { success: false, error: 'Trip not found' };
    }
    
    if (trip.userId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to modify this trip' };
    }
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
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }
  
  console.log('Starting optimisticRemoveMaybe with:', { tripId, listingId });
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }
    });
    
    if (!trip) {
      return { success: false, error: 'Trip not found' };
    }
    
    if (trip.userId !== userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to modify this trip' };
    }
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
