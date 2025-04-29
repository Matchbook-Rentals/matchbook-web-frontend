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
        receiverId: data.receiverId,
        senderRole: data.senderRole,
        receiverRole: data.receiverRole,
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
        receiverId: receiverId, // Explicitly set receiverId for clarity, though conversation implies it
        conversationId: conversation.id,
        // Assuming default roles or determine based on context if needed
        // senderRole: 'GUEST', // Example role
        // receiverRole: 'HOST', // Example role
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

    // Mark messages from other users as read
    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        NOT: { senderId: userId }, // Messages NOT sent by the current user
        isRead: false,
        createdAt: { lte: timestamp } // Only mark messages created before or at this timestamp
      },
      data: {
        isRead: true
      }
    });

    return { success: true, count: updateResult.count };
  } catch (error) {
    console.error('Error marking messages as read by timestamp:', error);
    console.error('Error marking messages as read by timestamp:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}
