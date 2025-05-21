'use server'

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import prisma from '@/lib/prismadb'
import { logger } from '@/lib/logger'

// Define schema for log data validation
const logSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  data: z.string().optional(), // JSON stringified data
  metadata: z.string().optional(), // JSON stringified metadata
  device: z.enum(['ios', 'android', 'web']).optional(),
  pathname: z.string().optional(),
})

export type ClientLogInput = z.infer<typeof logSchema>

/**
 * Server action to log client-side events to the database
 * Particularly useful for mobile devices where console logs are harder to access
 */
export async function logClientEvent(input: ClientLogInput) {
  try {
    // Validate input data
    const validatedData = logSchema.parse(input)
    
    // Get current user if authenticated
    const { userId } = auth()
    
    // Get user agent from request headers
    const userAgent = headers().get('user-agent') || undefined
    
    // Create log entry in database
    const logEntry = await prisma.clientLog.create({
      data: {
        level: validatedData.level,
        message: validatedData.message,
        data: validatedData.data,
        metadata: validatedData.metadata,
        device: validatedData.device,
        pathname: validatedData.pathname,
        userAgent,
        userId,
      },
    })

    // Log to server console as well for development visibility
    logger.debug(`[ClientLog:${validatedData.level}] ${validatedData.message}`, 
      validatedData.data ? JSON.parse(validatedData.data) : undefined,
      { metadata: validatedData.metadata ? JSON.parse(validatedData.metadata) : undefined }
    )

    return { success: true, id: logEntry.id }
  } catch (error) {
    // Log error but don't fail the client application
    logger.error('Failed to log client event', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Convenience methods for different log levels
 */
export async function logClientDebug(message: string, data?: any, metadata?: any) {
  // Extract device from metadata if present
  const { device, pathname, ...otherMetadata } = metadata || {}
  
  return await logClientEvent({
    level: 'debug',
    message,
    data: data ? JSON.stringify(data) : undefined,
    metadata: Object.keys(otherMetadata).length > 0 ? JSON.stringify(otherMetadata) : undefined,
    device,
    pathname,
  })
}

export async function logClientInfo(message: string, data?: any, metadata?: any) {
  // Extract device from metadata if present
  const { device, pathname, ...otherMetadata } = metadata || {}
  
  return await logClientEvent({
    level: 'info',
    message,
    data: data ? JSON.stringify(data) : undefined,
    metadata: Object.keys(otherMetadata).length > 0 ? JSON.stringify(otherMetadata) : undefined,
    device,
    pathname,
  })
}

export async function logClientWarn(message: string, data?: any, metadata?: any) {
  // Extract device from metadata if present
  const { device, pathname, ...otherMetadata } = metadata || {}
  
  return await logClientEvent({
    level: 'warn',
    message,
    data: data ? JSON.stringify(data) : undefined,
    metadata: Object.keys(otherMetadata).length > 0 ? JSON.stringify(otherMetadata) : undefined,
    device,
    pathname,
  })
}

export async function logClientError(message: string, data?: any, metadata?: any) {
  // Extract device from metadata if present
  const { device, pathname, ...otherMetadata } = metadata || {}
  
  return await logClientEvent({
    level: 'error',
    message,
    data: data ? JSON.stringify(data) : undefined,
    metadata: Object.keys(otherMetadata).length > 0 ? JSON.stringify(otherMetadata) : undefined,
    device,
    pathname,
  })
}

