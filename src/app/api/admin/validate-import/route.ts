import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/utils/roles'

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
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'Development only' },
      { status: 403 }
    )
  }

  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    let importData: ImportData
    try {
      importData = await request.json()
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          listingCount: 0,
          exportDate: '',
          issues: ['Invalid JSON format']
        }
      })
    }

    const issues: string[] = []

    if (!importData.listings || !Array.isArray(importData.listings)) {
      issues.push('Missing or invalid listings array')
    }

    if (!importData.exportedAt) {
      issues.push('Missing export timestamp')
    }

    if (typeof importData.totalCount !== 'number') {
      issues.push('Missing or invalid total count')
    }

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
      success: true,
      data: {
        isValid: issues.length === 0,
        listingCount: importData.listings?.length || 0,
        exportDate: importData.exportedAt || '',
        issues
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
