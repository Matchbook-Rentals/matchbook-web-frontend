'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { currentUser } from '@clerk/nextjs/server'

interface ImportListingData {
  listing: any
  listingImages: any[]
  monthlyPricing: any[]
  bedrooms: any[]
  unavailablePeriods: any[]
  reviews: any[]
  pdfTemplates: any[]
}

interface ImportData {
  listings: ImportListingData[]
  exportedAt: string
  totalCount: number
}

interface ImportResult {
  success: boolean
  error?: string
  data?: {
    importedCount: number
    skippedCount: number
    errorCount: number
    importedListings: Array<{
      id: string
      title: string
      originalId?: string
    }>
    errors: string[]
  }
}

export async function importListings(importData: ImportData): Promise<ImportResult> {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    console.log(`🔄 Starting import of ${importData.listings.length} listings...`)

    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const importedListings: Array<{ id: string; title: string; originalId?: string }> = []
    const errors: string[] = []

    // Process each listing in a transaction for data integrity
    for (const listingData of importData.listings) {
      try {
        await prisma.$transaction(async (tx) => {
          const originalId = listingData.listing.id

          // Create the listing with all fields assigned to current user
          const createdListing = await tx.listing.create({
            data: {
              ...listingData.listing,
              id: undefined, // Let Prisma generate new ID
              userId: user.id, // Assign to importing user
              isTestListing: true, // Mark as test data
              isApproved: false, // Require re-approval
              approvalStatus: 'pendingReview',
              createdAt: new Date(),
              lastModified: new Date(),
              lastApprovalDecision: null,
              lastDecisionComment: `Imported from production on ${new Date().toISOString()}`
            }
          })

          // Create listing images
          if (listingData.listingImages.length > 0) {
            await tx.listingImage.createMany({
              data: listingData.listingImages.map(img => ({
                ...img,
                id: undefined,
                listingId: createdListing.id
              }))
            })
          }

          // Create monthly pricing
          if (listingData.monthlyPricing.length > 0) {
            await tx.listingMonthlyPricing.createMany({
              data: listingData.monthlyPricing.map(pricing => ({
                ...pricing,
                id: undefined,
                listingId: createdListing.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }))
            })
          }

          // Create bedrooms
          if (listingData.bedrooms.length > 0) {
            await tx.bedroom.createMany({
              data: listingData.bedrooms.map(bedroom => ({
                ...bedroom,
                id: undefined,
                listingId: createdListing.id
              }))
            })
          }

          // Create unavailable periods
          if (listingData.unavailablePeriods.length > 0) {
            await tx.listingUnavailability.createMany({
              data: listingData.unavailablePeriods.map(period => ({
                ...period,
                id: undefined,
                listingId: createdListing.id,
                startDate: new Date(period.startDate),
                endDate: new Date(period.endDate)
              }))
            })
          }

          // Create PDF templates
          if (listingData.pdfTemplates.length > 0) {
            await tx.pdfTemplate.createMany({
              data: listingData.pdfTemplates.map(template => ({
                ...template,
                id: undefined,
                userId: user.id, // Assign to importing user
                listingId: createdListing.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }))
            })
          }

          // Note: We skip importing reviews as they reference users who may not exist
          // in the staging environment. They could be imported separately if needed.

          importedListings.push({
            id: createdListing.id,
            title: createdListing.title,
            originalId
          })
          importedCount++

          console.log(`✅ Imported listing: ${createdListing.title} (${createdListing.id})`)
        })

      } catch (error) {
        errorCount++
        const errorMessage = `Failed to import listing "${listingData.listing.title}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
        errors.push(errorMessage)
        console.error(`❌ ${errorMessage}`)
      }
    }

    console.log(`📊 Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`)

    return {
      success: true,
      data: {
        importedCount,
        skippedCount,
        errorCount,
        importedListings,
        errors
      }
    }

  } catch (error) {
    console.error('❌ Error during import:', error)
    return {
      success: false,
      error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function validateImportFile(fileContent: string): Promise<{
  success: boolean
  error?: string
  data?: {
    isValid: boolean
    listingCount: number
    exportDate: string
    issues: string[]
  }
}> {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    // Parse JSON
    let importData: ImportData
    try {
      importData = JSON.parse(fileContent)
    } catch (error) {
      return {
        success: true,
        data: {
          isValid: false,
          listingCount: 0,
          exportDate: '',
          issues: ['Invalid JSON format']
        }
      }
    }

    const issues: string[] = []

    // Validate structure
    if (!importData.listings || !Array.isArray(importData.listings)) {
      issues.push('Missing or invalid listings array')
    }

    if (!importData.exportedAt) {
      issues.push('Missing export timestamp')
    }

    if (typeof importData.totalCount !== 'number') {
      issues.push('Missing or invalid total count')
    }

    // Validate each listing structure
    if (importData.listings) {
      importData.listings.forEach((listing, index) => {
        if (!listing.listing) {
          issues.push(`Listing ${index + 1}: Missing listing data`)
        }
        if (!listing.listing?.title) {
          issues.push(`Listing ${index + 1}: Missing title`)
        }
        if (!Array.isArray(listing.listingImages)) {
          issues.push(`Listing ${index + 1}: Invalid or missing listingImages array`)
        }
        if (!Array.isArray(listing.monthlyPricing)) {
          issues.push(`Listing ${index + 1}: Invalid or missing monthlyPricing array`)
        }
      })
    }

    return {
      success: true,
      data: {
        isValid: issues.length === 0,
        listingCount: importData.listings?.length || 0,
        exportDate: importData.exportedAt || '',
        issues
      }
    }

  } catch (error) {
    return {
      success: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function getImportStats() {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get current user's imported test listings
    const importedListings = await prisma.listing.count({
      where: {
        userId: user.id,
        isTestListing: true,
        deletedAt: null
      }
    })

    const totalImportedImages = await prisma.listingImage.count({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true,
          deletedAt: null
        }
      }
    })

    return {
      success: true,
      data: {
        currentImportedListings: importedListings,
        currentImportedImages: totalImportedImages
      }
    }

  } catch (error) {
    return {
      success: false,
      error: `Failed to get import stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}