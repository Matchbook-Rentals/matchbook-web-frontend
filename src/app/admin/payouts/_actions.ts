'use server'

import prisma from '@/lib/prismadb'

export interface PayoutUserData {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
}

export interface PayoutData {
  id: string | null // null for pending payouts that don't have a record yet
  user: PayoutUserData
  quarter: string
  amount: number
  referralCount: number
  status: 'pending' | 'paid'
  paidAt: Date | null
  paymentMethod: string | null
  paymentReference: string | null
  notes: string | null
}

export interface PayoutStats {
  totalPendingUsers: number
  totalPendingAmount: number
  totalPaidUsers: number
  totalPaidAmount: number
}

interface GetPayoutsParams {
  quarter?: string
  status?: string
}

/**
 * Get payout data aggregated by user and quarter
 * Shows both existing Payout records (paid) and aggregated qualified referrals (pending)
 */
export async function getPayouts({ quarter, status }: GetPayoutsParams): Promise<PayoutData[]> {
  const payouts: PayoutData[] = []

  // Get all existing Payout records (paid ones)
  if (!status || status === 'all' || status === 'paid') {
    const paidPayouts = await prisma.payout.findMany({
      where: {
        ...(quarter && quarter !== 'all' ? { quarter } : {}),
        ...(status === 'paid' ? { status: 'paid' } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ quarter: 'desc' }, { paidAt: 'desc' }],
    })

    for (const payout of paidPayouts) {
      payouts.push({
        id: payout.id,
        user: payout.user,
        quarter: payout.quarter,
        amount: payout.amount,
        referralCount: payout.referralCount,
        status: payout.status as 'pending' | 'paid',
        paidAt: payout.paidAt,
        paymentMethod: payout.paymentMethod,
        paymentReference: payout.paymentReference,
        notes: payout.notes,
      })
    }
  }

  // Get aggregated qualified referrals that don't have a payout yet (pending)
  if (!status || status === 'all' || status === 'pending') {
    const pendingReferrals = await prisma.referral.groupBy({
      by: ['referrerId', 'payoutQuarter'],
      where: {
        status: 'qualified',
        payoutId: null, // Not yet linked to a payout
        payoutQuarter: quarter && quarter !== 'all' ? quarter : { not: null },
      },
      _sum: {
        rewardAmount: true,
      },
      _count: {
        id: true,
      },
    })

    // Get user details for each pending payout
    const userIds = [...new Set(pendingReferrals.map(r => r.referrerId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    for (const referral of pendingReferrals) {
      if (!referral.payoutQuarter) continue

      const user = userMap.get(referral.referrerId)
      if (!user) continue

      payouts.push({
        id: null, // No payout record yet
        user,
        quarter: referral.payoutQuarter,
        amount: referral._sum.rewardAmount || 0,
        referralCount: referral._count.id,
        status: 'pending',
        paidAt: null,
        paymentMethod: null,
        paymentReference: null,
        notes: null,
      })
    }
  }

  // Sort by quarter desc, then status (pending first), then user name
  payouts.sort((a, b) => {
    if (a.quarter !== b.quarter) {
      return b.quarter.localeCompare(a.quarter)
    }
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }
    const aName = `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim()
    const bName = `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim()
    return aName.localeCompare(bName)
  })

  return payouts
}

/**
 * Get payout statistics for a specific quarter (or all time)
 */
export async function getPayoutStats(quarter?: string): Promise<PayoutStats> {
  const quarterFilter = quarter && quarter !== 'all' ? { payoutQuarter: quarter } : { payoutQuarter: { not: null } }

  // Pending: qualified referrals not yet linked to a payout
  const pendingAgg = await prisma.referral.aggregate({
    where: {
      status: 'qualified',
      payoutId: null,
      ...quarterFilter,
    },
    _sum: { rewardAmount: true },
  })

  const pendingUsers = await prisma.referral.groupBy({
    by: ['referrerId'],
    where: {
      status: 'qualified',
      payoutId: null,
      ...quarterFilter,
    },
  })

  // Paid: from Payout records
  const paidPayouts = await prisma.payout.aggregate({
    where: {
      status: 'paid',
      ...(quarter && quarter !== 'all' ? { quarter } : {}),
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  return {
    totalPendingUsers: pendingUsers.length,
    totalPendingAmount: pendingAgg._sum.rewardAmount || 0,
    totalPaidUsers: paidPayouts._count.id,
    totalPaidAmount: paidPayouts._sum.amount || 0,
  }
}

/**
 * Get all quarters from Q1 2025 to current quarter
 */
export async function getPayoutQuarters(): Promise<string[]> {
  const startYear = 2025
  const startQuarter = 1

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)

  const quarters: string[] = []

  for (let year = startYear; year <= currentYear; year++) {
    const maxQ = year === currentYear ? currentQuarter : 4
    const minQ = year === startYear ? startQuarter : 1

    for (let q = minQ; q <= maxQ; q++) {
      quarters.push(`${year}-Q${q}`)
    }
  }

  // Return in reverse order (most recent first)
  return quarters.reverse()
}

interface MarkPayoutPaidParams {
  userId: string
  quarter: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
}

/**
 * Mark a user's qualified referrals for a quarter as paid
 * Creates or updates a Payout record and links all qualified referrals
 */
export async function markPayoutPaid({
  userId,
  quarter,
  paymentMethod,
  paymentReference,
  notes,
}: MarkPayoutPaidParams): Promise<void> {
  // Get all qualified referrals for this user and quarter that aren't already paid
  const referrals = await prisma.referral.findMany({
    where: {
      referrerId: userId,
      payoutQuarter: quarter,
      status: 'qualified',
      payoutId: null,
    },
  })

  if (referrals.length === 0) {
    throw new Error('No qualified referrals found for this user and quarter')
  }

  const totalAmount = referrals.reduce((sum, r) => sum + r.rewardAmount, 0)

  // Create or update the Payout record
  const payout = await prisma.payout.upsert({
    where: {
      userId_quarter: {
        userId,
        quarter,
      },
    },
    create: {
      userId,
      quarter,
      amount: totalAmount,
      referralCount: referrals.length,
      status: 'paid',
      paidAt: new Date(),
      paymentMethod,
      paymentReference,
      notes,
    },
    update: {
      amount: totalAmount,
      referralCount: referrals.length,
      status: 'paid',
      paidAt: new Date(),
      paymentMethod,
      paymentReference,
      notes,
    },
  })

  // Link all referrals to this payout
  await prisma.referral.updateMany({
    where: {
      id: { in: referrals.map(r => r.id) },
    },
    data: {
      payoutId: payout.id,
    },
  })
}

/**
 * Unmark a payout as paid (revert to pending)
 * Removes the payout record and unlinks all referrals
 */
export async function unmarkPayoutPaid(payoutId: string): Promise<void> {
  // Unlink all referrals from this payout
  await prisma.referral.updateMany({
    where: { payoutId },
    data: { payoutId: null },
  })

  // Delete the payout record
  await prisma.payout.delete({
    where: { id: payoutId },
  })
}

/**
 * Export payouts to CSV
 */
export async function exportPayoutsCsv(filters: { quarter?: string; status?: string }): Promise<string> {
  const payouts = await getPayouts(filters)

  const headers = [
    'Referrer Name',
    'Referrer Email',
    'Quarter',
    '# Referrals',
    'Amount',
    'Status',
    'Paid Date',
    'Payment Method',
    'Reference',
    'Notes',
  ]

  const rows = payouts.map(p => [
    `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim(),
    p.user.email || '',
    p.quarter,
    p.referralCount.toString(),
    (p.amount / 100).toFixed(2),
    p.status,
    p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : '',
    p.paymentMethod || '',
    p.paymentReference || '',
    p.notes || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Helper to get current quarter string
 */
export async function getCurrentQuarter(): Promise<string> {
  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${quarter}`
}

/**
 * Helper to get previous quarter string
 */
export async function getPreviousQuarter(): Promise<string> {
  const now = new Date()
  let quarter = Math.ceil((now.getMonth() + 1) / 3) - 1
  let year = now.getFullYear()
  if (quarter === 0) {
    quarter = 4
    year -= 1
  }
  return `${year}-Q${quarter}`
}
