"use server";

import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { checkRole } from "@/utils/roles";
import { revalidatePath } from "next/cache";

const CUSTOMER_SUPPORT_USER_ID = "support-user-001";

export async function sendCustomerSupportMessage(ticketId: string, content: string) {
  console.log('📧 sendCustomerSupportMessage called', { ticketId, contentLength: content.length });
  
  try {
    // Check if the current user is an admin
    const { userId: adminUserId } = auth();
    console.log('🔐 Auth check for sendCustomerSupportMessage', { adminUserId: adminUserId || 'NOT_AUTHENTICATED' });
    
    if (!adminUserId || !checkRole('admin')) {
      console.log('❌ sendCustomerSupportMessage: Unauthorized access');
      return { error: "Unauthorized - Admin access required" };
    }

    // Verify the ticket exists
    console.log('🔍 Looking up ticket for message sending', { ticketId });
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    console.log('🎫 Ticket verification result', {
      found: !!ticket,
      hasUser: !!ticket?.userId,
      userId: ticket?.userId,
      userEmail: ticket?.user?.email
    });

    if (!ticket) {
      console.log('❌ sendCustomerSupportMessage: Ticket not found');
      return { error: "Ticket not found" };
    }

    if (!ticket.userId) {
      console.log('❌ sendCustomerSupportMessage: Ticket has no user');
      return { error: "Ticket has no associated user" };
    }

    // Ensure Customer Support user exists
    console.log('👤 Checking Customer Support user exists', { supportUserId: CUSTOMER_SUPPORT_USER_ID });
    const supportUser = await prismadb.user.findUnique({
      where: { id: CUSTOMER_SUPPORT_USER_ID }
    });

    console.log('👤 Customer Support user check', { 
      found: !!supportUser,
      userId: supportUser?.id,
      email: supportUser?.email,
      name: supportUser?.fullName || supportUser?.firstName + ' ' + supportUser?.lastName
    });

    if (!supportUser) {
      console.log('❌ sendCustomerSupportMessage: Customer Support user missing');
      return { error: "Customer Support user not found. Please run the seeding script first." };
    }

    // Create or get conversation for this ticket using Customer Support user
    console.log('💬 Getting/creating Customer Support conversation', { ticketId, ticketUserId: ticket.userId });
    const conversation = await createOrGetTicketConversationForSupport(ticketId, ticket.userId);
    console.log('💬 Conversation result', { 
      conversationId: conversation.id, 
      participantCount: conversation.participants?.length,
      messageCount: conversation.messages?.length 
    });

    // Create the message using Customer Support user as sender
    console.log('📝 Creating message as Customer Support', { 
      conversationId: conversation.id,
      senderId: CUSTOMER_SUPPORT_USER_ID,
      contentLength: content.length
    });
    
    const message = await prismadb.message.create({
      data: {
        content: content,
        senderId: CUSTOMER_SUPPORT_USER_ID,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            imageUrl: true,
            role: true
          }
        }
      }
    });

    console.log('📝 Message created successfully', { 
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.sender?.fullName || message.sender?.firstName
    });

    // Also create a TicketResponse for historical tracking
    console.log('📋 Creating TicketResponse for tracking');
    const ticketResponse = await prismadb.ticketResponse.create({
      data: {
        content: content,
        ticketId: ticketId,
        isFromStaff: true,
        authorName: "Customer Support",
        authorEmail: "support@matchbook.com"
      }
    });

    console.log('📋 TicketResponse created', { responseId: ticketResponse.id });

    // Update ticket status to "in-progress" if it's currently "open"
    if (ticket.status === "open") {
      console.log('🔄 Updating ticket status to in-progress');
      await prismadb.ticket.update({
        where: { id: ticketId },
        data: { status: "in-progress" }
      });
      console.log('🔄 Ticket status updated');
    }

    console.log('✅ Customer Support message sent successfully:', { 
      ticketId, 
      messageId: message.id, 
      conversationId: conversation.id,
      responseId: ticketResponse.id
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    
    return { 
      success: true, 
      message, 
      ticketResponse,
      conversation 
    };

  } catch (error) {
    console.error("💥 Error in sendCustomerSupportMessage:", error);
    console.error("💥 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      code: error.code,
      cause: error.cause
    });
    return { error: `Failed to send message: ${error.message}` };
  }
}

