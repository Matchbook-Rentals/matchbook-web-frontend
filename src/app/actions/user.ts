'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { currentUser, auth } from '@clerk/nextjs/server'

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

export async function agreeToTerms() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Not authenticated");
  }

  // Update the user's agreedToTerms field with the current timestamp
  await prisma.user.update({
    where: { id: userId },
    data: { agreedToTerms: new Date() }
  });

  return { success: true };
}

export async function getAgreedToTerms() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agreedToTerms: true }
  });

  return user?.agreedToTerms;
}

