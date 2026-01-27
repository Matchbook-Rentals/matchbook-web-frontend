import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { currentUser } from '@clerk/nextjs/server'

// Development-only endpoint for importing large listing files
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const importData = await request.json()

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

          // Destructure to remove fields we don't want to copy
          const {
            id: _id,
            userId: _userId,
            createdAt: _createdAt,
            lastModified: _lastModified,
            lastApprovalDecision: _lastApprovalDecision,
            deletedAt: _deletedAt,
            deletedBy: _deletedBy,
            // Remove nested relations - these can't be passed to create
            listingImages: _listingImages,
            monthlyPricing: _monthlyPricing,
            bedrooms: _bedrooms,
            unavailablePeriods: _unavailablePeriods,
            reviews: _reviews,
            pdfTemplates: _pdfTemplates,
            ...listingFields
          } = listingData.listing

          // Create the listing with all fields assigned to current user
          const createdListing = await tx.listing.create({
            data: {
              ...listingFields,
              userId: user.id,
              isTestListing: true,
              isApproved: false,
              approvalStatus: 'pendingReview',
              createdAt: new Date(),
              lastModified: new Date(),
              lastDecisionComment: `Imported from production on ${new Date().toISOString()}`
            }
          })

          // Create listing images
          if (listingData.listingImages.length > 0) {
            await tx.listingImage.createMany({
              data: listingData.listingImages.map((img: any) => {
                const { id: _id, listingId: _listingId, ...imgFields } = img
                return { ...imgFields, listingId: createdListing.id }
              })
            })
          }

          // Create monthly pricing
          if (listingData.monthlyPricing.length > 0) {
            await tx.listingMonthlyPricing.createMany({
              data: listingData.monthlyPricing.map((pricing: any) => {
                const { id: _id, listingId: _listingId, createdAt: _c, updatedAt: _u, ...pricingFields } = pricing
                return {
                  ...pricingFields,
                  listingId: createdListing.id,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              })
            })
          }

          // Create bedrooms
          if (listingData.bedrooms.length > 0) {
            await tx.bedroom.createMany({
              data: listingData.bedrooms.map((bedroom: any) => {
                const { id: _id, listingId: _listingId, ...bedroomFields } = bedroom
                return { ...bedroomFields, listingId: createdListing.id }
              })
            })
          }

          // Create unavailable periods
          if (listingData.unavailablePeriods.length > 0) {
            await tx.listingUnavailability.createMany({
              data: listingData.unavailablePeriods.map((period: any) => {
                const { id: _id, listingId: _listingId, ...periodFields } = period
                return {
                  ...periodFields,
                  listingId: createdListing.id,
                  startDate: new Date(period.startDate),
                  endDate: new Date(period.endDate)
                }
              })
            })
          }

          // Create PDF templates
          if (listingData.pdfTemplates.length > 0) {
            await tx.pdfTemplate.createMany({
              data: listingData.pdfTemplates.map((template: any) => {
                const { id: _id, listingId: _listingId, userId: _userId, createdAt: _c, updatedAt: _u, ...templateFields } = template
                return {
                  ...templateFields,
                  userId: user.id,
                  listingId: createdListing.id,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              })
            })
          }

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
      success: true,
      data: {
        importedCount,
        skippedCount,
        errorCount,
        importedListings,
        errors
      }
    })

  } catch (error) {
    console.error('❌ Error during import:', error)
    return NextResponse.json(
      { success: false, error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
