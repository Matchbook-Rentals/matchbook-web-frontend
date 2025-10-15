'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'

export async function getVerifiedAccounts() {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    // Get users verified by EITHER Medallion OR Stripe Identity
    const verifiedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { medallionIdentityVerified: true },
          { stripeVerificationStatus: 'verified' },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        medallionIdentityVerified: true,
        medallionUserId: true,
        medallionVerificationStatus: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
        stripeVerificationStatus: true,
        stripeVerificationSessionId: true,
        stripeVerificationReportId: true,
        stripeVerificationLastCheck: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return verifiedUsers
  } catch (error) {
    console.error('Error fetching verified users:', error)
    throw new Error('Failed to fetch verified accounts')
  }
}

export async function getVerificationData(userId: string) {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        medallionIdentityVerified: true,
        medallionUserId: true,
        medallionVerificationStatus: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
        stripeVerificationStatus: true,
        stripeVerificationSessionId: true,
        stripeVerificationReportId: true,
        stripeVerificationLastCheck: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  } catch (error) {
    console.error('Error fetching verification data:', error)
    throw new Error('Failed to fetch user data')
  }
}

// Legacy function name for backward compatibility
export async function getMedallionData(userId: string) {
  return getVerificationData(userId)
}

export async function resetUserVerification(userId: string) {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    // Reset BOTH Medallion AND Stripe Identity verification
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Reset Medallion fields
        medallionIdentityVerified: false,
        medallionUserId: null,
        medallionVerificationStatus: null,
        medallionVerificationStartedAt: null,
        medallionVerificationCompletedAt: null,
        // Reset Stripe Identity fields
        stripeVerificationStatus: null,
        stripeVerificationSessionId: null,
        stripeVerificationReportId: null,
        stripeVerificationLastCheck: null,
        stripeIdentityPayload: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        medallionIdentityVerified: true,
        medallionUserId: true,
        medallionVerificationStatus: true,
        medallionVerificationStartedAt: true,
        medallionVerificationCompletedAt: true,
        stripeVerificationStatus: true,
        stripeVerificationSessionId: true,
        stripeVerificationReportId: true,
        stripeVerificationLastCheck: true,
      },
    })

    revalidatePath('/admin/authenticate-integration')
    return updatedUser
  } catch (error) {
    console.error('Error resetting verification:', error)
    throw new Error('Failed to reset verification')
  }
}

export async function testVerification(userEmail: string, firstName: string, lastName: string) {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    const response = await fetch('/api/medallion/initiate-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        firstName,
        lastName,
        isTestMode: false, // Use real verification by default (change to true for mock mode)
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Verification failed')
    }

    revalidatePath('/admin/authenticate-integration')
    return result
  } catch (error) {
    console.error('Error running test verification:', error)
    throw new Error('Failed to run test verification')
  }
}