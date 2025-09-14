'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createNotification } from '@/app/actions/notifications'
import { checkAdminAccess } from '@/utils/roles'

interface SendTestNotificationParams {
  type: string
  recipientEmail: string
  senderName?: string
  messageContent?: string
  listingTitle?: string
  amount?: string
}

export async function sendTestNotification({
  type,
  recipientEmail,
  senderName = 'Test User',
  messageContent = 'This is a test message',
  listingTitle = 'Test Property',
  amount
}: SendTestNotificationParams) {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const { userId: adminUserId } = auth()
    if (!adminUserId) {
      return { success: false, error: 'Authentication required' }
    }

    // Find the user by email
    const client = clerkClient
    const users = await client.users.getUserList({
      emailAddress: [recipientEmail],
      limit: 1
    })

    if (!users.data || users.data.length === 0) {
      return { success: false, error: 'User not found with that email address' }
    }

    const targetUser = users.data[0]

    // Build notification content based on type
    let notificationContent = ''
    let notificationUrl = ''
    let emailData: any = {}

    switch (type) {
      case 'message':
        notificationContent = `You have a new message from ${senderName}.`
        notificationUrl = '/app/messages?convo=test-' + Date.now()
        emailData = {
          senderName,
          conversationId: 'test-' + Date.now(),
          listingTitle,
          messageContent
        }
        break
        
      case 'new_conversation':
        notificationContent = `${senderName} started a new conversation about ${listingTitle}`
        notificationUrl = '/app/messages'
        emailData = {
          senderName,
          listingTitle
        }
        break
        
      case 'view': // Application received
        notificationContent = `New Application - ${listingTitle}`
        notificationUrl = '/app/host/listings/applications'
        emailData = {
          listingTitle,
          senderName
        }
        break
        
      case 'application_approved':
        notificationContent = `Your application for ${listingTitle} has been approved!`
        notificationUrl = '/app/rent/searches?tab=matchbook'
        emailData = {
          listingTitle
        }
        break
        
      case 'application_declined':
        notificationContent = `Your application for ${listingTitle} has been declined.`
        notificationUrl = '/app/rent/searches'
        emailData = {
          listingTitle
        }
        break
        
      case 'application_approved_lease_ready':
        notificationContent = `Congratulations! Your application for ${listingTitle} has been approved and your lease is ready for signature.`
        notificationUrl = '/app/match/test'
        emailData = {
          listingTitle
        }
        break
        
      case 'booking':
        notificationContent = `You have a new booking for ${listingTitle} from ${senderName}`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = {
          listingTitle,
          senderName
        }
        break
        
      case 'move_in_upcoming':
        notificationContent = `Move-in reminder: Your stay at ${listingTitle} begins soon!`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          listingTitle
        }
        break
        
      case 'move_out_upcoming':
        notificationContent = `Move-out reminder: Your stay at ${listingTitle} ends soon.`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          listingTitle
        }
        break
        
      case 'payment_success':
        notificationContent = `Payment of $${amount} for ${listingTitle} was successful.`
        notificationUrl = '/app/renter/payments'
        emailData = {
          amount,
          listingTitle
        }
        break
        
      case 'payment_failed':
        notificationContent = `Payment of $${amount} for ${listingTitle} failed. Please update your payment method.`
        notificationUrl = '/app/renter/payments'
        emailData = {
          amount,
          listingTitle
        }
        break
        
      case 'payment_authorization_required':
        notificationContent = `Your move-in has been confirmed! Please authorize your first month's rent payment of $${amount}.`
        notificationUrl = '/app/renter/bookings/authorize-payment'
        emailData = {
          amount,
          listingTitle
        }
        break
        
      case 'ADMIN_INFO':
        notificationContent = messageContent || 'Important information from MatchBook'
        notificationUrl = '/app/dashboard'
        break
        
      case 'ADMIN_WARNING':
        notificationContent = messageContent || 'Important warning from MatchBook'
        notificationUrl = '/app/dashboard'
        break
        
      case 'ADMIN_SUCCESS':
        notificationContent = messageContent || 'Success notification from MatchBook'
        notificationUrl = '/app/dashboard'
        break
        
      default:
        notificationContent = `Test notification: ${type}`
        notificationUrl = '/app/dashboard'
    }

    // Create the notification with email
    const result = await createNotification({
      userId: targetUser.id,
      content: notificationContent,
      url: notificationUrl,
      actionType: type,
      actionId: `test-notification-${Date.now()}`,
      emailData
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to create notification' }
    }

    return { 
      success: true, 
      message: `Test notification sent to ${recipientEmail}`,
      notificationId: result.notification?.id
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
    return { success: false, error: 'Failed to send test notification' }
  }
}