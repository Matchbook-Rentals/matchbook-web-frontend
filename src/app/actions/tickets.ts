"use server";

import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface CreateTicketParams {
  title: string;
  description: string;
  email: string;
  name?: string;
  category?: string;
  pageUrl?: string;
  userAgent?: string;
}

export async function createTicket(data: CreateTicketParams) {
  try {
    console.log("Creating ticket:", { 
      title: data.title, 
      email: data.email, 
      category: data.category,
      pageUrl: data.pageUrl?.substring(0, 50) + (data.pageUrl && data.pageUrl.length > 50 ? '...' : '')
    });
    
    const { userId } = auth();
    console.log("User ID from auth:", userId || "Not authenticated");
    
    // Debug each required field individually
    if (!data.title) console.log("Missing required field: title");
    if (!data.description) console.log("Missing required field: description");
    if (!data.email) console.log("Missing required field: email");
    
    // Email is always required
    if (!data.title || !data.description || !data.email) {
      console.log("Validation failed - missing required fields");
      return { error: `Missing required fields: ${!data.title ? 'title ' : ''}${!data.description ? 'description ' : ''}${!data.email ? 'email' : ''}`.trim() };
    }

    const ticket = await prismadb.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        email: data.email,
        name: data.name,
        category: data.category,
        priority: "medium", // Default priority
        pageUrl: data.pageUrl,
        userAgent: data.userAgent,
        userId: userId || undefined,
        status: "open",
      },
    });

    console.log("Ticket created successfully:", { id: ticket.id, title: ticket.title });
    revalidatePath("/admin/tickets");
    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { error: "Failed to create ticket" };
  }
}

export async function getTickets(params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}) {
  try {
    const { page = 1, limit = 10, status, category } = params;
    console.log("Fetching tickets with params:", { page, limit, status, category });
    
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const [tickets, total] = await Promise.all([
      prismadb.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
          responses: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prismadb.ticket.count({ where }),
    ]);

    console.log(`Retrieved ${tickets.length} tickets. Total: ${total}`);
    
    return {
      tickets,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return { error: "Failed to fetch tickets" };
  }
}

export async function getUserTickets(userId: string) {
  try {
    console.log("Fetching tickets for user:", userId);
    
    if (!userId) {
      console.log("User ID not provided for getUserTickets");
      return { error: "User ID is required" };
    }

    const tickets = await prismadb.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        responses: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    console.log(`Retrieved ${tickets.length} tickets for user ${userId}`);
    return { tickets };
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return { error: "Failed to fetch tickets" };
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    console.log(`Updating ticket ${ticketId} status to "${status}"`);
    
    const updatedTicket = await prismadb.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
      },
    });

    console.log(`Ticket ${ticketId} status updated successfully`);
    revalidatePath("/admin/tickets");
    return { success: true, ticket: updatedTicket };
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return { error: "Failed to update ticket status" };
  }
}

export async function updateTicketSupportNotes(ticketId: string, supportNotes: string) {
  try {
    console.log(`Updating support notes for ticket ${ticketId}`);
    
    const updatedTicket = await prismadb.ticket.update({
      where: { id: ticketId },
      data: { supportNotes },
    });

    console.log(`Ticket ${ticketId} support notes updated successfully`);
    revalidatePath("/admin/tickets");
    return { success: true, ticket: updatedTicket };
  } catch (error) {
    console.error("Error updating ticket support notes:", error);
    return { error: "Failed to update ticket support notes" };
  }
}

export async function updateTicketsStatus(ticketIds: string[], status: string) {
  try {
    console.log(`Updating ${ticketIds.length} tickets to status "${status}"`);
    
    const results = await prismadb.$transaction(
      ticketIds.map(id => 
        prismadb.ticket.update({
          where: { id },
          data: {
            status,
            resolvedAt: status === "resolved" ? new Date() : null,
          },
        })
      )
    );

    console.log(`Updated ${results.length} tickets to status "${status}"`);
    revalidatePath("/admin/tickets");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Error updating ticket statuses:", error);
    return { error: "Failed to update ticket statuses" };
  }
}

export async function updateTicketsCategory(ticketIds: string[], category: string) {
  try {
    console.log(`Updating ${ticketIds.length} tickets to category "${category}"`);
    
    const results = await prismadb.$transaction(
      ticketIds.map(id => 
        prismadb.ticket.update({
          where: { id },
          data: { category },
        })
      )
    );

    console.log(`Updated ${results.length} tickets to category "${category}"`);
    revalidatePath("/admin/tickets");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Error updating ticket categories:", error);
    return { error: "Failed to update ticket categories" };
  }
}

export async function deleteTickets(ticketIds: string[]) {
  try {
    console.log(`Deleting ${ticketIds.length} tickets`);
    
    // First delete all responses associated with the tickets
    await prismadb.ticketResponse.deleteMany({
      where: {
        ticketId: {
          in: ticketIds
        }
      }
    });
    
    // Then delete the tickets
    const result = await prismadb.ticket.deleteMany({
      where: {
        id: {
          in: ticketIds
        }
      }
    });

    console.log(`Deleted ${result.count} tickets`);
    revalidatePath("/admin/tickets");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error deleting tickets:", error);
    return { error: "Failed to delete tickets" };
  }
}

