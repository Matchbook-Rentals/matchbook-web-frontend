'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'

interface ExportListingData {
  listing: any
  listingImages: any[]
  monthlyPricing: any[]
  bedrooms: any[]
  unavailablePeriods: any[]
  reviews: any[]
  pdfTemplates: any[]
}

interface ExportResult {
  success: boolean
  error?: string
  data?: {
    listings: ExportListingData[]
    exportedAt: string
    totalCount: number
  }
}

export async function exportAllListings(): Promise<ExportResult> {
  try {
    // Check admin permissions
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    console.log('🔄 Starting listing export...')

    // Fetch all non-deleted, non-test listings with all relations
    const listings = await prisma.listing.findMany({
      where: {
        deletedAt: null,
        isTestListing: false
      },
      include: {
        listingImages: {
          orderBy: { rank: 'asc' }
        },
        monthlyPricing: {
          orderBy: { months: 'asc' }
        },
        bedrooms: {
          orderBy: { bedroomNumber: 'asc' }
        },
        unavailablePeriods: {
          orderBy: { startDate: 'asc' }
        },
        reviews: {
          where: {
            reviewType: 'RENTER_TO_LISTING',
            isPublished: true
          },
          orderBy: { createdAt: 'desc' }
        },
        pdfTemplates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Found ${listings.length} listings to export`)

    // Transform data for export, removing sensitive/environment-specific fields
    const exportData: ExportListingData[] = listings.map(listing => {
      const {
        // Remove user ownership - will be reassigned on import
        userId,
        // Remove approval status - will need re-approval
        isApproved,
        approvalStatus,
        lastApprovalDecision,
        lastDecisionComment,
        // Remove third-party integrations
        hospitablePropertyId,
        boldSignTemplateId,
        // Remove soft delete fields
        deletedAt,
        deletedBy,
        // Remove trip association
        tripId,
        // Keep everything else
        ...listingData
      } = listing

      return {
        listing: {
          ...listingData,
          // Force these values for imported listings
          isTestListing: true,
          isApproved: false,
          approvalStatus: 'pendingReview',
          markedActiveByUser: true,
          status: 'available'
        },
        listingImages: listing.listingImages.map(img => ({
          url: img.url,
          category: img.category,
          rank: img.rank
        })),
        monthlyPricing: listing.monthlyPricing.map(pricing => ({
          months: pricing.months,
          price: pricing.price,
          utilitiesIncluded: pricing.utilitiesIncluded
        })),
        bedrooms: listing.bedrooms.map(bedroom => ({
          bedroomNumber: bedroom.bedroomNumber,
          bedType: bedroom.bedType
        })),
        unavailablePeriods: listing.unavailablePeriods.map(period => ({
          startDate: period.startDate,
          endDate: period.endDate,
          reason: period.reason
        })),
        reviews: listing.reviews.map(review => ({
          rating: review.rating,
          comment: review.comment,
          reviewType: review.reviewType,
          createdAt: review.createdAt,
          isPublished: review.isPublished
        })),
        pdfTemplates: listing.pdfTemplates.map(template => ({
          title: template.title,
          description: template.description,
          type: template.type,
          templateData: template.templateData,
          pdfFileUrl: template.pdfFileUrl,
          pdfFileName: template.pdfFileName,
          pdfFileSize: template.pdfFileSize,
          pdfFileKey: template.pdfFileKey
        }))
      }
    })

    console.log('✅ Export data transformed successfully')

    return {
      success: true,
      data: {
        listings: exportData,
        exportedAt: new Date().toISOString(),
        totalCount: exportData.length
      }
    }

  } catch (error) {
    console.error('❌ Error exporting listings:', error)
    return {
      success: false,
      error: `Failed to export listings: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function getExportStats() {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const stats = await prisma.listing.aggregate({
      where: {
        deletedAt: null,
        isTestListing: false
      },
      _count: true
    })

    const imageCount = await prisma.listingImage.count({
      where: {
        listing: {
          deletedAt: null,
          isTestListing: false
        }
      }
    })

    const pricingCount = await prisma.listingMonthlyPricing.count({
      where: {
        listing: {
          deletedAt: null,
          isTestListing: false
        }
      }
    })

    return {
      success: true,
      data: {
        totalListings: stats._count,
        totalImages: imageCount,
        totalPricingTiers: pricingCount
      }
    }

  } catch (error) {
    console.error('Error getting export stats:', error)
    return {
      success: false,
      error: `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}