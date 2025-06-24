'use server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { Notification, Prisma } from '@prisma/client'
import { buildNotificationEmailData, getNotificationEmailSubject } from '@/lib/notification-email-config'
import { sendNotificationEmail } from '@/lib/send-notification-email'

// Map notification action types to user preference fields
function getNotificationPreferenceField(actionType: string): string | null {
  const mapping: Record<string, string> = {
    // Messages & Communication
    'message': 'emailNewMessageNotifications',
    'new_conversation': 'emailNewConversationNotifications',
    
    // Applications & Matching
    'view': 'emailApplicationReceivedNotifications', // Application received (for hosts)
    'application_approved': 'emailApplicationApprovedNotifications',
    'application_declined': 'emailApplicationDeclinedNotifications',
    
    // Reviews & Verification  
    'submit_host_review': 'emailSubmitHostReviewNotifications',
    'submit_renter_review': 'emailSubmitRenterReviewNotifications',
    'landlord_info_request': 'emailLandlordInfoRequestNotifications',
    'verification_completed': 'emailVerificationCompletedNotifications',
    
    // Bookings & Stays
    'booking': 'emailBookingCompletedNotifications', // Booking completed
    'booking_canceled': 'emailBookingCanceledNotifications',
    'move_out_upcoming': 'emailMoveOutUpcomingNotifications',
    'move_in_upcoming': 'emailMoveInUpcomingNotifications',
    
    // Payments
    'payment_success': 'emailPaymentSuccessNotifications',
    'payment_failed': 'emailPaymentFailedNotifications',
    
    // External Communications
    'off_platform_host': 'emailOffPlatformHostNotifications',
    
    // Lease Signing
    'lease_signature_required': 'emailApplicationApprovedNotifications', // Reuse existing preference
    'lease_fully_executed': 'emailBookingCompletedNotifications', // Reuse existing preference
  };
  
  return mapping[actionType] || null;
}


type GetNotificationsResponse =
  | { success: true; notifications: Notification[] }
  | { success: false; error: string };

type CreateNotificationResponse =
  | { success: true; notification: Notification }
  | { success: false; error: string };

type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;

type CreateNotificationWithEmailInput = CreateNotificationInput & {
  emailData?: {
    senderName?: string;
    conversationId?: string;
    [key: string]: any;
  };
};

async function checkAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// Email sending has been moved to a secure utility function
// This prevents it from being exposed as a public server action

export async function createNotification(notificationData: CreateNotificationInput): Promise<CreateNotificationResponse>;
export async function createNotification(notificationData: CreateNotificationWithEmailInput): Promise<CreateNotificationResponse>;
export async function createNotification(notificationData: CreateNotificationInput | CreateNotificationWithEmailInput): Promise<CreateNotificationResponse> {
  try {
    // Extract the core notification data (without emailData)
    const dbData: CreateNotificationInput = 'emailData' in notificationData
      ? (() => {
          const { emailData, ...rest } = notificationData;
          return rest;
        })()
      : notificationData;

    const notification = await prisma.notification.create({
      data: dbData,
    })

    // Send notification email if user has enabled this notification type
    const preferenceField = getNotificationPreferenceField(notification.actionType);
    
    if (preferenceField) {
      try {
        // Get user email and all preferences
        const user = await prisma.user.findUnique({
          where: { id: notificationData.userId },
          select: { 
            email: true, 
            firstName: true,
            preferences: true
          }
        });

        // Check if user has enabled this notification type
        const isNotificationEnabled = user?.preferences?.[preferenceField as keyof typeof user.preferences] === true;

        if (user?.email && isNotificationEnabled) {
          // Extract emailData for customization
          const customEmailData = 'emailData' in notificationData ? notificationData.emailData : undefined;
          
          // Build notification-specific email content
          const emailData = buildNotificationEmailData(
            notification.actionType,
            {
              content: notification.content,
              url: notification.url
            },
            user,
            customEmailData
          );

          const subject = getNotificationEmailSubject(notification.actionType);

          const emailResult = await sendNotificationEmail({
            to: user.email,
            subject,
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
    } else {
      // For notification types without preference mapping (like admin notifications), 
      // still send email but log that no preference check was done
      console.log(`No preference mapping found for notification type: ${notification.actionType}. Email will be sent by default.`);
      
      try {
        // Get user email for unmapped notification types
        const user = await prisma.user.findUnique({
          where: { id: notificationData.userId },
          select: { email: true, firstName: true }
        });

        if (user?.email) {
          // Extract emailData for customization
          const customEmailData = 'emailData' in notificationData ? notificationData.emailData : undefined;
          
          // Build notification-specific email content
          const emailData = buildNotificationEmailData(
            notification.actionType,
            {
              content: notification.content,
              url: notification.url
            },
            user,
            customEmailData
          );

          const subject = getNotificationEmailSubject(notification.actionType);

          const emailResult = await sendNotificationEmail({
            to: user.email,
            subject,
            emailData
          });

          if (!emailResult.success) {
            console.error('Failed to send notification email:', emailResult.error);
          }
        }
      } catch (emailError) {
        // Log email error but don't fail notification creation
        console.error('Error sending notification email for unmapped type:', emailError);
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
