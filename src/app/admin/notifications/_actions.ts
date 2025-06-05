'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { createNotification } from '@/app/actions/notifications'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface UserSearchResult {
  id: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  createdAt: number
  lastSignInAt?: number
  role?: string
}

export async function searchUsers(searchTerm: string): Promise<{
  success: boolean
  users?: UserSearchResult[]
  error?: string
}> {
  try {
    // Check admin permissions
    const isAdmin = await checkRole('admin')
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const client = clerkClient

    // Search users by email or name
    const users = await client.users.getUserList({
      query: searchTerm,
      limit: 20
    })

    const formattedUsers: UserSearchResult[] = users.data.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      imageUrl: user.imageUrl || undefined,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt || undefined,
      role: user.publicMetadata?.role as string || undefined
    }))

    return { success: true, users: formattedUsers }
  } catch (error) {
    console.error('Error searching users:', error)
    return { success: false, error: 'Failed to search users' }
  }
}

export async function createUserNotification(data: {
  userId: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  actionUrl?: string
  actionLabel?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check admin permissions
    const isAdmin = await checkRole('admin')
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const { userId: adminUserId } = auth()
    if (!adminUserId) {
      return { success: false, error: 'Authentication required' }
    }

    // Format content to include title and message
    const content = data.title + ': ' + data.message
    
    // Create the notification using the correct schema fields
    const result = await createNotification({
      userId: data.userId,
      content: content,
      url: data.actionUrl || '/platform/dashboard',
      actionType: `ADMIN_${data.type}`,
      actionId: `admin-notification-${Date.now()}`
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath('/admin/notifications')
    revalidatePath('/platform/notifications')
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: 'Failed to create notification' }
  }
}

export async function createBulkNotification(data: {
  userIds: string[]
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  actionUrl?: string
  actionLabel?: string
}): Promise<{
  success: boolean
  created?: number
  failed?: number
  error?: string
}> {
  try {
    // Check admin permissions
    const isAdmin = await checkRole('admin')
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const { userId: adminUserId } = auth()
    if (!adminUserId) {
      return { success: false, error: 'Authentication required' }
    }

    let created = 0
    let failed = 0

    // Format content to include title and message
    const content = data.title + ': ' + data.message

    // Create notifications for each user
    for (const userId of data.userIds) {
      const result = await createNotification({
        userId: userId,
        content: content,
        url: data.actionUrl || '/platform/dashboard',
        actionType: `ADMIN_${data.type}`,
        actionId: `admin-notification-${Date.now()}-${userId}`
      })

      if (result.success) {
        created++
      } else {
        failed++
        console.error(`Failed to create notification for user ${userId}:`, result.error)
      }
    }

    revalidatePath('/admin/notifications')
    revalidatePath('/platform/notifications')
    return { success: true, created, failed }
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return { success: false, error: 'Failed to create bulk notifications' }
  }
}