'use server'

import { checkAdminAccess } from '@/utils/roles'

/**
 * Manually trigger the check-unread-messages cron job
 * Used for testing notification consolidation logic
 */
export async function runCheckUnreadMessagesCron() {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized - Admin access required' }
  }

  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return { success: false, error: 'CRON_SECRET not configured' }
    }

    // Call the cron endpoint with proper authorization
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/cron/check-unread-messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Cron job failed with status ${response.status}`
      }
    }

    return {
      success: true,
      data: {
        processedMessages: data.processedMessages || 0,
        createdNotifications: data.createdNotifications || 0,
        notificationErrors: data.notificationErrors || 0,
      },
      message: `Processed ${data.processedMessages || 0} messages, created ${data.createdNotifications || 0} notifications`
    }
  } catch (error) {
    console.error('Error running check-unread-messages cron:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run cron job'
    }
  }
}
