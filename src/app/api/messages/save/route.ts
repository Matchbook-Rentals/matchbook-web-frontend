// app/api/messages/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export const dynamic = 'force-dynamic'; // This ensures the route is always dynamically rendered

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
      imgUrl,
      fileName,
      fileKey,
      fileType
    } = messageData;

    // Create the message in the database
    try {
      const savedMessage = await prisma.message.create({
        data: {
          // Only include id if it was provided
          ...(id && { id }),
          conversationId,
          senderId,
          content: content || '', // Ensure content is at least an empty string
          imgUrl,
          fileName,
          fileKey,
          fileType,
        },
      });

      // Also update the conversation's updatedAt field to mark it as recently active
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          updatedAt: new Date() 
        },
      });

      // Log successful message persistence 
      console.log('Message persisted in database:', { 
        id: savedMessage.id, 
        hasContent: !!savedMessage.content,
        hasAttachment: !!savedMessage.imgUrl
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