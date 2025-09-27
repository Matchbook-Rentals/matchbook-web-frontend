'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath, revalidateTag } from 'next/cache'

interface UserSearchResult {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    fullName?: string
  }
}

interface ApplicationSummary {
  success: boolean
  error?: string
  data?: {
    userId: string
    userEmail: string
    applicationCount: number
    applications: Array<{
      id: string
      isDefault: boolean
      isComplete: boolean
      tripId?: string
      createdAt: Date
      identificationCount: number
      incomeCount: number
      residentialHistoryCount: number
      verificationImageCount: number
    }>
  }
}

interface ResetResult {
  success: boolean
  error?: string
  data?: {
    deletedApplications: number
    deletedIdentifications: number
    deletedIncomes: number
    deletedResidentialHistories: number
    deletedVerificationImages: number
    deletedIDPhotos: number
  }
}

export async function searchUserByEmail(email: string): Promise<UserSearchResult> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    if (!email || email.trim().length === 0) {
      return { success: false, error: 'Email is required' }
    }

    // Search in Clerk first
    const client = clerkClient

    try {
      const clerkUsers = await client.users.getUserList({
        emailAddress: [email.trim().toLowerCase()]
      })

      if (clerkUsers.totalCount === 0) {
        return { success: false, error: 'User not found in authentication system' }
      }

      const clerkUser = clerkUsers.data[0]

      return {
        success: true,
        user: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || email,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined
        }
      }
    } catch (clerkError) {
      console.error('Clerk search error:', clerkError)
      return { success: false, error: 'Failed to search user in authentication system' }
    }

  } catch (error) {
    console.error('Error searching user:', error)
    return {
      success: false,
      error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function searchUserById(userId: string): Promise<UserSearchResult> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    if (!userId || userId.trim().length === 0) {
      return { success: false, error: 'User ID is required' }
    }

    // Search in Clerk
    const client = clerkClient

    try {
      const clerkUser = await client.users.getUser(userId.trim())

      return {
        success: true,
        user: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || undefined
        }
      }
    } catch (clerkError) {
      console.error('Clerk user lookup error:', clerkError)
      return { success: false, error: 'User not found in authentication system' }
    }

  } catch (error) {
    console.error('Error searching user by ID:', error)
    return {
      success: false,
      error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function getUserApplicationSummary(userId: string): Promise<ApplicationSummary> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Get user email from Clerk for display
    let userEmail = 'Unknown'
    try {
      const client = clerkClient
      const clerkUser = await client.users.getUser(userId)
      userEmail = clerkUser.emailAddresses[0]?.emailAddress || 'No email'
    } catch (error) {
      console.warn('Could not fetch user email from Clerk:', error)
    }

    // Get all applications for the user with related data counts
    const applications = await prisma.application.findMany({
      where: {
        userId: userId
      },
      include: {
        identifications: {
          include: {
            idPhotos: true
          }
        },
        incomes: true,
        residentialHistories: true,
        verificationImages: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const applicationSummary = applications.map(app => ({
      id: app.id,
      isDefault: app.isDefault || false,
      isComplete: app.isComplete,
      tripId: app.tripId || undefined,
      createdAt: app.createdAt,
      identificationCount: app.identifications.length,
      incomeCount: app.incomes.length,
      residentialHistoryCount: app.residentialHistories.length,
      verificationImageCount: app.verificationImages.length
    }))

    return {
      success: true,
      data: {
        userId,
        userEmail,
        applicationCount: applications.length,
        applications: applicationSummary
      }
    }

  } catch (error) {
    console.error('Error getting application summary:', error)
    return {
      success: false,
      error: `Failed to get application data: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function resetUserApplications(userId: string): Promise<ResetResult> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    console.log(`🔄 Starting application reset for user: ${userId}`)

    // First, let's see what applications exist before deletion
    const preDeleteApplications = await prisma.application.findMany({
      where: { userId },
      include: {
        identifications: true,
        incomes: true,
        residentialHistories: true,
        verificationImages: true
      }
    })

    console.log(`📊 [PRE-DELETE] Found ${preDeleteApplications.length} applications for user ${userId}:`,
      preDeleteApplications.map(app => ({
        id: app.id,
        isDefault: app.isDefault,
        isComplete: app.isComplete,
        firstName: app.firstName,
        lastName: app.lastName,
        createdAt: app.createdAt
      }))
    )

    // Delete all applications and related data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get applications with all related data for counting
      const applications = await tx.application.findMany({
        where: { userId },
        include: {
          identifications: {
            include: {
              idPhotos: true
            }
          },
          incomes: true,
          residentialHistories: true,
          verificationImages: true
        }
      })

      if (applications.length === 0) {
        return {
          applications: 0,
          identifications: 0,
          incomes: 0,
          residentialHistories: 0,
          verificationImages: 0,
          idPhotos: 0
        }
      }

      // Count all related data before deletion
      let idPhotosCount = 0
      let identificationsCount = 0
      let incomesCount = 0
      let residentialHistoriesCount = 0
      let verificationImagesCount = 0

      applications.forEach(app => {
        identificationsCount += app.identifications.length
        incomesCount += app.incomes.length
        residentialHistoriesCount += app.residentialHistories.length
        verificationImagesCount += app.verificationImages.length

        app.identifications.forEach(id => {
          idPhotosCount += id.idPhotos.length
        })
      })

      const applicationIds = applications.map(app => app.id)

      // Delete in correct order to avoid foreign key violations
      // 1. Delete ID Photos (children of Identifications)
      await tx.iDPhoto.deleteMany({
        where: {
          identification: {
            applicationId: { in: applicationIds }
          }
        }
      })

      // 2. Delete Identifications
      await tx.identification.deleteMany({
        where: {
          applicationId: { in: applicationIds }
        }
      })

      // 3. Delete Incomes
      await tx.income.deleteMany({
        where: {
          applicationId: { in: applicationIds }
        }
      })

      // 4. Delete Verification Images
      await tx.verificationImage.deleteMany({
        where: {
          applicationId: { in: applicationIds }
        }
      })

      // 5. Delete Residential Histories
      await tx.residentialHistory.deleteMany({
        where: {
          applicationId: { in: applicationIds }
        }
      })

      // 6. Finally delete Applications
      console.log(`🗑️ [DELETING] About to delete ${applications.length} applications for user ${userId}`)
      const deleteApplicationResult = await tx.application.deleteMany({
        where: {
          userId: userId
        }
      })
      console.log(`✅ [DELETED] Successfully deleted ${deleteApplicationResult.count} applications`)

      return {
        applications: applications.length,
        identifications: identificationsCount,
        incomes: incomesCount,
        residentialHistories: residentialHistoriesCount,
        verificationImages: verificationImagesCount,
        idPhotos: idPhotosCount
      }
    })

    // Verify deletion worked
    const postDeleteApplications = await prisma.application.findMany({
      where: { userId }
    })
    console.log(`📊 [POST-DELETE] Found ${postDeleteApplications.length} applications remaining for user ${userId}`)

    if (postDeleteApplications.length > 0) {
      console.error(`❌ [ERROR] Applications still exist after deletion:`,
        postDeleteApplications.map(app => ({ id: app.id, firstName: app.firstName, isComplete: app.isComplete }))
      )
    }

    console.log(`✅ Deleted ${result.applications} applications for user ${userId}`)
    console.log(`📊 Related data deleted: ${result.identifications} identifications, ${result.incomes} incomes, ${result.residentialHistories} residential histories, ${result.verificationImages} verification images, ${result.idPhotos} ID photos`)

    // Revalidate Next.js cache to ensure fresh data is loaded
    try {
      revalidateTag('user-trips')
      revalidatePath('/app/rent/searches/[tripId]', 'layout')
      console.log('🔄 Cache revalidated after application deletion')
    } catch (revalidateError) {
      console.warn('⚠️ Failed to revalidate cache:', revalidateError)
    }

    return {
      success: true,
      data: {
        deletedApplications: result.applications,
        deletedIdentifications: result.identifications,
        deletedIncomes: result.incomes,
        deletedResidentialHistories: result.residentialHistories,
        deletedVerificationImages: result.verificationImages,
        deletedIDPhotos: result.idPhotos
      }
    }

  } catch (error) {
    console.error('❌ Error resetting user applications:', error)
    return {
      success: false,
      error: `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function deleteSpecificApplication(applicationId: string): Promise<ResetResult> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    console.log(`🔄 Deleting specific application: ${applicationId}`)

    // Delete application and related data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get application with all related data for counting
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: {
          identifications: {
            include: {
              idPhotos: true
            }
          },
          incomes: true,
          residentialHistories: true,
          verificationImages: true
        }
      })

      if (!application) {
        throw new Error('Application not found')
      }

      const beforeCounts = {
        identifications: application.identifications.length,
        incomes: application.incomes.length,
        residentialHistories: application.residentialHistories.length,
        verificationImages: application.verificationImages.length,
        idPhotos: application.identifications.reduce((total, id) => total + id.idPhotos.length, 0)
      }

      // Delete in correct order to avoid foreign key violations
      // 1. Delete ID Photos (children of Identifications)
      await tx.iDPhoto.deleteMany({
        where: {
          identification: {
            applicationId: applicationId
          }
        }
      })

      // 2. Delete Identifications
      await tx.identification.deleteMany({
        where: {
          applicationId: applicationId
        }
      })

      // 3. Delete Incomes
      await tx.income.deleteMany({
        where: {
          applicationId: applicationId
        }
      })

      // 4. Delete Verification Images
      await tx.verificationImage.deleteMany({
        where: {
          applicationId: applicationId
        }
      })

      // 5. Delete Residential Histories
      await tx.residentialHistory.deleteMany({
        where: {
          applicationId: applicationId
        }
      })

      // 6. Finally delete Application
      await tx.application.delete({
        where: { id: applicationId }
      })

      return beforeCounts
    })

    console.log(`✅ Deleted application ${applicationId}`)

    return {
      success: true,
      data: {
        deletedApplications: 1,
        deletedIdentifications: result.identifications,
        deletedIncomes: result.incomes,
        deletedResidentialHistories: result.residentialHistories,
        deletedVerificationImages: result.verificationImages,
        deletedIDPhotos: result.idPhotos
      }
    }

  } catch (error) {
    console.error('❌ Error deleting specific application:', error)
    return {
      success: false,
      error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}