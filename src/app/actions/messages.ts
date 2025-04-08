'use server'
import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

export async function createMessage(data: any) {
  try {
    const { userId } = auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const message = await prisma.message.create({
      data: {
        content: data.content || "",
        senderId: userId,
        conversationId: data.conversationId,
        imgUrl: data.imgUrl,
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileType: data.fileType,
        metadata: data.senderRole ? JSON.stringify({
          senderRole: data.senderRole,
          receiverRole: data.receiverRole
        }) : undefined
      },
    });

    return { success: true, message };
  } catch (error) {
    console.error('Error creating message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
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
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}
