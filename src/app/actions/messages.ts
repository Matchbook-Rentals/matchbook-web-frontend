'use server'
import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

export async function createMessage(data: any) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const message = await prisma.message.create({
      data: {
        content: data.content,
        senderId: userId,
        conversationId: data.conversationId, // Requires conversationId in input data
        // receiverId, senderRole, receiverRole are removed as per new schema
      },
    });

    return { success: true, message };
  } catch (error) {
    console.error('Error creating message:', error);
    return { success: false, error: 'Failed to create message' };
  }
}

export async function sendInitialMessage(listingId: string, content: string) {
  'use server'
  try {
    const { userId: senderId } = auth();
    if (!senderId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Fetch the listing to get the host's userId (receiverId) and sender info
    const [listing, sender] = await Promise.all([
      prisma.listing.findUnique({
        where: { id: listingId },
        select: { 
          userId: true, // Select only the host's userId
          title: true // Also get listing title for notification
        }
      }),
      prisma.user.findUnique({
        where: { id: senderId },
        select: {
          firstName: true,
          lastName: true
        }
      })
    ]);

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }
    const receiverId = listing.userId;

    // Prevent users from messaging themselves about their own listing
    if (senderId === receiverId) {
      return { success: false, error: 'Cannot send a message to yourself' };
    }

    // 2. Find or create the conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId,
        participants: {
          every: {
            userId: { in: [senderId, receiverId] }
          }
        }
      }
    });

    const isNewConversation = !conversation;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: listingId,
          participants: {
            create: [
              { userId: senderId },
              { userId: receiverId }
            ]
          }
        }
      });
    }

    // 3. Create the message within the conversation
    const message = await prisma.message.create({
      data: {
        content: content,
        senderId: senderId,
        conversationId: conversation.id,
        // receiverId, senderRole, receiverRole are removed as per new schema
      },
    });

    // 4. New conversation notifications are now handled by check-unread-messages cron
    // This ensures consistent notification timing and prevents duplicates
    // The cron detects first messages and sends new_conversation notifications after 2 minutes
    /*
    // DISABLED: Immediate notification creation
    // Let check-unread-messages cron handle ALL message notifications
    if (isNewConversation) {
      const { createNotification } = await import('@/app/actions/notifications');
      const senderName = sender?.firstName || 'A user';

      try {
        await createNotification({
          userId: receiverId,
          actionType: 'new_conversation',
          actionId: conversation.id,
          content: `You have a new conversation with ${senderName}`,
          url: `/app/host/messages?convo=${conversation.id}`,
          emailData: {
            senderName: senderName,
            messagePreview: content.substring(0, 200),
            conversationId: conversation.id,
            listingTitle: listing.title || 'your property'
          }
        });
      } catch (notificationError) {
        console.error('Failed to create new conversation notification:', notificationError);
        // Don't fail the message send if notification fails
      }
    }
    */

    // TODO: Optionally trigger WebSocket event here to notify receiver

    return { success: true, message, conversationId: conversation.id };

  } catch (error) {
    console.error('Error sending initial message:', error);
    // Check if error is a Prisma known request error (e.g., unique constraint violation)
    if (error.code === 'P2002') {
       return { success: false, error: 'A conversation for this listing between these users might already exist or failed creation.' };
    }
    return { success: false, error: 'Failed to send initial message' };
  }
}

