'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import prismadb from '@/lib/prismadb'
import { redirect } from 'next/navigation'

interface DisputeData {
  id: string
  stripeDisputeId: string
  stripeChargeId: string
  stripePaymentIntentId: string | null
  amount: number
  currency: string
  reason: string
  status: string
  dueBy: Date | null
  createdAt: Date
  resolvedAt: Date | null
  matchId: string | null
  bookingId: string | null
  userId: string
  adminNotifiedAt: Date | null
  adminAssignedTo: string | null
  adminNotes: string | null
  booking?: {
    id: string
    status: string
  } | null
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

interface RefundData {
  id: string
  stripeRefundId: string
  stripeChargeId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  reason: string | null
  status: string
  refundType: string
  createdAt: Date
  processedAt: Date | null
  matchId: string | null
  bookingId: string | null
  userId: string
  initiatedBy: string
  initiatorId: string | null
  booking?: {
    id: string
    status: string
  } | null
  user: {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
  }
}

export async function getDisputes(): Promise<DisputeData[]> {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const disputes = await prismadb.stripeDispute.findMany({
    include: {
      booking: {
        select: {
          id: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return disputes as DisputeData[]
}

export async function getRefunds(): Promise<RefundData[]> {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const refunds = await prismadb.refund.findMany({
    include: {
      booking: {
        select: {
          id: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return refunds as RefundData[]
}

export async function updateDisputeNotes(disputeId: string, notes: string): Promise<{ success: boolean; error?: string }> {
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
    await prismadb.stripeDispute.update({
      where: { id: disputeId },
      data: {
        adminNotes: notes,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error updating dispute notes:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}

export async function assignDisputeToAdmin(disputeId: string, adminUserId: string): Promise<{ success: boolean; error?: string }> {
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
    await prismadb.stripeDispute.update({
      where: { id: disputeId },
      data: {
        adminAssignedTo: adminUserId,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error assigning dispute:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}
