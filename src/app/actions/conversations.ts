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
      participants: true,
      listing: {
        select: {
          title: true
        }
      },
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
      },
      listing: {
        select: {
          title: true
        }
      },
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
        include: { // Include attachments for each message
          attachments: true,
        },
      },
      participants: {
        include: {
          User: true
        }
      },
      listing: {
        select: {
          title: true
        }
      },
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

interface AttachmentDataInput {
  fileUrl: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

export async function createMessage(data: {
  content: string;
  senderRole: string;
  conversationId: string;
  receiverId: string;
  attachments?: AttachmentDataInput[]; 
}) {
  const userId = await checkAuth();

  // Extract the fields that exist in the Prisma schema
  const { content, conversationId, attachments } = data;
  
  // Add logging to track message creation details
  console.log('=== CREATE MESSAGE SERVER ACTION ===');
  console.log('Content:', content ? `"${content}"` : 'empty/null');
  console.log('Has attachments:', attachments && attachments.length > 0 ? attachments.length : 0);
  if (attachments && attachments.length > 0) {
    attachments.forEach((att, index) => {
      console.log(`Attachment ${index + 1}:`, { name: att.fileName, type: att.fileType, size: att.fileSize });
    });
  }
  console.log('------------------------');

  let message;
  // Create the message with only valid fields
  try {
    message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: userId,
        // attachments are now handled via a nested create
        ...(attachments && attachments.length > 0 && {
          attachments: {
            createMany: {
              data: attachments.map((att: AttachmentDataInput) => ({
                url: att.fileUrl, 
                fileName: att.fileName,
                fileKey: att.fileKey,
                fileType: att.fileType,
                fileSize: att.fileSize,
              })),
            },
          },
        }),
      },
      include: {
        attachments: true, 
      },
    });
    
    // Log successful message creation
    console.log('Message created successfully in DB:', { 
      id: message.id, 
      hasContent: !!message.content,
      attachmentCount: message.attachments?.length || 0
    });
  } catch (error) {
    console.error('Error creating message in DB:', error);
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
      content: message.content || "", 
      senderRole: data.senderRole,
      attachments: message.attachments?.map((att: { id: string; url: string; fileName: string | null; fileKey: string | null; fileType: string | null; fileSize: number | null; createdAt: Date; messageId: string; }) => ({ 
        fileUrl: att.url,       
        fileName: att.fileName,
        fileKey: att.fileKey,
        fileType: att.fileType,
        fileSize: att.fileSize
      })) || [],
      timestamp: message.createdAt.toISOString(), 
      type: (message.attachments && message.attachments.length > 0) ? 'file' : 'message',
      deliveryStatus: 'sent', 
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
  
  // First get conversations with basic participant info
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
        take: 50,
        include: {
          attachments: true,
        },
      },
      participants: true,
      listing: {
        select: {
          title: true
        }
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Then manually fetch user data for each participant
  const conversationsWithUsers = await Promise.all(
    conversations.map(async (conversation) => {
      const participantsWithUsers = await Promise.all(
        conversation.participants.map(async (participant) => {
          try {
            const user = await prisma.user.findUnique({
              where: { id: participant.userId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                email: true,
              }
            });
            return {
              ...participant,
              User: user
            };
          } catch (error) {
            // If user doesn't exist, return participant with null user
            return {
              ...participant,
              User: null
            };
          }
        })
      );
      
      return {
        ...conversation,
        participants: participantsWithUsers.filter(p => p.User !== null)
      };
    })
  );
  // Reverse messages for each conversation
  const finalConversations = conversationsWithUsers.map(conversation => ({
    ...conversation,
    messages: conversation.messages.reverse()
  }));
  
  return finalConversations;
}


// Function to find an existing conversation for a specific listing between the current user and the host
export async function findConversationByListingAndUser(listingId: string): Promise<{ conversationId: string | null }> {
  try {
    const userId = await checkAuth();

    // 1. Fetch the listing to get the host's userId
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true } // Select only the host's userId
    });

    if (!listing) {
      console.error(`Listing not found for ID: ${listingId}`);
      return { conversationId: null }; // Or throw an error if preferred
    }
    const hostId = listing.userId;

    // Prevent checking for conversations with oneself if the user is the host
    if (userId === hostId) {
      return { conversationId: null };
    }

    // 2. Find the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId, // Ensure it's for the correct listing
        isGroup: false,       // Ensure it's a direct conversation
        participants: {
          // Check that BOTH the current user and the host are participants
          every: {
            userId: { in: [userId, hostId] }
          }
        }
      },
      select: { id: true } // Only need the conversation ID
    });

    return { conversationId: conversation?.id || null };

  } catch (error) {
    // Handle potential errors (e.g., auth error, database error)
    if (error.message === 'Unauthorized') {
      console.error('Unauthorized attempt to find conversation.');
      // Depending on requirements, you might want to re-throw or return null
      return { conversationId: null };
    }
    console.error('Error finding conversation by listing and user:', error);
    return { conversationId: null }; // Return null on error
  }
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
      },
      listing: {
        select: {
          title: true
        }
      },
    },
    orderBy: {
      updatedAt: 'desc', // Most recent conversations first
    },
    take: limit, // Limit to specified number of conversations
  });
  return conversations;
}

export async function findConversationBetweenUsers(listingId: string, otherUserId: string): Promise<{ conversationId: string | null }> {
  try {
    const userId = await checkAuth();

    // Find the conversation between the current user and the other user for this listing
    const conversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId,
        isGroup: false,
        participants: {
          every: {
            userId: { in: [userId, otherUserId] }
          }
        }
      }
    });

    return { conversationId: conversation?.id || null };

  } catch (error) {
    console.error('Error finding conversation between users:', error);
    return { conversationId: null };
  }
}

export async function createListingConversation(
  listingId: string,
  otherUserId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const userId = await checkAuth();
    
    // Prevent creating conversation with oneself
    if (userId === otherUserId) {
      return { success: false, error: 'Cannot create conversation with yourself' };
    }

    // Check if conversation already exists
    const existing = await findConversationBetweenUsers(listingId, otherUserId);
    if (existing.conversationId) {
      return { success: true, conversationId: existing.conversationId };
    }

    // Determine roles based on who is creating the conversation
    // Get the listing to check who is the host
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    const isCurrentUserHost = userId === listing.userId;
    const creatorRole = isCurrentUserHost ? 'Host' : 'Guest';
    const recipientRole = isCurrentUserHost ? 'Guest' : 'Host';

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        listingId: listingId,
        isGroup: false,
        participants: {
          create: [
            {
              userId: userId,
              role: creatorRole
            },
            {
              userId: otherUserId,
              role: recipientRole
            }
          ]
        }
      }
    });

    revalidatePath('/conversations');
    return { success: true, conversationId: conversation.id };

  } catch (error) {
    console.error('Error creating listing conversation:', error);
    return { success: false, error: 'Failed to create conversation' };
  }
}
