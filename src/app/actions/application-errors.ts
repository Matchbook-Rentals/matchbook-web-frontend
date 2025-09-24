'use server'

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import prisma from '@/lib/prismadb'
import { logger } from '@/lib/logger'

// Define schema for application error data validation
const applicationErrorSchema = z.object({
  errorMessage: z.string(),
  errorStack: z.string().optional(),
  errorDigest: z.string().optional(),
  pathname: z.string().optional(),
  metadata: z.record(z.any()).optional(), // Additional context data
})

export type ApplicationErrorInput = z.infer<typeof applicationErrorSchema>

/**
 * Server action to log application errors to the ApplicationError table
 * Used by error boundaries and global error handlers
 */
export async function logApplicationError(input: ApplicationErrorInput) {
  try {
    // Validate input data
    const validatedData = applicationErrorSchema.parse(input)

    // Get current user if authenticated
    const { userId } = auth()

    // Get user agent from request headers
    const userAgent = headers().get('user-agent') || undefined

    // Sanitize error data to remove sensitive information
    const sanitizedErrorMessage = sanitizeErrorMessage(validatedData.errorMessage)
    const sanitizedStack = validatedData.errorStack
      ? sanitizeErrorStack(validatedData.errorStack)
      : undefined

    // Create application error entry in database
    const errorEntry = await prisma.applicationError.create({
      data: {
        errorMessage: sanitizedErrorMessage,
        errorStack: sanitizedStack,
        errorDigest: validatedData.errorDigest,
        pathname: validatedData.pathname,
        userAgent,
        userId,
        isAuthError: detectAuthError(validatedData.errorMessage),
      },
    })

    // Also log using the existing client log system for redundancy
    await prisma.clientLog.create({
      data: {
        level: 'error',
        message: `[APPLICATION_ERROR] ${sanitizedErrorMessage}`,
        data: JSON.stringify({
          digest: validatedData.errorDigest,
          stack: sanitizedStack,
          metadata: validatedData.metadata,
        }),
        pathname: validatedData.pathname,
        userAgent,
        userId,
        device: 'web',
      },
    })

    // Log to server console for development visibility
    logger.error('Application Error logged to database', {
      id: errorEntry.id,
      message: sanitizedErrorMessage,
      pathname: validatedData.pathname,
      userId,
      digest: validatedData.errorDigest,
    })

    return { success: true, id: errorEntry.id }
  } catch (error) {
    // Log error but don't fail the client application
    logger.error('Failed to log application error', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Enhanced error logging with additional context
 */
export async function logApplicationErrorWithContext(
  error: Error & { digest?: string },
  additionalContext: {
    pathname?: string
    userActions?: string[]
    componentStack?: string
    errorBoundary?: string
    [key: string]: any
  } = {}
) {
  try {
    const enrichedContext = await gatherErrorContext(additionalContext)

    return await logApplicationError({
      errorMessage: error.message,
      errorStack: error.stack,
      errorDigest: error.digest,
      pathname: additionalContext.pathname || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      metadata: enrichedContext,
    })
  } catch (logError) {
    logger.error('Failed to log application error with context', logError)
    return { success: false, error: logError instanceof Error ? logError.message : 'Unknown error' }
  }
}

/**
 * Sanitize error message to remove sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential API keys, tokens, passwords, etc.
  const sensitivePatterns = [
    /api[_-]?key[=:\s]+"?[a-zA-Z0-9\-_]+"?/gi,
    /token[=:\s]+"?[a-zA-Z0-9\-_]+"?/gi,
    /password[=:\s]+"?[^"\s]+"?/gi,
    /secret[=:\s]+"?[^"\s]+"?/gi,
    /bearer\s+[a-zA-Z0-9\-_]+/gi,
    /authorization[=:\s]+"?[^"\s]+"?/gi,
  ]

  let sanitized = message
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SENSITIVE_DATA]')
  }

  return sanitized
}

/**
 * Sanitize error stack to remove sensitive file paths and data
 */
function sanitizeErrorStack(stack: string): string {
  // Remove absolute file paths that might contain usernames
  const sanitized = stack.replace(
    /\/Users\/[^\/\s]+|\/home\/[^\/\s]+|C:\\Users\\[^\\\s]+/g,
    '[USER_DIR]'
  )

  return sanitizeErrorMessage(sanitized)
}

/**
 * Detect if error is likely authentication-related
 */
function detectAuthError(message: string): boolean {
  const authKeywords = [
    'unauthorized', 'unauthenticated', 'forbidden', 'access denied',
    'invalid token', 'expired token', 'permission', 'auth', 'login',
    'session', 'credential'
  ]

  const lowerMessage = message.toLowerCase()
  return authKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Gather additional context for error reporting
 */
async function gatherErrorContext(context: Record<string, any>) {
  try {
    const enriched = {
      ...context,
      timestamp: new Date().toISOString(),
      // Add browser info if available
      ...(typeof window !== 'undefined' && {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    }

    return enriched
  } catch (error) {
    logger.warn('Failed to gather error context', error)
    return context
  }
}

/**
 * Batch log multiple errors (useful for error recovery scenarios)
 */
export async function logMultipleApplicationErrors(
  errors: Array<{ error: Error & { digest?: string }, context?: Record<string, any> }>
) {
  const results = await Promise.allSettled(
    errors.map(({ error, context }) =>
      logApplicationErrorWithContext(error, context || {})
    )
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  logger.info(`Batch error logging completed: ${successful} successful, ${failed} failed`)

  return { successful, failed, results }
}