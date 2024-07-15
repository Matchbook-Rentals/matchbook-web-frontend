
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
  const clerkUser = await currentUser();

  console.log("CALLED")
  try {
    if (!clerkUser?.id) {
      throw new Error('User ID is missing')
    }

    const dbUser = await prisma?.user.findUnique({
      where: { id: clerkUser.id }
    })

    if (!dbUser) {
      createUser();
      throw new Error('User not found in database')
    }

    if (clerkUser.imageUrl !== dbUser.imageUrl) {
      console.log("NOT SAME")
      let result = await prisma?.user.update({ where: { id: dbUser.id }, data: { imageUrl: clerkUser.imageUrl } })

      console.log(result)
    }

  } catch (error) {
    console.error('Error fetching user data:', error)
    return { error: 'Failed to fetch user data' }
  }
}

