'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Notification, Prisma } from '@prisma/client'
import { Resend } from 'resend'
import NotificationEmailTemplate from '@/components/email-templates/notification-email'
import { NotificationEmailData, SendNotificationEmailInput, SendNotificationEmailResponse } from '@/types'


type GetNotificationsResponse =
  | { success: true; notifications: Notification[] }
  | { success: false; error: string };

type CreateNotificationResponse =
  | { success: true; notification: Notification }
  | { success: false; error: string };

type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;



async function checkAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationEmail({
  to,
  subject,
  emailData
}: SendNotificationEmailInput): Promise<SendNotificationEmailResponse> {
  try {
    // Check authentication
    await checkAuth();

    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'notifications <info@matchbookrentals.com>',
      to: [to],
      subject: subject,
      react: NotificationEmailTemplate(emailData),
    });

    if (error) {
      console.error('Failed to send notification email:', error);
      return { success: false, error: 'Failed to send email' };
    }

    if (!data?.id) {
      console.error('No email ID returned from Resend');
      return { success: false, error: 'Invalid response from email service' };
    }

    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return { success: false, error: 'Failed to send notification email' };
  }
}

export async function createNotification(notificationData: CreateNotificationInput): Promise<CreateNotificationResponse> {
  try {
    const notification = await prisma.notification.create({
      data: notificationData,
    })

    // Send notification email if conditions are met
    if (true) { // TODO: Replace with user settings check
      try {
        // Get user email
        const user = await prisma.user.findUnique({
          where: { id: notificationData.userId },
          select: { email: true, firstName: true }
        });

        if (user?.email) {
          const emailData: NotificationEmailData = {
            companyName: 'Matchbook Rentals',
            headerText: 'New Notification',
            contentTitle: 'You have a new notification',
            contentText: notification.content,
            buttonText: 'View Details',
            buttonUrl: `${process.env.NEXT_PUBLIC_URL}${notification.url}`,
            companyAddress: '123 Main Street',
            companyCity: 'San Francisco, CA 94102',
            companyWebsite: 'matchbookrentals.com'
          };

          const emailResult = await sendNotificationEmail({
            to: user.email,
            subject: 'New Notification - Matchbook Rentals',
            emailData
          });

          if (!emailResult.success) {
            console.error('Failed to send notification email:', emailResult.error);
          }
        }
      } catch (emailError) {
        // Log email error but don't fail notification creation
        console.error('Error sending notification email:', emailError);
      }
    }

    revalidatePath('/notifications')
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
  checkAuth();
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
  checkAuth();
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