async function createOrGetTicketConversationForSupport(ticketId: string, ticketUserId: string) {
  console.log('🔧 createOrGetTicketConversationForSupport called', { 
    ticketId, 
    ticketUserId, 
    supportUserId: CUSTOMER_SUPPORT_USER_ID 
  });
  
  try {
    // Check if a conversation already exists between Customer Support and ticket user
    console.log('🔍 Searching for existing Customer Support conversation');
    const existingConversation = await prismadb.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: CUSTOMER_SUPPORT_USER_ID
              }
            }
          },
          {
            participants: {
              some: {
                userId: ticketUserId
              }
            }
          }
        ],
        isGroup: false,
        name: { contains: `Ticket: ${ticketId}` }
      },
      include: {
        participants: {
          include: {
            User: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Get ticket details for conversation name
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      select: { title: true }
    });

    // Use a more robust approach with separate conversation and participant creation
    return await prismadb.$transaction(async (tx) => {
      // Double-check for existing conversation within transaction
      const doubleCheckConversation = await tx.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: CUSTOMER_SUPPORT_USER_ID
                }
              }
            },
            {
              participants: {
                some: {
                  userId: ticketUserId
                }
              }
            }
          ],
          isGroup: false,
          name: { contains: `Ticket: ${ticketId}` }
        },
        include: {
          participants: {
            include: {
              User: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (doubleCheckConversation) {
        return doubleCheckConversation;
      }

      // Create conversation first without participants
      const conversation = await tx.conversation.create({
        data: {
          name: `Ticket: ${ticketId} - ${ticket?.title || 'Support Request'}`,
          isGroup: false
        }
      });

      // Create participants separately with upsert to handle duplicates
      await tx.conversationParticipant.upsert({
        where: {
          userId_conversationId: {
            userId: CUSTOMER_SUPPORT_USER_ID,
            conversationId: conversation.id
          }
        },
        update: {
          role: 'Support'
        },
        create: {
          userId: CUSTOMER_SUPPORT_USER_ID,
          conversationId: conversation.id,
          role: 'Support'
        }
      });

      await tx.conversationParticipant.upsert({
        where: {
          userId_conversationId: {
            userId: ticketUserId,
            conversationId: conversation.id
          }
        },
        update: {
          role: 'User'
        },
        create: {
          userId: ticketUserId,
          conversationId: conversation.id,
          role: 'User'
        }
      });

      // Fetch the complete conversation with participants and messages
      const completeConversation = await tx.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          participants: {
            include: {
              User: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      console.log('Created conversation for ticket with Customer Support:', { 
        ticketId, 
        conversationId: conversation.id 
      });
      
      return completeConversation!;
    });
  } catch (error) {
    console.error("💥 Error in createOrGetTicketConversationForSupport:", error);
    console.error("💥 Conversation creation error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      ticketId,
      ticketUserId,
      supportUserId: CUSTOMER_SUPPORT_USER_ID
    });
    
    // If it's a unique constraint error, try to find the conversation again
    if (error.code === 'P2002') {
      console.log('🔄 Unique constraint error in support conversation, attempting recovery...');
      try {
        const existingConversation = await prismadb.conversation.findFirst({
          where: {
            AND: [
              {
                participants: {
                  some: {
                    userId: CUSTOMER_SUPPORT_USER_ID
                  }
                }
              },
              {
                participants: {
                  some: {
                    userId: ticketUserId
                  }
                }
              }
            ],
            isGroup: false,
            name: { contains: `Ticket: ${ticketId}` }
          },
          include: {
            participants: {
              include: {
                User: true
              }
            },
            messages: {
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });

        if (existingConversation) {
          console.log('✅ Recovery successful: Found existing support conversation');
          return existingConversation;
        } else {
          console.log('❌ Recovery failed: No existing conversation found');
        }
      } catch (recoveryError) {
        console.error('💥 Recovery attempt failed:', recoveryError);
      }
    }
    
    throw error;
  }
}

export async function getTicketConversation(ticketId: string) {
  console.log('🎫 getTicketConversation called', { ticketId });
  
  try {
    // Check if the current user is an admin
    const { userId: adminUserId } = auth();
    console.log('🔐 Admin auth check for getTicketConversation', { adminUserId: adminUserId || 'NOT_AUTHENTICATED' });
    
    if (!adminUserId || !checkRole('admin')) {
      console.log('❌ Unauthorized access attempt');
      return { error: "Unauthorized - Admin access required" };
    }

    // Get the ticket
    console.log('🔍 Looking up ticket for conversation retrieval', { ticketId });
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    console.log('🎫 Ticket found for conversation', { 
      found: !!ticket,
      hasUser: !!ticket?.userId,
      userId: ticket?.userId,
      userEmail: ticket?.user?.email 
    });

    if (!ticket || !ticket.userId) {
      console.log('❌ Ticket not found or has no user');
      return { error: "Ticket not found or has no associated user" };
    }

    // Find existing conversation between Customer Support and ticket user
    console.log('🔍 Searching for Customer Support conversation', { 
      supportUserId: CUSTOMER_SUPPORT_USER_ID,
      ticketUserId: ticket.userId,
      searchCriteria: `name contains "Ticket: ${ticketId}"`
    });
    
    const conversation = await prismadb.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: CUSTOMER_SUPPORT_USER_ID
              }
            }
          },
          {
            participants: {
              some: {
                userId: ticket.userId
              }
            }
          }
        ],
        name: { contains: `Ticket: ${ticketId}` }
      },
      include: {
        participants: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                imageUrl: true,
                role: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                imageUrl: true,
                role: true
              }
            }
          }
        }
      }
    });

    console.log('💬 Customer Support conversation search result', {
      found: !!conversation,
      conversationId: conversation?.id,
      conversationName: conversation?.name,
      participantCount: conversation?.participants?.length,
      messageCount: conversation?.messages?.length,
      participants: conversation?.participants?.map(p => ({
        userId: p.userId,
        role: p.role,
        userName: p.User?.firstName + ' ' + p.User?.lastName,
        userEmail: p.User?.email,
        isCustomerSupport: p.userId === CUSTOMER_SUPPORT_USER_ID
      })),
      messages: conversation?.messages?.map(m => ({
        id: m.id,
        content: m.content.substring(0, 50) + '...',
        senderId: m.senderId,
        senderName: m.sender?.firstName + ' ' + m.sender?.lastName,
        createdAt: m.createdAt
      }))
    });

    return { success: true, conversation, ticket };

  } catch (error) {
    console.error("Error getting ticket conversation:", error);
    return { error: "Failed to get conversation" };
  }
}

