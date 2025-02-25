'use server';
import prisma from '@/lib/prismadb';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server'
import { sendMessageToConnection } from '../api/sse/route';

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// Conversation CRUD operations

export async function createConversation(recipientEmail: string) {
  console.log('Creating conversation with recipient email:', recipientEmail);
  const authUserId = await checkAuth();
  const recipient = await prisma.user.findUnique({
    where: {
      email: recipientEmail,
    },
  });
  if (!recipient) {
    throw new Error('Recipient not found');
  }
  console.log('Participant 2 ID:', recipient);

  // Check if a conversation already exists between these users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: {
              userId: authUserId
            }
          }
        },
        {
          participants: {
            some: {
              userId: recipient.id
            }
          }
        }
      ],
      isGroup: false,
    },
    include: {
      participants: true
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create a new conversation with participants
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: authUserId },
          { userId: recipient.id }
        ]
      }
    },
    include: {
      participants: {
        include: {
          User: true
        }
      }
    }
  });

  console.log('Conversation created:', conversation);
  revalidatePath('/conversations');
  return conversation;
}

export async function getConversation(id: string) {
  await checkAuth();
  return await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: true,
      participants: {
        include: {
          User: true
        }
      }
    },
  });
}

export async function updateConversation(id: string, data: { participant1Id?: string; participant2Id?: string }) {
  await checkAuth();
  const conversation = await prisma.conversation.update({
    where: { id },
    data,
  });
  revalidatePath('/conversations');
  return conversation;
}

export async function deleteConversation(id: string) {
  await checkAuth();

  // First delete all messages associated with the conversation
  await prisma.message.deleteMany({
    where: { conversationId: id },
  });

  // Then delete all participants associated with the conversation
  await prisma.conversationParticipant.deleteMany({
    where: { conversationId: id },
  });

  // Finally delete the conversation
  await prisma.conversation.delete({
    where: { id },
  });

  revalidatePath('/conversations');
}

// Message CRUD operations

export async function createMessage(data: {
  content: string;
  senderRole: string;
  conversationId: string;
  receiverId: string;
  imgUrl?: string;
}) {
  const userId = await checkAuth();

  // Extract the fields that exist in the Prisma schema
  const { content, conversationId, imgUrl } = data;

  // Create the message with only valid fields
  const message = await prisma.message.create({
    data: {
      content,
      conversationId,
      senderId: userId,
      imgUrl,
    },
  });

  // Send message to Go server for real-time updates
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_GO_SERVER_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: data.receiverId,
        content: message.content,
        senderRole: data.senderRole,
        imgUrl: message.imgUrl,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }),
    });

    if (!response.ok) {
      console.error('Failed to send message to real-time server:', await response.text());
    }
  } catch (error) {
    console.error('Error sending message to real-time server:', error);
    // Continue even if the real-time sending fails
  }

  revalidatePath('/conversations');
  return message;
}

export async function getMessage(id: string) {
  await checkAuth();
  return await prisma.message.findUnique({
    where: { id },
  });
}

export async function updateMessage(id: string, content: string) {
  await checkAuth();
  const message = await prisma.message.update({
    where: { id },
    data: { content },
  });
  revalidatePath('/conversations');
  return message;
}

export async function deleteMessage(id: string) {
  await checkAuth();
  await prisma.message.delete({
    where: { id },
  });
  revalidatePath('/conversations');
}

// New function to get all conversations for a user
export async function getAllConversations() {
  const authUserId = await checkAuth();
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: authUserId
        }
      }
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
      participants: {
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  return conversations;
}
