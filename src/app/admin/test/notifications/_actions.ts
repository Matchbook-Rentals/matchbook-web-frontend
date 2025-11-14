'use server'

import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createNotification } from '@/app/actions/notifications'
import { checkAdminAccess } from '@/utils/roles'
import { buildNotificationEmailData } from '@/lib/notification-builders'

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
        emailData = buildNotificationEmailData('message', {
          senderName,
          conversationId: 'test-' + Date.now(),
          listingTitle,
          messagePreview: messageContent
        })
        break

      case 'new_conversation':
        notificationContent = `You have a new conversation with ${senderName}`
        notificationUrl = '/app/messages'
        emailData = buildNotificationEmailData('new_conversation', {
          senderName,
          messagePreview: 'Hi! I\'m interested in your property and would love to learn more about the availability and amenities.',
          conversationId: 'test-conversation-id',
          listingTitle
        })
        break
        
      case 'application_submitted':
        notificationContent = `Your application for ${listingTitle} has been submitted.`
        notificationUrl = '/app/rent/applications/test-housing-request-' + Date.now()
        emailData = buildNotificationEmailData('application_submitted', {
          listingTitle,
          renterName: senderName,
          hostFirstName: 'John'
        })
        break

      case 'view': // Application received
        notificationContent = `New application to ${listingTitle} for ${messageContent || 'Jan 1 - Jan 31'}`
        notificationUrl = '/app/host/listings/applications'
        emailData = buildNotificationEmailData('view', {
          listingTitle,
          renterName: senderName,
          dateRange: messageContent || 'Jan 1 - Jan 31'
        })
        break

      case 'application_approved':
        notificationContent = `You have a Match!`
        notificationUrl = '/app/rent/match/test-match-id/lease-signing'
        emailData = buildNotificationEmailData('application_approved', {
          listingTitle,
          hostName: senderName || 'Sarah Johnson'
        })
        break

      case 'application_declined':
        notificationContent = `Your application for ${listingTitle} has been declined.`
        notificationUrl = '/app/rent/searches'
        emailData = buildNotificationEmailData('application_declined', {
          listingTitle
        })
        break
        
      case 'application_approved_lease_ready':
        notificationContent = `Congratulations! Your application for ${listingTitle} has been approved and your lease is ready for signature.`
        notificationUrl = '/app/match/test'
        emailData = buildNotificationEmailData('application_approved_lease_ready', {
          listingTitle
        })
        break
        
      case 'booking':
        notificationContent = `You have a new booking for ${listingTitle} from ${senderName}`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = buildNotificationEmailData('booking', {
          listingTitle,
          senderName
        })
        break
        
      case 'booking_change_request':
        notificationContent = `A change has been requested for your booking at ${listingTitle}.`
        notificationUrl = '/app/renter/bookings'
        emailData = buildNotificationEmailData('booking_change_request', {
          listingTitle
        })
        break

      case 'booking_change_declined':
        notificationContent = `Your requested change has been declined by ${senderName}`
        notificationUrl = '/app/renter/bookings'
        emailData = buildNotificationEmailData('booking_change_declined', {
          renterName: senderName
        })
        break

      case 'booking_change_approved':
        notificationContent = `Your requested change has been approved by ${senderName}`
        notificationUrl = '/app/renter/bookings'
        emailData = buildNotificationEmailData('booking_change_approved', {
          renterName: senderName
        })
        break

      case 'move_in_upcoming':
        notificationContent = `Move-in reminder: Your stay at ${listingTitle} begins soon!`
        notificationUrl = '/app/renter/bookings'
        emailData = buildNotificationEmailData('move_in_upcoming', {
          listingTitle,
          bookingId: 'test-booking-' + Date.now(),
          moveInDate: amount || 'March 20, 2024'
        })
        break

      case 'move_in_upcoming_host':
        notificationContent = `${senderName} is moving into ${listingTitle} in 3 days`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = buildNotificationEmailData('move_in_upcoming_host', {
          listingTitle,
          listingId: 'test-listing-' + Date.now(),
          bookingId: 'test-booking-' + Date.now(),
          renterName: senderName,
          moveInDate: amount || 'March 20, 2024'
        })
        break

      case 'move_out_upcoming':
        notificationContent = `Move-out reminder: Your stay at ${listingTitle} ends soon.`
        notificationUrl = '/app/renter/bookings'
        emailData = buildNotificationEmailData('move_out_upcoming', {
          listingTitle
        })
        break

      case 'payment_success':
        notificationContent = `Payment of $${amount} for ${listingTitle} was successful.`
        notificationUrl = '/app/renter/payments'
        emailData = buildNotificationEmailData('payment_success', {
          amount,
          listingTitle
        })
        break

      case 'payment_failed':
        notificationContent = `Payment of $${amount} for ${listingTitle} failed. Please update your payment method.`
        notificationUrl = '/app/renter/payments'
        emailData = buildNotificationEmailData('payment_failed', {
          amount,
          listingTitle
        })
        break

      case 'payment_authorization_required':
        notificationContent = `Your move-in has been confirmed! Please authorize your first month's rent payment of $${amount}.`
        notificationUrl = '/app/renter/bookings/authorize-payment'
        emailData = buildNotificationEmailData('payment_authorization_required', {
          amount,
          listingTitle
        })
        break

      case 'listing_approved':
        notificationContent = `Your listing "${listingTitle}" is now live on MatchBook!`
        notificationUrl = '/app/host-dashboard?tab=calendar'
        emailData = buildNotificationEmailData('listing_approved', {
          listingTitle
        })
        break

      case 'ADMIN_INFO':
        notificationContent = messageContent || 'Important information from MatchBook'
        notificationUrl = '/app/dashboard'
        emailData = buildNotificationEmailData('ADMIN_INFO', {
          messageContent
        })
        break

      case 'ADMIN_WARNING':
        notificationContent = messageContent || 'Important warning from MatchBook'
        notificationUrl = '/app/dashboard'
        emailData = buildNotificationEmailData('ADMIN_WARNING', {
          messageContent
        })
        break

      case 'ADMIN_SUCCESS':
        notificationContent = messageContent || 'Success notification from MatchBook'
        notificationUrl = '/app/dashboard'
        emailData = buildNotificationEmailData('ADMIN_SUCCESS', {
          messageContent
        })
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