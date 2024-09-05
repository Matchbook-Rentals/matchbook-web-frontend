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
  const participant2Id = await prisma.user.findUnique({
    where: {
      email: recipientEmail,
    },
  });
  if (!participant2Id) {
    throw new Error('Recipient not found');
  }
  console.log('Participant 2 ID:', participant2Id);
  const conversation = await prisma.conversation.upsert({
    where: {
      participant1Id_participant2Id: {
        participant1Id: authUserId,
        participant2Id: participant2Id?.id,
      },
    },
    update: {},
    create: {
      participant1Id: authUserId,
      participant2Id: participant2Id?.id,
    },
  });
  console.log('Conversation created:', conversation);
  revalidatePath('/conversations');
  return conversation;
}

export async function getConversation(id: string) {
  await checkAuth();
  return await prisma.conversation.findUnique({
    where: { id },
    include: { messages: true },
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
}) {
  const userId = await checkAuth();
  const message = await prisma.message.create({
    data: {
      ...data,
      senderId: userId,
    },
  });
  sendMessageToConnection(message);
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
      OR: [
        { participant1Id: authUserId },
        { participant2Id: authUserId },
      ],
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  return conversations;
}
