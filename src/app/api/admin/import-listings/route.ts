import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { currentUser } from '@clerk/nextjs/server'

// Configure route for larger payloads
export const maxDuration = 60 // Maximum allowed for hobby plan
export const dynamic = 'force-dynamic'

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

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get the action type from query params
    const action = request.nextUrl.searchParams.get('action')

    // Parse the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    let importData: ImportData

    try {
      importData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // Handle validation action
    if (action === 'validate') {
      return handleValidation(importData)
    }

    // Handle import action
    if (action === 'import') {
      return await handleImport(importData, user.id)
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in import API:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

function handleValidation(importData: ImportData) {
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

  return NextResponse.json({
    isValid: issues.length === 0,
    listingCount: importData.listings?.length || 0,
    exportDate: importData.exportedAt || '',
    issues
  })
}

async function handleImport(importData: ImportData, userId: string) {
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
            userId, // Assign to importing user
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
              userId, // Assign to importing user
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

  return NextResponse.json({
    importedCount,
    skippedCount,
    errorCount,
    importedListings,
    errors
  })
}
