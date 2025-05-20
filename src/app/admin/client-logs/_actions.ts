'use server'

import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'

// Define types
export type ClientLog = {
  id: string
  createdAt: Date
  level: string
  message: string
  data: string | null
  metadata: string | null
  userId: string | null
  device: string | null
  pathname: string | null
  userAgent: string | null
}

type FetchParams = {
  page?: number
  pageSize?: number
  level?: string | null
  device?: string | null
  userId?: string | null
  startDate?: Date | null
  endDate?: Date | null
}

/**
 * Fetch client logs with pagination and filtering
 */
export async function fetchClientLogs({
  page = 1,
  pageSize = 20,
  level = null,
  device = null,
  userId = null,
  startDate = null,
  endDate = null,
}: FetchParams = {}) {
  // Authentication check - only admins should access logs
  const { userId: authUserId } = auth()
  if (!authUserId) {
    throw new Error('Authentication required')
  }

  // Verify user is an admin (you'll need to implement this based on your role system)
  const user = await prisma.user.findUnique({
    where: { id: authUserId },
  })

  // TODO: Add proper role check
  // if (!user || !user.isAdmin) {
  //   throw new Error('Unauthorized access')
  // }

  // Build the filter conditions
  const where: any = {}
  
  if (level) {
    where.level = level
  }
  
  if (device) {
    where.device = device
  }
  
  if (userId) {
    where.userId = userId
  }
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  } else if (startDate) {
    where.createdAt = {
      gte: startDate,
    }
  } else if (endDate) {
    where.createdAt = {
      lte: endDate,
    }
  }

  // Count total logs for pagination
  const totalLogs = await prisma.clientLog.count({ where })
  const totalPages = Math.ceil(totalLogs / pageSize)

  // Get logs for the current page
  const logs = await prisma.clientLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return {
    logs,
    totalLogs,
    totalPages,
    currentPage: page,
  }
}

/**
 * Delete a client log by ID
 */
export async function deleteClientLog(id: string) {
  // Authentication check - only admins should access logs
  const { userId: authUserId } = auth()
  if (!authUserId) {
    throw new Error('Authentication required')
  }

  // Verify user is an admin (you'll need to implement this based on your role system)
  const user = await prisma.user.findUnique({
    where: { id: authUserId },
  })

  // TODO: Add proper role check
  // if (!user || !user.isAdmin) {
  //   throw new Error('Unauthorized access')
  // }

  // Delete the log
  await prisma.clientLog.delete({
    where: { id },
  })

  // Revalidate the logs page
  revalidatePath('/admin/client-logs')

  return { success: true }
}

/**
 * Clear all logs matching criteria
 */
export async function clearClientLogs({
  level = null,
  device = null,
  userId = null,
  startDate = null,
  endDate = null,
}: Omit<FetchParams, 'page' | 'pageSize'> = {}) {
  // Authentication check - only admins should access logs
  const { userId: authUserId } = auth()
  if (!authUserId) {
    throw new Error('Authentication required')
  }

  // Verify user is an admin (you'll need to implement this based on your role system)
  const user = await prisma.user.findUnique({
    where: { id: authUserId },
  })

  // TODO: Add proper role check
  // if (!user || !user.isAdmin) {
  //   throw new Error('Unauthorized access')
  // }

  // Build the filter conditions
  const where: any = {}
  
  if (level) {
    where.level = level
  }
  
  if (device) {
    where.device = device
  }
  
  if (userId) {
    where.userId = userId
  }
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  } else if (startDate) {
    where.createdAt = {
      gte: startDate,
    }
  } else if (endDate) {
    where.createdAt = {
      lte: endDate,
    }
  }

  // Delete matching logs
  const { count } = await prisma.clientLog.deleteMany({
    where,
  })

  // Revalidate the logs page
  revalidatePath('/admin/client-logs')

  return { success: true, count }
}