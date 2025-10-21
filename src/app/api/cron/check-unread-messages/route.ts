import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { createNotification } from '@/app/actions/notifications';
import { buildNotificationEmailData } from '@/lib/notification-builders';

/**
 * Truncate text to a maximum length
 * @param content - The text content to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with "..." appended if needed
 */
const truncateText = (content: string, maxLength: number): string => {
  if (!content || content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
};

/**
 * UNREAD MESSAGES NOTIFICATION CRON JOB
 *
 * Documentation: /notifications.md
 * Test Interface: http://localhost:3000/admin/test/notifications
 *
 * BUSINESS LOGIC REQUIREMENTS:
 *
 * 1. MESSAGE DETECTION
 *    - Find messages that have been unread for 2+ minutes
 *    - Only process messages where notificationSentAt is null (not yet notified)
 *    - Exclude messages where the conversation has been deleted (orphaned messages)
 *
 * 2. NOTIFICATION CONSOLIDATION (CRITICAL)
 *    - Send ONE notification per user per conversation (not one per message)
 *    - Example: If a user has 3 unread messages in the same conversation,
 *      consolidate them into a single email notification saying "3 new messages from John"
 *    - This prevents notification spam when multiple messages are sent quickly
 *
 * 3. NEW CONVERSATION DETECTION
 *    - Detect if the unread messages represent a brand NEW conversation
 *    - Check: Are ALL messages in the conversation part of this unread batch?
 *    - If yes → Send "new_conversation" notification with appropriate context
 *    - If no → Send regular "message" notification
 *    - Why: Users need context about what a "new message" is referring to
 *
 * 4. MESSAGE GROUPING LOGIC
 *    - Group messages by: conversationId + recipient userId
 *    - For each group:
 *      a) Count total messages in the conversation (from DB)
 *      b) Count messages in this notification batch
 *      c) Determine if new conversation (totalMessages === batchMessages)
 *      d) Generate appropriate notification content (singular vs plural)
 *      e) Mark ALL messages in the group with notificationSentAt timestamp
 *
 * 5. NOTIFICATION CONTENT RULES
 *    - Message: "You have a new message from {senderName}"
 *    - New conversation: "You have a new conversation with {senderName}"
 *    - Note: Message count is NOT mentioned (cleaner UX, actual content shown in email)
 *
 * 6. EMAIL DATA STRUCTURE
 *    - Include: senderName, conversationId, listingTitle
 *    - Include: messagePreview (combined text of all messages)
 *    - MESSAGE PREVIEW LIMIT: 1000 characters (truncate with "..." if longer)
 *    - Messages are joined with double newlines (\n\n) for readability
 *
 * RELATED FILES:
 * - Notification creation: src/app/actions/notifications.ts
 * - Email templates: src/lib/notification-email-config.ts
 * - Test data generation: src/app/admin/test/notifications/_test-data-actions.ts
 * - Test initiation: src/app/admin/test/notifications/_initiate-actions.ts
 */

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

    // 4. Group messages by conversation + recipient for consolidation
    // Key: "conversationId:recipientUserId"
    // Value: Array of messages for that conversation/recipient pair
    type MessageGroup = {
      conversationId: string;
      recipientUserId: string;
      messages: Array<typeof messagesToNotify[0]>;
      senderId: string; // The sender (should be same for all messages in group)
      senderName: string;
      listingTitle: string;
    };

    const messageGroups = new Map<string, MessageGroup>();

    for (const message of messagesToNotify) {
      if (!message.conversation) {
        console.warn(`Skipping orphaned message ${message.id}: Missing conversation (conversationId: ${message.conversationId})`);
        continue;
      }
      if (!message.sender) {
        console.warn(`Skipping message ${message.id}: Missing sender data.`);
        continue;
      }

      const senderName = message.sender.firstName || message.sender.email || 'Someone';
      const listingTitle = message.conversation.listing?.title || 'Property';
      const participants = message.conversation.participants;

      // Add this message to a group for each recipient (excluding sender)
      for (const participant of participants) {
        if (participant.userId === message.senderId) {
          continue; // Don't notify the sender
        }

        const groupKey = `${message.conversation.id}:${participant.userId}`;

        if (!messageGroups.has(groupKey)) {
          messageGroups.set(groupKey, {
            conversationId: message.conversation.id,
            recipientUserId: participant.userId,
            messages: [],
            senderId: message.senderId,
            senderName: senderName,
            listingTitle: listingTitle,
          });
        }

        messageGroups.get(groupKey)!.messages.push(message);
      }
    }

    console.log(`Cron job: Grouped into ${messageGroups.size} conversation/recipient pairs.`);

    // 5. Create one notification per group (per conversation per recipient)
    const notificationsToCreate: Array<{
      userId: string;
      actionType: string;
      actionId: string;
      content: string;
      url: string;
      senderName: string;
      conversationId: string;
      listingTitle: string;
      messagePreview: string;
    }> = [];
    const messageIdsToUpdate: string[] = [];

    for (const group of messageGroups.values()) {
      // Count total messages in this conversation to detect if it's new
      const totalMessagesInConversation = await prisma.message.count({
        where: { conversationId: group.conversationId }
      });

      const messagesInThisBatch = group.messages.length;
      const isNewConversation = totalMessagesInConversation === messagesInThisBatch;
      const actionType = isNewConversation ? 'new_conversation' : 'message';

      // Generate notification content (no count mention - cleaner UX)
      let content: string;
      if (isNewConversation) {
        content = `You have a new conversation with ${group.senderName}`;
      } else {
        content = `You have a new message from ${group.senderName}`;
      }

      // Combine all messages into a single preview (max 1000 chars)
      const combinedMessageText = group.messages
        .map(m => m.content || 'New message')
        .join('\n\n'); // Join with double newline for separation

      const messagePreview = combinedMessageText.length > 1000
        ? combinedMessageText.substring(0, 997) + '...'
        : combinedMessageText;

      notificationsToCreate.push({
        userId: group.recipientUserId,
        actionType: actionType,
        actionId: isNewConversation ? group.conversationId : group.messages[0].id,
        content: content,
        url: `/app/rent/messages?convo=${group.conversationId}`,
        senderName: group.senderName,
        conversationId: group.conversationId,
        listingTitle: group.listingTitle,
        messagePreview: messagePreview
      });

      // Collect all message IDs from this group for updating notificationSentAt
      messageIdsToUpdate.push(...group.messages.map(m => m.id));
    }

    // 6. Create notifications using our enhanced createNotification function (includes emails)
    // and update messages to mark as processed
    let notificationResults = 0;
    let notificationErrors = 0;

    if (notificationsToCreate.length > 0 && messageIdsToUpdate.length > 0) {
      console.log(`Cron job: Creating ${notificationsToCreate.length} notifications and updating ${messageIdsToUpdate.length} messages.`);

      // Create notifications in parallel for better performance
      // This prevents timeout issues when processing many notifications
      // NOTE: At scale (>100 notifications/run), migrate to dedicated queue service
      // (e.g., Trigger.dev, Inngest, or BullMQ with separate worker process)
      const notificationPromises = notificationsToCreate.map(notificationData =>
        createNotification({
          userId: notificationData.userId,
          content: notificationData.content,
          url: notificationData.url,
          actionType: notificationData.actionType,
          actionId: notificationData.actionId,
          emailData: buildNotificationEmailData(notificationData.actionType, {
            senderName: notificationData.senderName,
            conversationId: notificationData.conversationId,
            listingTitle: notificationData.listingTitle,
            messagePreview: notificationData.messagePreview
          })
        })
          .then(result => ({ success: true, result }))
          .catch(error => ({ success: false, error }))
      );

      const results = await Promise.all(notificationPromises);

      results.forEach(({ success, result, error }) => {
        if (success && result?.success) {
          notificationResults++;
        } else {
          notificationErrors++;
          console.error('Cron job: Failed to create notification:', error || result?.error);
        }
      });

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
