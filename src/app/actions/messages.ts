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
    return { success: false, error: error.message };
  }
}