export async function debugTicketConversations(ticketId: string) {
  console.log('🐛 DEBUG: Checking all conversations for ticket', { ticketId });
  
  try {
    // Get ticket info
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    if (!ticket) {
      console.log('❌ Ticket not found');
      return;
    }

    console.log('🎫 Ticket info', {
      id: ticket.id,
      title: ticket.title,
      userId: ticket.userId,
      userEmail: ticket.user?.email,
      userName: ticket.user?.firstName + ' ' + ticket.user?.lastName
    });

    // Find ALL conversations that mention this ticket
    const allTicketConversations = await prismadb.conversation.findMany({
      where: {
        name: { contains: `Ticket: ${ticketId}` }
      },
      include: {
        participants: {
          include: {
            User: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log('🔍 All conversations mentioning ticket', {
      count: allTicketConversations.length,
      conversations: allTicketConversations.map(conv => ({
        id: conv.id,
        name: conv.name,
        participantCount: conv.participants.length,
        messageCount: conv.messages.length,
        participants: conv.participants.map(p => ({
          userId: p.userId,
          role: p.role,
          userName: p.User?.firstName + ' ' + p.User?.lastName
        }))
      }))
    });

    // Find conversations involving the ticket user
    if (ticket.userId) {
      const userConversations = await prismadb.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: ticket.userId
            }
          }
        },
        include: {
          participants: {
            include: {
              User: true
            }
          },
          messages: true
        }
      });

      console.log('👤 All conversations involving ticket user', {
        userId: ticket.userId,
        count: userConversations.length,
        conversations: userConversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          participantCount: conv.participants.length,
          messageCount: conv.messages.length,
          relatedToTicket: conv.name?.includes(`Ticket: ${ticketId}`)
        }))
      });
    }

  } catch (error) {
    console.error('Error in debug function:', error);
  }
}