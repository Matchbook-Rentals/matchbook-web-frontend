import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { createNotification } from '@/app/actions/notifications';

// Define the expected structure for a notification input
// This should align with the fields defined in your `prisma.schema` for Notification
// Adjust based on your actual Notification model structure

export async function GET(request: Request) {
  // 1. Authorization Check
  const authHeader = request.headers.get('authorization');
  console.log('Check unread messages - Received auth header:', authHeader);
  console.log('Check unread messages - Expected auth header:', `Bearer ${process.env.CRON_SECRET}`);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Checking for unread messages...');

  // TODO: Future improvements:
  // 1. Add cleanup script to remove orphaned messages where conversationId references non-existent conversations
  // 2. Update Prisma schema to add `onDelete: Cascade` to Message->Conversation relation to prevent future orphans

  try {
    // 2. Calculate timestamp for 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // 3. Find messages older than 2 mins, unread, notification not sent
    // Use a safer query that only includes messages with existing conversations
    const messagesToNotify = await prisma.message.findMany({
      where: {
        isRead: false,
        notificationSentAt: null,
        createdAt: {
          lte: twoMinutesAgo,
        },
        conversationId: {
          in: (
            await prisma.conversation.findMany({
              select: { id: true }
            })
          ).map(c => c.id)
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
            listing: {
              select: {
                title: true,
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

    const notificationsToCreate: Array<{
      userId: string;
      actionType: string;
      actionId: string;
      content: string;
      url: string;
      senderName: string;
      conversationId: string;
      listingTitle: string;
      messageContent: string;
    }> = [];
    const messageIdsToUpdate: string[] = [];

    // 4. & 5. Determine recipients and prepare notifications
    for (const message of messagesToNotify) {
      if (!message.conversation) {
        console.warn(`Skipping orphaned message ${message.id}: Missing conversation (conversationId: ${message.conversationId})`);
        // TODO: Add cleanup script to remove orphaned messages where conversationId references non-existent conversations
        continue;
      }
      if (!message.sender) {
        console.warn(`Skipping message ${message.id}: Missing sender data.`);
        continue;
      }

      const senderName = message.sender.firstName || message.sender.email || 'Someone';
      const listingTitle = message.conversation.listing?.title || 'Property';
      const participants = message.conversation.participants;

      for (const participant of participants) {
        // Don't notify the sender
        if (participant.userId === message.senderId) {
          continue;
        }

        // Prepare notification data for this recipient
        notificationsToCreate.push({
          userId: participant.userId,
          actionType: 'message', // Use the enum value
          actionId: message.id,
          content: `You have a new message from ${senderName}.`, // Keep informative content for in-app
          url: `/app/messages?convo=${message.conversation.id}`, // Link notification to the conversation
          senderName: senderName, // Add sender name for email customization
          conversationId: message.conversation.id, // Add conversation ID for email URL
          listingTitle: listingTitle, // Add listing title for email
          messageContent: message.content || 'New message' // Actual message content for email
        });
      }
      // Add message ID to list for updating notificationSentAt status
      messageIdsToUpdate.push(message.id);
    }

    // Remove duplicates before creating notifications (in case multiple messages trigger for same user/convo)
    // Note: This simple approach creates one notification per *message* per recipient.
    // A more advanced approach could group notifications per conversation.
    const uniqueNotifications = Array.from(new Map(notificationsToCreate.map(n => [`${n.userId}-${n.content}`, n])).values());

    // 6. Create notifications using our enhanced createNotification function (includes emails)
    // and update messages to mark as processed
    let notificationResults = 0;
    let notificationErrors = 0;

    if (uniqueNotifications.length > 0 && messageIdsToUpdate.length > 0) {
      console.log(`Cron job: Creating ${uniqueNotifications.length} notifications and updating ${messageIdsToUpdate.length} messages.`);

      // Create notifications one by one using our enhanced createNotification function
      // This ensures emails are sent and proper validation is done
      for (const notificationData of uniqueNotifications) {
        try {
          const result = await createNotification({
            userId: notificationData.userId,
            content: notificationData.content,
            url: notificationData.url,
            actionType: notificationData.actionType,
            actionId: notificationData.actionId,
            emailData: {
              senderName: notificationData.senderName,
              conversationId: notificationData.conversationId,
              listingTitle: notificationData.listingTitle,
              messageContent: notificationData.messageContent
            }
          });
          
          if (result.success) {
            notificationResults++;
          } else {
            notificationErrors++;
            console.error('Cron job: Failed to create notification:', result.error);
          }
        } catch (error) {
          notificationErrors++;
          console.error('Cron job: Error creating notification:', error);
        }
      }

      // Update messages to mark notifications as sent (separate transaction)
      try {
        const messageUpdateResult = await prisma.message.updateMany({
          where: {
            id: {
              in: messageIdsToUpdate,
            },
          },
          data: {
            notificationSentAt: new Date(),
          },
        });
        console.log(`Cron job: Created ${notificationResults} notifications (${notificationErrors} errors). Updated ${messageUpdateResult.count} messages.`);
      } catch (messageUpdateError) {
        console.error('Cron job: Failed to update messages:', messageUpdateError);
        return NextResponse.json({ success: false, error: 'Failed to update message notification status' }, { status: 500 });
      }
    } else {
       console.log('Cron job: No valid notifications to create or messages to update after processing.');
    }

    return NextResponse.json({
      success: true,
      processedMessages: messageIdsToUpdate.length,
      createdNotifications: notificationResults || 0,
      notificationErrors: notificationErrors || 0,
    });

  } catch (error) {
    console.error('Cron job: Error checking unread messages:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
