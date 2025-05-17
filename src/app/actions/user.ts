'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { currentUser, auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger';

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
      throw new Error('User ID is missing' + clerkUser)
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
    logger.error('Error updating user image', error);
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
    logger.error('Error updating user login timestamp', error);
    return { success: false, error: 'Failed to update login timestamp' }
  }
}

export async function agreeToTerms() {
  const { userId } = auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    throw new Error("Not authenticated");
  }

  // Check if user exists in our database
  const dbUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  // If user doesn't exist, create them first
  if (!dbUser) {
    await createUser();
  }

  // Update the user's agreedToTerms field with the current timestamp
  await prisma.user.update({
    where: { id: userId },
    data: { agreedToTerms: new Date() }
  });

  // Redirect to home page after agreement
  return redirect("/");
}

export async function getAgreedToTerms() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Not authenticated");
  }

  // First check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // If user doesn't exist in our database, create them
  if (!user) {
    await createUser();
    return null; // New user hasn't agreed to terms yet
  }

  return user.agreedToTerms;
}

