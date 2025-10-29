'use server'

import { checkAdminAccess } from '@/utils/roles'
import { buildNotificationEmailData, getNotificationEmailConfig } from '@/lib/notification-email-config'
import { renderEmailToHtml } from './_render-email'

interface PreviewEmailParams {
  type: string
  senderName?: string
  messageContent?: string
  listingTitle?: string
  amount?: string
}

export async function previewNotificationEmail({
  type,
  senderName = 'Test User',
  messageContent = 'This is a test message',
  listingTitle = 'Test Property',
  amount
}: PreviewEmailParams) {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Build notification content based on type
    let notificationContent = ''
    let notificationUrl = '/app/test'
    let emailData: any = {}

    switch (type) {
      case 'message':
        notificationContent = `You have a new message from ${senderName}.`
        notificationUrl = '/app/messages?convo=test-preview'
        emailData = {
          senderName,
          conversationId: 'test-preview',
          listingTitle: listingTitle || 'Listing you liked',
          messageContent
        }
        break
        
      case 'new_conversation':
        notificationContent = `You have a new conversation with ${senderName}`
        notificationUrl = '/app/messages'
        emailData = {
          senderName,
          messagePreview: 'Hi! I\'m interested in your property and would love to learn more about the availability and amenities.',
          conversationId: 'test-conversation-id',
          listingTitle
        }
        break
        
      case 'view':
        notificationContent = `New application to ${listingTitle} for ${messageContent || 'Jan 1 - Jan 31'}`
        notificationUrl = '/app/host/listings/applications'
        emailData = {
          listingTitle,
          renterName: senderName,
          dateRange: messageContent || 'Jan 1 - Jan 31'
        }
        break
        
      case 'application_approved':
        notificationContent = `You have a Match!`
        notificationUrl = '/app/rent/match/test-match-id/lease-signing'
        emailData = {
          listingTitle,
          hostName: senderName || 'Sarah Johnson'
        }
        break
        
      case 'application_declined':
        notificationContent = `Your application for ${listingTitle} has been declined.`
        notificationUrl = '/app/rent/searches'
        emailData = {
          listingTitle
        }
        break
        
      case 'application_revoked':
        notificationContent = `Your approval for ${listingTitle} has been revoked.`
        notificationUrl = '/app/rent/searches'
        emailData = {
          listingTitle
        }
        break
        
      case 'application_updated':
        notificationContent = `${senderName || 'A renter'} has updated their application for ${listingTitle}`
        notificationUrl = '/app/host/applications'
        emailData = {
          listingTitle,
          renterName: senderName || 'Alex Thompson'
        }
        break
        
      case 'review_prompt':
        notificationContent = `${senderName || 'John Smith'} has checked out of ${listingTitle}. Ready to write a review?`
        notificationUrl = '/app/reviews/write'
        emailData = {
          listingTitle,
          renterName: senderName || 'John Smith'
        }
        break
        
      case 'review_prompt_renter':
        notificationContent = `How was your stay at ${listingTitle}? Ready to rate your host?`
        notificationUrl = '/app/reviews/write'
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
        
      case 'booking_host':
        notificationContent = `Your booking for "${listingTitle}" with "${senderName}" is confirmed.`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = {
          listingTitle,
          renterName: senderName,
          moveInDate: amount || 'March 15, 2024'
        }
        break
        
      case 'booking_confirmed':
        notificationContent = `You booked ${listingTitle} in ${messageContent || 'San Francisco'} for ${amount || 'Jan 1 - Jan 31'}.`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          listingTitle,
          city: messageContent || 'San Francisco',
          dateRange: amount || 'Jan 1 - Jan 31'
        }
        break
        
      case 'booking_change_request':
        notificationContent = `A change has been requested to your booking for ${listingTitle}`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = {
          listingTitle
        }
        break
        
      case 'booking_change_declined':
        notificationContent = `Your requested change has been declined`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          declinerName: senderName || 'Sarah Johnson'
        }
        break
        
      case 'booking_change_approved':
        notificationContent = `Your requested change has been approved`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          approverName: senderName || 'Robert Wilson'
        }
        break
        
      case 'move_in_upcoming':
        notificationContent = `Move-in reminder: Your stay at ${listingTitle} begins soon!`
        notificationUrl = '/app/renter/bookings'
        emailData = {
          listingTitle,
          bookingId: 'test-booking-123',
          moveInDate: amount || 'March 20, 2024'
        }
        break
        
      case 'move_in_upcoming_host':
        notificationContent = `${senderName || 'John Smith'} is moving into ${listingTitle} in 3 days`
        notificationUrl = '/app/host-dashboard?tab=bookings'
        emailData = {
          listingTitle,
          listingId: 'test-listing-123',
          bookingId: 'test-booking-123',
          renterName: senderName || 'John Smith',
          moveInDate: amount || 'March 20, 2024'
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
        notificationContent = `Payment of $${amount || '1,800'} for ${listingTitle} failed. Please update your payment method.`
        notificationUrl = '/app/payment-methods'
        emailData = {
          amount: amount || '1,800',
          listingTitle,
          nextRetryDate: 'tomorrow, January 17, 2025'
        }
        break
        
      case 'payment_failed_severe':
        notificationContent = `Payment of $${amount || '2,200'} for ${listingTitle} failed on second attempt. Immediate action required.`
        notificationUrl = '/app/payment-methods'
        emailData = {
          amount: amount || '2,200',
          listingTitle
        }
        break
        
      case 'payment_failed_host':
        notificationContent = `Payment issue for ${listingTitle}. ${senderName || 'John Smith'}'s payment failed.`
        notificationUrl = '/app/messages'
        emailData = {
          amount: amount || '1,950',
          listingTitle,
          renterName: senderName || 'John Smith',
          nextRetryDate: 'tomorrow, January 17, 2025'
        }
        break
        
      case 'payment_failed_host_severe':
        notificationContent = `Payment failure for ${listingTitle}. ${senderName || 'Sarah Johnson'}'s payment failed after second attempt.`
        notificationUrl = '/app/messages'
        emailData = {
          amount: amount || '2,500',
          listingTitle,
          renterName: senderName || 'Sarah Johnson'
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
        
      case 'listing_approved':
        notificationContent = `Your listing "${listingTitle}" has been approved and is now live!`
        notificationUrl = '/app/host-dashboard?tab=calendar'
        emailData = {
          listingTitle
        }
        break
        
      case 'welcome_renter':
        notificationContent = 'Welcome to MatchBook! Start exploring flexible rentals.'
        notificationUrl = '/app/rent/searches'
        emailData = {}
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

    // Build the email data
    const notification = {
      content: notificationContent,
      url: notificationUrl
    }

    const emailTemplateData = buildNotificationEmailData(
      type,
      notification,
      { firstName: 'Test' },
      emailData
    )

    // Get the email config for subject
    const config = getNotificationEmailConfig(type)

    // Render the email template to HTML
    const emailHtml = renderEmailToHtml(emailTemplateData)

    return {
      success: true,
      html: emailHtml,
      subject: config.subject,
      data: emailTemplateData
    }
  } catch (error) {
    console.error('Error generating email preview:', error)
    return { success: false, error: 'Failed to generate email preview' }
  }
}