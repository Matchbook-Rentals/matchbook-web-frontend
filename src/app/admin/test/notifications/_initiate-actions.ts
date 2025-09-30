'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { createTestConversationData } from './_test-data-actions'

export async function initiateNewConversation() {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) return { success: false, error: 'Unauthorized - Admin access required' }

  try {
    // 1. Create test data (users and listing)
    const testData = await createTestConversationData()
    if (!testData.success || !testData.data) {
      return { success: false, error: testData.error || 'Failed to create test data' }
    }

    const { renterId, hostId, listingId, listingTitle, hostEmail } = testData.data

    // 2. Check if conversation already exists between these users for this listing
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId,
        participants: {
          every: {
            userId: { in: [renterId, hostId] }
          }
        }
      },
      include: {
        messages: true
      }
    })

    let conversation
    let isNewConversation = false

    if (existingConversation) {
      conversation = existingConversation
      console.log('Using existing conversation:', conversation.id)
    } else {
      // 3. Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          listingId: listingId,
          participants: {
            create: [
              { userId: renterId },
              { userId: hostId }
            ]
          }
        }
      })
      isNewConversation = true
      console.log('Created new conversation:', conversation.id)
    }

    // 4. Create first message in the conversation
    const message = await prisma.message.create({
      data: {
        content: `Hi! I'm interested in "${listingTitle}". Is it still available?`,
        senderId: renterId,
        conversationId: conversation.id,
      }
    })

    console.log('Created message:', message.id)

    return {
      success: true,
      message: `Conversation ${isNewConversation ? 'created' : 'found'}! Message sent. Check cron job in 2+ minutes to see new_conversation notification sent to ${hostEmail}`,
      conversationId: conversation.id,
      messageId: message.id,
      data: testData.data
    }
  } catch (error) {
    console.error('Error initiating new conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate conversation'
    }
  }
}

export async function initiateMultipleMessages() {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) return { success: false, error: 'Unauthorized - Admin access required' }

  try {
    // 1. Create test data (users and listing)
    const testData = await createTestConversationData()
    if (!testData.success || !testData.data) {
      return { success: false, error: testData.error || 'Failed to create test data' }
    }

    const { renterId, hostId, listingId, listingTitle, hostEmail } = testData.data

    // 2. Check if conversation already exists between these users for this listing
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        listingId: listingId,
        participants: {
          every: {
            userId: { in: [renterId, hostId] }
          }
        }
      },
      include: {
        messages: true
      }
    })

    let conversation
    let isNewConversation = false

    if (existingConversation) {
      conversation = existingConversation
      console.log('Using existing conversation:', conversation.id)
    } else {
      // 3. Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          listingId: listingId,
          participants: {
            create: [
              { userId: renterId },
              { userId: hostId }
            ]
          }
        }
      })
      isNewConversation = true
      console.log('Created new conversation:', conversation.id)
    }

    // 4. Create multiple messages (3 messages to test consolidation)
    const messages = [
      {
        content: `Hi! I'm interested in "${listingTitle}". Is it still available? I'd love to schedule a viewing if possible.`,
        senderId: renterId,
        conversationId: conversation.id,
      },
      {
        content: `I have a few questions about the lease terms and move-in dates. What's the earliest I could move in? Also, are utilities included in the monthly rent?`,
        senderId: renterId,
        conversationId: conversation.id,
      },
      {
        content: `Also, are pets allowed? I have a small dog (about 15 lbs) who is very well-behaved and house-trained. Let me know if that would be okay.`,
        senderId: renterId,
        conversationId: conversation.id,
      }
    ]

    const createdMessages = []
    for (const messageData of messages) {
      const message = await prisma.message.create({ data: messageData })
      createdMessages.push(message)
      console.log('Created message:', message.id)
    }

    return {
      success: true,
      message: `${isNewConversation ? 'Created conversation and sent' : 'Sent'} ${createdMessages.length} messages. Run cron job to see consolidated notification sent to ${hostEmail}`,
      conversationId: conversation.id,
      messageIds: createdMessages.map(m => m.id),
      messageCount: createdMessages.length,
      data: testData.data
    }
  } catch (error) {
    console.error('Error initiating multiple messages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate multiple messages'
    }
  }
}
