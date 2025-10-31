"use server";

import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export interface TicketActivityParams {
  ticketId: string;
  action: string;
  details?: Record<string, any>;
  actorType?: 'user' | 'admin' | 'system';
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
}

export async function logTicketActivity({
  ticketId,
  action,
  details,
  actorType = 'admin',
  actorId,
  actorName,
  actorEmail
}: TicketActivityParams) {
  try {
    console.log(`Logging ticket activity: ${action} for ticket ${ticketId}`);
    
    let finalActorId = actorId;
    let finalActorName = actorName;
    let finalActorEmail = actorEmail;
    
    // If actor details not provided, try to get from auth
    if (!finalActorId && actorType === 'admin') {
      const { userId } = auth();
      if (userId) {
        finalActorId = userId;
        
        // Get user details if not provided
        if (!finalActorName || !finalActorEmail) {
          const user = await prismadb.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true }
          });
          
          if (user) {
            finalActorName = finalActorName || `${user.firstName} ${user.lastName}`.trim();
            finalActorEmail = finalActorEmail || user.email || undefined;
          }
        }
      }
    }
    
    const activity = await prismadb.ticketActivity.create({
      data: {
        ticketId,
        action,
        details: details ? JSON.stringify(details) : null,
        actorType,
        actorId: finalActorId,
        actorName: finalActorName,
        actorEmail: finalActorEmail,
      },
    });

    console.log(`Activity logged: ${activity.id}`);
    return { success: true, activity };
  } catch (error) {
    console.error("Error logging ticket activity:", error);
    return { error: "Failed to log ticket activity" };
  }
}

export async function getTicketActivities(ticketId: string) {
  try {
    console.log(`Fetching activities for ticket ${ticketId}`);
    
    const activities = await prismadb.ticketActivity.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Retrieved ${activities.length} activities for ticket ${ticketId}`);
    return { success: true, activities };
  } catch (error) {
    console.error("Error fetching ticket activities:", error);
    return { error: "Failed to fetch ticket activities" };
  }
}

// Helper functions for common activity types
export async function logTicketCreated(ticketId: string, createdBy?: { id: string; name: string; email: string }) {
  return logTicketActivity({
    ticketId,
    action: 'ticket_created',
    details: { message: 'Ticket was created' },
    actorType: createdBy ? 'user' : 'system',
    actorId: createdBy?.id,
    actorName: createdBy?.name,
    actorEmail: createdBy?.email,
  });
}

export async function logStatusChanged(
  ticketId: string, 
  oldStatus: string, 
  newStatus: string,
  changedBy?: { id: string; name: string; email: string }
) {
  return logTicketActivity({
    ticketId,
    action: 'status_changed',
    details: { 
      oldStatus, 
      newStatus,
      message: `Status changed from ${oldStatus} to ${newStatus}` 
    },
    actorType: changedBy ? 'admin' : 'system',
    actorId: changedBy?.id,
    actorName: changedBy?.name,
    actorEmail: changedBy?.email,
  });
}

export async function logNoteSaved(
  ticketId: string,
  notePreview: string,
  savedBy?: { id: string; name: string; email: string }
) {
  return logTicketActivity({
    ticketId,
    action: 'note_saved',
    details: {
      notePreview: notePreview,
      message: 'Support note was saved'
    },
    actorType: savedBy ? 'admin' : 'system',
    actorId: savedBy?.id,
    actorName: savedBy?.name,
    actorEmail: savedBy?.email,
  });
}

export async function logChatInitiated(
  ticketId: string, 
  initiatedBy?: { id: string; name: string; email: string }
) {
  return logTicketActivity({
    ticketId,
    action: 'chat_initiated',
    details: { message: 'Live chat was initiated' },
    actorType: initiatedBy ? 'admin' : 'system',
    actorId: initiatedBy?.id,
    actorName: initiatedBy?.name,
    actorEmail: initiatedBy?.email,
  });
}

export async function logAssignmentChanged(
  ticketId: string, 
  oldAssignee: string | null, 
  newAssignee: string | null,
  changedBy?: { id: string; name: string; email: string }
) {
  return logTicketActivity({
    ticketId,
    action: 'assignment_changed',
    details: { 
      oldAssignee, 
      newAssignee,
      message: `Assignment changed ${oldAssignee ? `from ${oldAssignee} ` : ''}to ${newAssignee || 'unassigned'}` 
    },
    actorType: changedBy ? 'admin' : 'system',
    actorId: changedBy?.id,
    actorName: changedBy?.name,
    actorEmail: changedBy?.email,
  });
}

export async function logResponseAdded(
  ticketId: string, 
  responsePreview: string,
  isFromStaff: boolean,
  respondedBy?: { id: string; name: string; email: string }
) {
  return logTicketActivity({
    ticketId,
    action: 'response_added',
    details: { 
      responsePreview: responsePreview.substring(0, 100) + (responsePreview.length > 100 ? '...' : ''),
      isFromStaff,
      message: `${isFromStaff ? 'Staff' : 'User'} response was added` 
    },
    actorType: isFromStaff ? 'admin' : 'user',
    actorId: respondedBy?.id,
    actorName: respondedBy?.name,
    actorEmail: respondedBy?.email,
  });
}