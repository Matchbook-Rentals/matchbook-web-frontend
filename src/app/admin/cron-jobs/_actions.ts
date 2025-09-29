'use server'

import { checkRole } from '@/utils/roles'
import { auth } from '@clerk/nextjs/server'

export interface CronJobResult {
  success: boolean
  error?: string
  data?: any
  executionTime?: number
  message?: string
}

export interface CronJob {
  id: string
  name: string
  description: string
  endpoint: string
  lastRun?: Date
  status: 'idle' | 'running' | 'success' | 'error'
}

// Define available cron jobs
const CRON_JOBS: CronJob[] = [
  {
    id: 'check-unread-messages',
    name: 'Check Unread Messages',
    description: 'Creates notifications for unread messages older than 2 minutes',
    endpoint: '/api/cron/check-unread-messages',
    status: 'idle'
  },
  {
    id: 'process-rent-payments',
    name: 'Process Rent Payments',
    description: 'Processes all rent payments due today (runs at 1am Pacific)',
    endpoint: '/api/cron/process-rent-payments',
    status: 'idle'
  },
  {
    id: 'preview-rent-payments',
    name: 'Preview Rent Payments',
    description: 'Emails preview of tomorrow\'s rent payments to tyler.bennett52@gmail.com',
    endpoint: '/api/cron/preview-rent-payments',
    status: 'idle'
  }
]

export async function getCronJobs(): Promise<{
  success: boolean
  jobs?: CronJob[]
  error?: string
}> {
  try {
    // Check dev permissions
    const isDev = await checkRole('admin_dev')
    if (!isDev) {
      return { success: false, error: 'Unauthorized - Developer access required' }
    }

    return { success: true, jobs: CRON_JOBS }
  } catch (error) {
    console.error('Error getting cron jobs:', error)
    return { success: false, error: 'Failed to get cron jobs' }
  }
}

export async function triggerCronJob(jobId: string): Promise<CronJobResult> {
  try {
    // Check dev permissions
    const isDev = await checkRole('admin_dev')
    if (!isDev) {
      return { success: false, error: 'Unauthorized - Developer access required' }
    }

    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Authentication required' }
    }

    // Find the cron job
    const cronJob = CRON_JOBS.find(job => job.id === jobId)
    if (!cronJob) {
      return { success: false, error: 'Cron job not found' }
    }

    const startTime = Date.now()

    // Make request to the cron endpoint
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return { success: false, error: 'CRON_SECRET not configured' }
    }

    console.log(`Admin ${userId} triggering cron job: ${cronJob.name}`)

    const response = await fetch(`${baseUrl}${cronJob.endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    const executionTime = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        executionTime
      }
    }

    let responseData
    try {
      responseData = await response.json()
    } catch (parseError) {
      // If response isn't JSON, get text
      responseData = await response.text()
    }

    return {
      success: true,
      data: responseData,
      executionTime,
      message: `Successfully executed ${cronJob.name}`
    }

  } catch (error) {
    console.error('Error triggering cron job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger cron job'
    }
  }
}

export async function getCronJobHistory(jobId: string): Promise<{
  success: boolean
  history?: any[]
  error?: string
}> {
  try {
    // Check dev permissions
    const isDev = await checkRole('admin_dev')
    if (!isDev) {
      return { success: false, error: 'Unauthorized - Developer access required' }
    }

    // For now, return empty history since we don't store execution history
    // This can be extended to store execution logs in the database
    return { success: true, history: [] }
  } catch (error) {
    console.error('Error getting cron job history:', error)
    return { success: false, error: 'Failed to get cron job history' }
  }
}