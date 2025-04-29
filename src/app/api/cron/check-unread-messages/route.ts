import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { NotificationType } from '@prisma/client'; // Assuming NotificationType enum exists

// Define the expected structure for a notification input
// This should align with the fields defined in your `prisma.schema` for Notification
// Adjust based on your actual Notification model structure
interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  content: string;
  relatedId?: string; // e.g., conversationId or messageId
  isRead?: boolean;
}

export async function GET(request: Request) {
  // 1. Authorization Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Checking for unread messages...');

  try {
    // 2. Calculate timestamp for 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // 3. Find messages older than 2 mins, unread, notification not sent
    const messagesToNotify = await prisma.message.findMany({
      where: {
        isRead: false,
        notificationSentAt: null,
        createdAt: {
          lte: twoMinutesAgo,
        },
      },
      include: {
        conversation: {
          select: {
            id: true,
            participants: {
              select: {
                userId: true,
              },
            },
          },
        },
        sender: { // Include sender info for notification content
          select: {
            id: true,
            firstName: true, // Assuming you have firstName
            email: true,     // Or email as fallback
          }
        }
      },
    });

    if (messagesToNotify.length === 0) {
      console.log('Cron job: No new unread messages found requiring notification.');
      return NextResponse.json({ success: true, message: 'No messages to notify' });
    }

    console.log(`Cron job: Found ${messagesToNotify.length} messages to process for notifications.`);

    const notificationsToCreate: CreateNotificationInput[] = [];
    const messageIdsToUpdate: string[] = [];

    // 4. & 5. Determine recipients and prepare notifications
    for (const message of messagesToNotify) {
      if (!message.conversation || !message.sender) {
        console.warn(`Skipping message ${message.id}: Missing conversation or sender data.`);
        continue;
      }

      const senderName = message.sender.firstName || message.sender.email || 'Someone';
      const participants = message.conversation.participants;

      for (const participant of participants) {
        // Don't notify the sender
        if (participant.userId === message.senderId) {
          continue;
        }

        // Prepare notification data for this recipient
        notificationsToCreate.push({
          userId: participant.userId,
          type: NotificationType.unread_message, // Use the enum value
          content: `You have a new message from ${senderName}.`, // Simple content
          relatedId: message.conversation.id, // Link notification to the conversation
          isRead: false, // Notifications start as unread
        });
      }
      // Add message ID to list for updating notificationSentAt status
      messageIdsToUpdate.push(message.id);
    }

    // Remove duplicates before creating notifications (in case multiple messages trigger for same user/convo)
    // Note: This simple approach creates one notification per *message* per recipient.
    // A more advanced approach could group notifications per conversation.
    const uniqueNotifications = Array.from(new Map(notificationsToCreate.map(n => [`${n.userId}-${n.relatedId}-${n.content}`, n])).values());


    // 6. Create notifications and update messages within a transaction
    if (uniqueNotifications.length > 0 && messageIdsToUpdate.length > 0) {
      console.log(`Cron job: Creating ${uniqueNotifications.length} notifications and updating ${messageIdsToUpdate.length} messages.`);
      try {
        const [notificationResult, messageUpdateResult] = await prisma.$transaction([
          prisma.notification.createMany({
            data: uniqueNotifications,
            skipDuplicates: true, // Avoid errors if a similar notification was somehow created concurrently
          }),
          prisma.message.updateMany({
            where: {
              id: {
                in: messageIdsToUpdate,
              },
            },
            data: {
              notificationSentAt: new Date(),
            },
          }),
        ]);
        console.log(`Cron job: Created ${notificationResult.count} notifications. Updated ${messageUpdateResult.count} messages.`);
      } catch (transactionError) {
         console.error('Cron job: Transaction failed!', transactionError);
         // Decide how to handle partial failures if necessary
         return NextResponse.json({ success: false, error: 'Transaction failed during notification creation/message update' }, { status: 500 });
      }
    } else {
       console.log('Cron job: No valid notifications to create or messages to update after processing.');
    }

    return NextResponse.json({
      success: true,
      processedMessages: messageIdsToUpdate.length,
      createdNotifications: uniqueNotifications.length, // Use unique count here
    });

  } catch (error) {
    console.error('Cron job: Error checking unread messages:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
