'use server'

import prisma from '@/lib/prismadb'

export interface ReferralData {
  id: string
  referrer: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  }
  referredUser: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  }
  status: string
  qualifiedAt: Date | null
  qualifyingBookingId: string | null
  payoutQuarter: string | null
  rewardAmount: number
  createdAt: Date
}

export interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  pendingPayoutAmount: number
}

interface GetReferralsParams {
  page: number
  pageSize: number
  status?: string
  quarter?: string
  search?: string
}

export async function getReferrals({
  page,
  pageSize,
  status,
  quarter,
  search
}: GetReferralsParams): Promise<{ referrals: ReferralData[]; totalCount: number }> {
  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (quarter && quarter !== 'all') {
    where.payoutQuarter = quarter
  }

  if (search) {
    where.OR = [
      { referrer: { email: { contains: search } } },
      { referrer: { firstName: { contains: search } } },
      { referrer: { lastName: { contains: search } } },
      { referredUser: { email: { contains: search } } },
      { referredUser: { firstName: { contains: search } } },
      { referredUser: { lastName: { contains: search } } },
    ]
  }

  const [referrals, totalCount] = await Promise.all([
    prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        referredUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.referral.count({ where })
  ])

  return { referrals, totalCount }
}

export async function getReferralStats(): Promise<ReferralStats> {
  const [
    totalReferrals,
    pendingReferrals,
    qualifiedReferrals,
    pendingPayoutAgg,
  ] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { status: 'pending' } }),
    prisma.referral.count({ where: { status: 'qualified' } }),
    prisma.referral.aggregate({
      where: { status: 'qualified' },
      _sum: { rewardAmount: true }
    }),
  ])

  return {
    totalReferrals,
    pendingReferrals,
    qualifiedReferrals,
    pendingPayoutAmount: pendingPayoutAgg._sum.rewardAmount || 0,
  }
}

export async function getPayoutQuarters(): Promise<string[]> {
  const quarters = await prisma.referral.findMany({
    where: { payoutQuarter: { not: null } },
    select: { payoutQuarter: true },
    distinct: ['payoutQuarter'],
    orderBy: { payoutQuarter: 'desc' }
  })

  return quarters.map(q => q.payoutQuarter!).filter(Boolean)
}

export async function exportReferralsCsv(filters: {
  status?: string
  quarter?: string
}): Promise<string> {
  const where: any = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters.quarter && filters.quarter !== 'all') {
    where.payoutQuarter = filters.quarter
  }

  const referrals = await prisma.referral.findMany({
    where,
    include: {
      referrer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      },
      referredUser: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const headers = [
    'Referrer Name',
    'Referrer Email',
    'Referred Host Name',
    'Referred Host Email',
    'Status',
    'Signup Date',
    'Qualified Date',
    'Qualifying Booking ID',
    'Payout Quarter',
    'Reward Amount'
  ]

  const rows = referrals.map(r => [
    `${r.referrer.firstName || ''} ${r.referrer.lastName || ''}`.trim(),
    r.referrer.email || '',
    `${r.referredUser.firstName || ''} ${r.referredUser.lastName || ''}`.trim(),
    r.referredUser.email || '',
    r.status,
    r.createdAt.toISOString().split('T')[0],
    r.qualifiedAt?.toISOString().split('T')[0] || '',
    r.qualifyingBookingId || '',
    r.payoutQuarter || '',
    (r.rewardAmount / 100).toFixed(2)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}
