'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'

export async function createNotification(userId: string, content: string, url: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        content,
        url,
      },
    })

    revalidatePath('/notifications') // Adjust the path as needed

    return { success: true, notification }
  } catch (error) {
    console.error('Failed to create notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}