export async function createOrGetTicketConversation(ticketId: string) {
  console.log('🎫 createOrGetTicketConversation called', { ticketId });
  
  try {
    const { userId: adminUserId } = auth();
    console.log('🔐 Admin auth check', { adminUserId: adminUserId || 'NOT_AUTHENTICATED' });
    
    if (!adminUserId) {
      throw new Error("Unauthorized");
    }

    // Get the ticket with user info
    console.log('🔍 Looking up ticket', { ticketId });
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    console.log('🎫 Ticket lookup result', { 
      found: !!ticket,
      ticketId: ticket?.id,
      hasUser: !!ticket?.user,
      userId: ticket?.userId,
      userEmail: ticket?.user?.email,
      userName: ticket?.user?.firstName + ' ' + ticket?.user?.lastName
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (!ticket.userId) {
      console.log('⚠️ Ticket has no associated user - cannot create conversation');
      throw new Error("Ticket has no associated user");
    }

    // Check if a conversation already exists between admin and ticket user
    console.log('🔍 Searching for existing conversation', { 
      adminUserId, 
      ticketUserId: ticket.userId,
      searchCriteria: `name contains "Ticket: ${ticket.id}"`
    });
    
    const existingConversation = await prismadb.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: adminUserId
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
        isGroup: false,
        name: { contains: `Ticket: ${ticket.id}` }
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

    console.log('💬 Existing conversation search result', {
      found: !!existingConversation,
      conversationId: existingConversation?.id,
      conversationName: existingConversation?.name,
      participantCount: existingConversation?.participants?.length,
      messageCount: existingConversation?.messages?.length,
      participants: existingConversation?.participants?.map(p => ({
        userId: p.userId,
        role: p.role,
        userName: p.User?.firstName + ' ' + p.User?.lastName,
        userEmail: p.User?.email
      }))
    });

    if (existingConversation) {
      console.log('✅ Returning existing conversation with', existingConversation.messages?.length, 'messages');
      return existingConversation;
    }

    // Use a more robust approach with separate conversation and participant creation
    console.log('🔄 No existing conversation found, starting transaction to create new one');
    
    return await prismadb.$transaction(async (tx) => {
      console.log('🔒 Inside transaction - double-checking for existing conversation');
      
      // Double-check for existing conversation within transaction
      const doubleCheckConversation = await tx.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: adminUserId
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
          isGroup: false,
          name: { contains: `Ticket: ${ticket.id}` }
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

      console.log('🔍 Transaction double-check result', {
        found: !!doubleCheckConversation,
        conversationId: doubleCheckConversation?.id
      });

      if (doubleCheckConversation) {
        console.log('✅ Found existing conversation in transaction, returning it');
        return doubleCheckConversation;
      }

      // Create conversation first without participants
      console.log('🆕 Creating new conversation', {
        name: `Ticket: ${ticket.id} - ${ticket.title}`,
        participants: [adminUserId, ticket.userId]
      });
      
      const conversation = await tx.conversation.create({
        data: {
          name: `Ticket: ${ticket.id} - ${ticket.title}`,
          isGroup: false
        }
      });

      console.log('✅ Conversation created', { conversationId: conversation.id });

      // Create participants separately with upsert to handle duplicates
      console.log('👤 Creating admin participant', { adminUserId, conversationId: conversation.id });
      await tx.conversationParticipant.upsert({
        where: {
          userId_conversationId: {
            userId: adminUserId,
            conversationId: conversation.id
          }
        },
        update: {
          role: 'Support'
        },
        create: {
          userId: adminUserId,
          conversationId: conversation.id,
          role: 'Support'
        }
      });

      console.log('👤 Creating user participant', { userId: ticket.userId, conversationId: conversation.id });
      await tx.conversationParticipant.upsert({
        where: {
          userId_conversationId: {
            userId: ticket.userId,
            conversationId: conversation.id
          }
        },
        update: {
          role: 'User'
        },
        create: {
          userId: ticket.userId,
          conversationId: conversation.id,
          role: 'User'
        }
      });

      console.log('👥 Both participants created, fetching complete conversation');

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

      console.log('🎉 New conversation created successfully', { 
        ticketId, 
        conversationId: conversation.id,
        participantCount: completeConversation?.participants?.length,
        messageCount: completeConversation?.messages?.length 
      });
      
      return completeConversation!;
    });
  } catch (error) {
    console.error("Error creating/getting ticket conversation:", error);
    
    // If it's a unique constraint error, try to find the conversation again
    if (error.code === 'P2002') {
      console.log('Unique constraint error, attempting to find existing conversation...');
      
      // Get adminUserId again since it's not in scope here
      const { userId: currentAdminUserId } = auth();
      if (!currentAdminUserId) {
        throw new Error("Unauthorized");
      }

      // Get ticket info again since it might not be in scope
      const ticketInfo = await prismadb.ticket.findUnique({
        where: { id: ticketId },
        select: { userId: true }
      });

      if (!ticketInfo?.userId) {
        throw new Error("Ticket not found or has no associated user");
      }

      const existingConversation = await prismadb.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: currentAdminUserId
                }
              }
            },
            {
              participants: {
                some: {
                  userId: ticketInfo.userId
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
        console.log('Found existing conversation after constraint error');
        return existingConversation;
      }
    }
    
    throw error;
  }
}
