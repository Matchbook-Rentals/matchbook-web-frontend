'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

// Assuming Notification type is defined elsewhere
// If not, you should define it here

type Notification = {
  id: string;
  userId: string;
  content: string;
  url: string;
  createdAt: Date;
  // Add other fields as necessary
}

type GetNotificationsResponse = 
  | { success: true; notifications: Notification[] }
  | { success: false; error: string };

type CreateNotificationResponse = 
  | { success: true; notification: Notification }
  | { success: false; error: string };

export async function createNotification(userId: string, content: string, url: string): Promise<CreateNotificationResponse> {
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

export async function getNotifications(): Promise<GetNotificationsResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, notifications }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}
