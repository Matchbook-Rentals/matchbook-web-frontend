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

    // 1. Fetch the listing to get the host's userId (receiverId)
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true } // Select only the host's userId
    });

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

export async function markMessagesAsReadByTimestamp(conversationId: string, timestamp: Date) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };
    if (!conversationId) return { success: false, error: 'Conversation ID is required' };

    // Get the conversation to verify the user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return { success: false, error: 'Conversation not found' };
    }

    // Verify user is a participant in this conversation
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return { success: false, error: 'Unauthorized access to conversation' };
    }

    // Find messages sent by others before the timestamp that the user hasn't read yet
    const messagesToMark = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId }, // Messages NOT sent by the current user
        createdAt: { lte: timestamp }, // Before or at the timestamp
        readBy: { // Check if a MessageRead record for this user DOES NOT exist
          none: {
            userId: userId
          }
        }
      },
      select: { id: true } // Only need the IDs
    });

    if (messagesToMark.length === 0) {
      return { success: true, count: 0 }; // No new messages to mark as read
    }

    // Prepare data for creating MessageRead records
    const dataToCreate = messagesToMark.map(message => ({
      messageId: message.id,
      userId: userId
      // readAt defaults to now() in the schema
    }));

    // Create MessageRead records for the found messages
    const createResult = await prisma.messageRead.createMany({
      data: dataToCreate,
      skipDuplicates: true // Avoid errors if a read record was somehow created concurrently
    });

    return { success: true, count: createResult.count };

  } catch (error) {
    console.error('Error marking messages as read by timestamp:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}
