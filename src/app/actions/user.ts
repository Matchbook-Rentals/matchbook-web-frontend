'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { currentUser } from '@clerk/nextjs/server'

export async function createUser() {

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.create({
    data: {
      id: clerkUser.id,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      email: clerkUser?.emailAddresses[0].emailAddress,
      imageUrl: clerkUser?.imageUrl,
    },
  });

  revalidatePath('/user')
  return user;
}


export async function updateUserImage() {
  'use server'

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing')
    }

    const dbUser = await prisma?.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (!dbUser) {
      await createUser();
      return { success: true };
    }

    if (clerkUser.imageUrl !== dbUser.imageUrl) {
      await prisma?.user.update({
        where: { id: dbUser.id },
        data: { imageUrl: clerkUser.imageUrl }
      });
      return { success: true };
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating user image:', error)
    return { success: false, error: 'Failed to update user image' }
  }
}


export async function updateUserLogin(timestamp: Date) {
  'use server'

  const clerkUser = await currentUser();

  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing')
    }
    
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return { success: false, error: 'Invalid timestamp provided' };
    }
    
    const now = new Date();
    if (timestamp > now) {
      return { success: false, error: 'Timestamp cannot be in the future' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (!dbUser) {
      await createUser();
    }

    await prisma.user.update({
      where: { id: clerkUser.id },
      data: { lastLogin: timestamp }
    });

    return { success: true };

  } catch (error) {
    console.error('Error updating user login timestamp:', error)
    return { success: false, error: 'Failed to update login timestamp' }
  }
}

