'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prismadb'
import { checkRole } from '@/utils/roles'

export async function getVerifiedAccounts() {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    const verifiedUsers = await prisma.user.findMany({
      where: {
        medallionIdentityVerified: true,
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        medallionVerificationCompletedAt: 'desc',
      },
    })

    return verifiedUsers
  } catch (error) {
    console.error('Error fetching verified Medallion users:', error)
    throw new Error('Failed to fetch verified accounts')
  }
}

export async function getMedallionData(userId: string) {
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
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  } catch (error) {
    console.error('Error fetching Medallion data:', error)
    throw new Error('Failed to fetch user data')
  }
}

export async function resetUserVerification(userId: string) {
  if (!checkRole('admin_dev')) {
    throw new Error('Unauthorized')
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        medallionIdentityVerified: false,
        medallionUserId: null,
        medallionVerificationStatus: null,
        medallionVerificationStartedAt: null,
        medallionVerificationCompletedAt: null,
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
      },
    })

    revalidatePath('/admin/authenticate-integration')
    return updatedUser
  } catch (error) {
    console.error('Error resetting Medallion verification:', error)
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