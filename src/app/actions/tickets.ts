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
  try {
    const { userId: adminUserId } = auth();
    if (!adminUserId) {
      throw new Error("Unauthorized");
    }

    // Get the ticket with user info
    const ticket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (!ticket.userId) {
      throw new Error("Ticket has no associated user");
    }

    // Check if a conversation already exists between admin and ticket user
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
        // Use the ticket title in the conversation name to identify it
        name: `Ticket: ${ticket.id}`
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

    // Create a new conversation for this ticket
    const conversation = await prismadb.conversation.create({
      data: {
        name: `Ticket: ${ticket.id}`,
        participants: {
          create: [
            {
              userId: adminUserId,
              role: 'Support'
            },
            {
              userId: ticket.userId,
              role: 'User'
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
        messages: true
      }
    });

    console.log('Created conversation for ticket:', { ticketId, conversationId: conversation.id });
    return conversation;
  } catch (error) {
    console.error("Error creating/getting ticket conversation:", error);
    throw error;
  }
}
