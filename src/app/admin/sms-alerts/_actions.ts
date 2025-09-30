'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import prismadb from '@/lib/prismadb'
import { sendVerificationCode as sendTwilioVerificationCode, sendSMS, formatToE164 } from '@/lib/twilio'
import { sendTestAlert as sendTwilioTestAlert } from '@/lib/sms-alerts'
import { redirect } from 'next/navigation'

interface SubscriptionStatus {
  exists: boolean
  subscription?: {
    id: string
    phoneNumber: string
    phoneVerified: boolean
    phoneVerifiedAt: Date | null
    alertsEnabled: boolean
    alertOnDispute: boolean
    alertOnRefund: boolean
    alertOnPaymentFailure: boolean
    alertOnTransferFailure: boolean
    alertOnMatchCreated: boolean
    alertOnBookingCreated: boolean
    alertOnPaymentSuccess: boolean
    quietHoursStart: string | null
    quietHoursEnd: string | null
    quietHoursTimezone: string | null
    lastAlertSentAt: Date | null
    alertsSentToday: number
    dailyAlertLimit: number
    createdAt: Date
    updatedAt: Date
  }
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const subscription = await prismadb.adminAlertSubscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    return { exists: false }
  }

  return {
    exists: true,
    subscription,
  }
}

export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    // Format phone number to E.164
    const formattedPhone = formatToE164(phoneNumber)

    // Send verification code via Twilio
    const result = await sendTwilioVerificationCode(formattedPhone)

    if (!result.success || !result.code) {
      return { success: false, error: result.error || 'Failed to send verification code' }
    }

    // Store verification code in database
    const existingSubscription = await prismadb.adminAlertSubscription.findUnique({
      where: { userId },
    })

    if (existingSubscription) {
      // Update existing subscription
      await prismadb.adminAlertSubscription.update({
        where: { userId },
        data: {
          phoneNumber: formattedPhone,
          verificationCode: result.code,
          verificationSentAt: new Date(),
          verificationAttempts: 0,
          phoneVerified: false,
          phoneVerifiedAt: null,
        },
      })
    } else {
      // Create new subscription
      await prismadb.adminAlertSubscription.create({
        data: {
          userId,
          phoneNumber: formattedPhone,
          verificationCode: result.code,
          verificationSentAt: new Date(),
          verificationAttempts: 0,
          phoneVerified: false,
        },
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending verification code:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function verifyPhoneNumber(code: string): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    const subscription = await prismadb.adminAlertSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return { success: false, error: 'No verification request found' }
    }

    // Check if code is expired (10 minutes)
    const expirationTime = 10 * 60 * 1000
    const isExpired = subscription.verificationSentAt &&
      (Date.now() - subscription.verificationSentAt.getTime()) > expirationTime

    if (isExpired) {
      return { success: false, error: 'Verification code expired. Please request a new one.' }
    }

    // Check attempt limit
    if (subscription.verificationAttempts >= 5) {
      return { success: false, error: 'Too many failed attempts. Please request a new code.' }
    }

    // Verify code
    if (subscription.verificationCode !== code) {
      // Increment attempts
      await prismadb.adminAlertSubscription.update({
        where: { userId },
        data: {
          verificationAttempts: subscription.verificationAttempts + 1,
        },
      })

      return { success: false, error: 'Invalid verification code' }
    }

    // Mark as verified
    await prismadb.adminAlertSubscription.update({
      where: { userId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        verificationCode: null,
        verificationAttempts: 0,
        alertsEnabled: true, // Enable alerts by default after verification
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error verifying phone number:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function updateAlertPreferences(preferences: {
  alertOnDispute: boolean
  alertOnRefund: boolean
  alertOnPaymentFailure: boolean
  alertOnTransferFailure: boolean
  alertOnMatchCreated: boolean
  alertOnBookingCreated: boolean
  alertOnPaymentSuccess: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    await prismadb.adminAlertSubscription.update({
      where: { userId },
      data: preferences,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error updating alert preferences:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function updateQuietHours(quietHours: {
  quietHoursStart: string | null
  quietHoursEnd: string | null
  quietHoursTimezone: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    await prismadb.adminAlertSubscription.update({
      where: { userId },
      data: quietHours,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error updating quiet hours:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function toggleAlertsEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    await prismadb.adminAlertSubscription.update({
      where: { userId },
      data: { alertsEnabled: enabled },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error toggling alerts:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function sendTestAlert(): Promise<{ success: boolean; error?: string }> {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check admin_dev role
  const userRole = user.publicMetadata?.role as string
  if (userRole !== 'admin_dev') {
    return { success: false, error: 'Admin dev access required' }
  }

  try {
    const subscription = await prismadb.adminAlertSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return { success: false, error: 'No subscription found' }
    }

    if (!subscription.phoneVerified) {
      return { success: false, error: 'Phone number not verified' }
    }

    // Send test alert
    const result = await sendTwilioTestAlert(subscription.phoneNumber)

    return result
  } catch (error: any) {
    console.error('Error sending test alert:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}
