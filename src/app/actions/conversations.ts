'use server';
import prisma from '@/lib/prismadb';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server'

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

// Conversation CRUD operations

export async function createConversation(
  recipientEmail: string,
  creatorRole: string = 'Host',
  recipientRole: string = 'Tenant'
) {
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

  // Create a new conversation with participants and assign roles
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          {
            userId: authUserId,
            role: creatorRole
          },
          {
            userId: recipient.id,
            role: recipientRole
          }
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
      messages: {
        orderBy: {
          createdAt: 'desc', // Get messages in reverse chronological order
        },
        take: 50, // Limit to the most recent 50 messages
      },
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
  fileName?: string;
  fileKey?: string;
  fileType?: string;
}) {
  const userId = await checkAuth();

  if (!data.conversationId) {
    throw new Error('Conversation ID is required');
  }
  
  if (!data.receiverId) {
    throw new Error('Receiver ID is required');
  }
  
  const isParticipant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: data.conversationId,
      userId
    }
  });
  
  if (!isParticipant) {
    throw new Error('Unauthorized: User is not a participant in this conversation');
  }

  // Extract the fields that exist in the Prisma schema
  const { content, conversationId, imgUrl, fileName, fileKey, fileType } = data;
  
  // Add logging to track message creation details
  console.log('=== CREATE MESSAGE DEBUG ===');
  console.log('Content:', content ? `"${content}"` : 'empty/null');
  console.log('Has attachment:', !!imgUrl);
  console.log('File details:', { fileName, fileType });
  console.log('------------------------');

  let message;
  // Create the message with only valid fields
  try {
    message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: userId,
        imgUrl,
        fileName,
        fileKey,
        fileType,
      },
    });
    
    // Log successful message creation
    console.log('Message created successfully:', { 
      id: message.id, 
      hasContent: !!message.content,
      hasAttachment: !!message.imgUrl
    });
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }

  // Send message to Go server WebSocket for real-time updates
  try {
    // Convert message to a payload object compatible with the WebSocket server
    const goServerPayload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: data.receiverId,
      content: message.content || "", // Ensure content is at least an empty string
      senderRole: data.senderRole,
      imgUrl: message.imgUrl,
      // Include other fields that are now supported by the WebSocket server
      fileName: message.fileName,
      fileKey: message.fileKey,
      fileType: message.fileType,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
    
    console.log('Sending to Go server with payload:', goServerPayload);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_GO_SERVER_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goServerPayload),
    });

    if (!response.ok) {
      console.error('Failed to send message to real-time server:', await response.text());
    } else {
      console.log('Message sent to real-time server successfully');
    }
  } catch (error) {
    console.error('Error sending message to real-time server:', error);
    // Continue even if the real-time sending fails
  }

  console.log('=== MESSAGE CREATION COMPLETE ===');
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
          createdAt: 'desc', // Get messages in reverse chronological order
        },
        take: 50, // Limit to the most recent 50 messages
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

// Function to get the most recent conversations with full message history
export async function getRecentConversationsWithMessages(limit: number = 15) {
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
          createdAt: 'desc', // Get messages in reverse chronological order
        },
        take: 50, // Limit to most recent 50 messages per conversation
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
      updatedAt: 'desc', // Most recent conversations first
    },
    take: limit, // Limit to specified number of conversations
  });
  return conversations;
}
