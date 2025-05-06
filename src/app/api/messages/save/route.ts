// app/api/messages/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamically rendered

// Interface for incoming attachment data from the client
interface AttachmentDataClient {
  url: string;
  fileName?: string;
  fileKey?: string;
  fileType?: string;
  fileSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming message
    const messageData = await request.json();
    
    // Basic validation
    if (!messageData.conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!messageData.senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      );
    }

    // This is from the WebSocket server, so the message may not have an ID yet
    // If no ID is provided, we'll generate one in the database
    // Extract fields we want to save in the database
    const {
      id, // Optional
      conversationId,
      senderId,
      content,
      senderRole,
      attachments, // New field for multiple attachments
      createdAt, // Timestamp from the server
      updatedAt
      // clientId // We no longer use clientId
    } = messageData;

    // Validate that an ID is provided (it should be the client-generated UUID)
    if (!id || !id.startsWith('message_')) {
       return NextResponse.json(
        { error: 'Valid message ID (prefixed UUID) is required' },
        { status: 400 }
      );     
    }

    // Create the message in the database using the provided ID
    try {
      const savedMessage = await prisma.message.create({
        data: {
          id: id, // Use the client-generated ID directly
          conversationId,
          senderId,
          content: content || '', // Ensure content is at least an empty string
          attachments: attachments && (attachments as AttachmentDataClient[]).length > 0 ? {
            createMany: {
              data: (attachments as AttachmentDataClient[]).map(att => ({
                url: att.url, // Map from client field name
                fileName: att.fileName,
                fileKey: att.fileKey,
                fileType: att.fileType,
                fileSize: att.fileSize,
              })),
            }
          } : undefined,
          // Use provided timestamps if available, otherwise use current time
          ...(createdAt && { createdAt: new Date(createdAt) }),
          ...(updatedAt && { updatedAt: new Date(updatedAt) }),
          // No longer storing clientId in metadata
          metadata: JSON.stringify({
            source: 'websocket',
            receivedAt: new Date().toISOString()
          })
        },
      });

      // Also update the conversation's updatedAt field to mark it as recently active
      // Use the message's timestamp if available to maintain consistency
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          updatedAt: createdAt ? new Date(createdAt) : new Date() 
        },
      });

      return NextResponse.json({
        status: 'success',
        message: 'Message saved successfully',
        savedMessage
      }, { status: 201 });
    } catch (error) {
      console.error('Error saving message to database:', error);
      return NextResponse.json(
        { error: 'Failed to save message to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing message save request:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
