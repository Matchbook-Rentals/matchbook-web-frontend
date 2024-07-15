'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Notification, Prisma } from '@prisma/client'


type GetNotificationsResponse = 
  | { success: true; notifications: Notification[] }
  | { success: false; error: string };

type CreateNotificationResponse = 
  | { success: true; notification: Notification }
  | { success: false; error: string };

export async function createNotification(userId: string, content: string, url: string, actionType: string, actionId: string): Promise<CreateNotificationResponse> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        content,
        url,
        actionType,
        actionId,
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

export async function updateNotification(
  notificationId: string,
  data: Partial<Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Notification> {
  try {
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: data,
    });
    return updatedNotification;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      if (error.code === 'P2025') {
        throw new Error('Notification not found');
      }
    }
    // Handle any other errors
    console.error('Error updating notification:', error);
    throw new Error('Failed to update notification');
  }
}

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Notification not found' };
      }
    }
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}
