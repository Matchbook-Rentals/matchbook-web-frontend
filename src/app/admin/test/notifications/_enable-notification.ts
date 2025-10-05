'use server'

import prismadb from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

// Map notification action types to their corresponding email preference fields
const notificationToPreferenceMap: Record<string, string> = {
  // Messages & Communication
  'message': 'emailNewMessageNotifications',
  'new_conversation': 'emailNewConversationNotifications',

  // Applications & Matching
  'view': 'emailApplicationReceivedNotifications', // Application received (for hosts)
  'application_submitted': 'emailApplicationReceivedNotifications', // Same as view
  'application_approved': 'emailApplicationApprovedNotifications',
  'application_declined': 'emailApplicationDeclinedNotifications',

  // Reviews & Verification
  'submit_host_review': 'emailSubmitHostReviewNotifications',
  'submit_renter_review': 'emailSubmitRenterReviewNotifications',
  'landlord_info_request': 'emailLandlordInfoRequestNotifications',
  'verification_completed': 'emailVerificationCompletedNotifications',

  // Bookings & Stays
  'booking': 'emailBookingCompletedNotifications',
  'booking_host': 'emailBookingCompletedNotifications',
  'booking_confirmed': 'emailBookingCompletedNotifications',
  'booking_canceled': 'emailBookingCanceledNotifications',
  'move_out_upcoming': 'emailMoveOutUpcomingNotifications',
  'move_in_upcoming': 'emailMoveInUpcomingNotifications',
  'move_in_upcoming_host': 'emailMoveInUpcomingNotifications',

  // Payments
  'payment_success': 'emailPaymentSuccessNotifications',
  'payment_failed': 'emailPaymentFailedNotifications',
  'payment_failed_severe': 'emailPaymentFailedNotifications',
  'payment_failed_host': 'emailPaymentFailedNotifications',
  'payment_failed_host_severe': 'emailPaymentFailedNotifications',

  // External Communications
  'off_platform_host': 'emailOffPlatformHostNotifications',
}

export async function enableNotificationForAllUsers(notificationId: string) {
  const { userId } = auth()

  if (!userId) {
    return { success: false, error: 'Unauthorized' }
  }

  // Map the notification ID to the preference field
  const preferenceField = notificationToPreferenceMap[notificationId]

  if (!preferenceField) {
    return {
      success: false,
      error: `No preference mapping found for notification type: ${notificationId}`
    }
  }

  try {
    // Update all user preferences to enable this specific notification
    const result = await prismadb.userPreferences.updateMany({
      data: {
        [preferenceField]: true
      }
    })

    return {
      success: true,
      count: result.count,
      message: `Enabled "${notificationId}" notifications for ${result.count} user${result.count !== 1 ? 's' : ''}`
    }
  } catch (error) {
    console.error('Error enabling notification:', error)
    return {
      success: false,
      error: 'Failed to enable notification preference'
    }
  }
}