export async function sendHostMessage(listingId: string, guestUserId: string, content: string) {
  'use server'
  try {
    const { userId: senderId } = auth();
    if (!senderId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Verify the sender is the host of the listing and get sender info
    const [listing, sender, receiver] = await Promise.all([
      prisma.listing.findUnique({
        where: { id: listingId },
        select: { 
          userId: true,
          title: true // Get listing title for notification
        }
      }),
      prisma.user.findUnique({
        where: { id: senderId },
        select: {
          firstName: true,
          lastName: true
        }
      }),
      prisma.user.findUnique({
        where: { id: guestUserId },
        select: {
          firstName: true
        }
      })
    ]);

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    if (listing.userId !== senderId) {
      return { success: false, error: 'You are not the host of this listing' };
    }

    const receiverId = guestUserId;

    // Prevent users from messaging themselves
    if (senderId === receiverId) {
      return { success: false, error: 'Cannot send a message to yourself' };
    }

    // 2. Find or create the conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId,
        participants: {
          every: {
            userId: { in: [senderId, receiverId] }
          }
        }
      }
    });

    const isNewConversation = !conversation;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: listingId,
          participants: {
            create: [
              { userId: senderId },
              { userId: receiverId }
            ]
          }
        }
      });
    }

    // 3. Create the message within the conversation
    const message = await prisma.message.create({
      data: {
        content: content,
        senderId: senderId,
        conversationId: conversation.id,
      },
    });

    // 4. If this is a new conversation, create a notification for the guest
    if (isNewConversation) {
      const { createNotification } = await import('@/app/actions/notifications');
      const senderName = sender?.firstName || 'The host';
      
      try {
        await createNotification({
          userId: receiverId,
          actionType: 'new_conversation',
          actionId: conversation.id,
          content: `You have a new conversation with ${senderName}`,
          url: `/app/rent/messages?convo=${conversation.id}`,
          emailData: {
            senderName: senderName,
            messagePreview: content.substring(0, 200),
            conversationId: conversation.id,
            listingTitle: listing.title || 'a property'
          }
        });
      } catch (notificationError) {
        console.error('Failed to create new conversation notification:', notificationError);
        // Don't fail the message send if notification fails
      }
    }

    return { success: true, message, conversationId: conversation.id };

  } catch (error) {
    console.error('Error sending host message:', error);
    if (error.code === 'P2002') {
       return { success: false, error: 'A conversation for this listing between these users might already exist or failed creation.' };
    }
    return { success: false, error: 'Failed to send message' };
  }
}

// --- Start Updated markMessagesAsReadByTimestamp ---
export async function markMessagesAsReadByTimestamp(conversationId: string, timestamp: Date) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };
    if (!conversationId) return { success: false, error: 'Conversation ID is required' };

    // Optional: Get the conversation to verify the user is a participant
    // This check is good practice but might be omitted if performance is critical
    // and authorization is handled elsewhere.
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: { select: { userId: true } } } // Select only participant IDs
    });

    if (!conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return { success: false, error: 'Unauthorized access to conversation' };
    }

    // Find the IDs of messages to update first
    const messagesToUpdate = await prisma.message.findMany({
       where: {
         conversationId: conversationId,
         senderId: { not: userId },
         createdAt: { lte: timestamp },
         isRead: false
       },
       select: { id: true } // Select only the IDs
    });

    const messageIdsToUpdate = messagesToUpdate.map(msg => msg.id);

    if (messageIdsToUpdate.length === 0) {
      console.log(`No unread messages to mark as read in conversation ${conversationId} for user ${userId} up to ${timestamp}`);
      return { success: true, count: 0 };
    }

    // Update messages directly in the database
    const updateResult = await prisma.message.updateMany({
      where: {
        id: { in: messageIdsToUpdate } // Target specific messages by ID
        // Redundant checks removed as we already filtered by ID
        // conversationId: conversationId,
        // senderId: { not: userId },
        // createdAt: { lte: timestamp },
        // isRead: false
      },
      data: {
        isRead: true,
        //readAt: new Date() // Set the read timestamp
      }
    });

    console.log(`Marked ${updateResult.count} messages as read in conversation ${conversationId} for user ${userId}`);

    // --- TODO: Delete related notifications ---
    // When a message is marked as read, any pending 'unread_message' notifications
    // related to this conversation for this user should ideally be marked as read or deleted.
    // This prevents the user from seeing a notification for a message they've already seen.
    /*
    if (updateResult.count > 0) {
      try {
        const deletedNotifications = await prisma.notification.deleteMany({
          where: {
            userId: userId,
            relatedId: conversationId, // Assuming relatedId stores conversationId for message notifications
            type: 'unread_message',    // Make sure this matches the type used by the cron job
            isRead: false              // Only delete/update unread notifications
          }
        });
        console.log(`Deleted ${deletedNotifications.count} related unread_message notifications for user ${userId} in conversation ${conversationId}`);
        // Alternatively, you might want to mark them as read instead of deleting:
        // await prisma.notification.updateMany({ where: {...}, data: { isRead: true } });
      } catch (notificationError) {
        console.error('Error deleting/updating related notifications:', notificationError);
        // Decide if this error should affect the overall success status
      }
    }
    */
    // --- End TODO ---


    // We are no longer creating MessageRead records here for this specific action.

    return { success: true, count: updateResult.count };

  } catch (error) {
    console.error('Error marking messages as read by timestamp:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}
// --- End Updated markMessagesAsReadByTimestamp ---
