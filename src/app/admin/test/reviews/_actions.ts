'use server'

import prisma from '@/lib/prismadb'
import { currentUser } from '@clerk/nextjs/server'
import { checkAdminAccess } from '@/utils/roles'

interface TestReviewScenarioResult {
  success: boolean
  error?: string
  data?: {
    listingId: string
    bookingId: string
    matchId: string
    reviewUrl: string
    testType: 'HOST_TO_RENTER' | 'RENTER_TO_LISTING'
  }
}

export async function createTestReviewScenario(testType: 'HOST_TO_RENTER' | 'RENTER_TO_LISTING'): Promise<TestReviewScenarioResult> {
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

    // Create a test listing owned by current user
    const testListing = await prisma.listing.create({
      data: {
        userId: user.id,
        isTestListing: true,
        isApproved: true,
        title: `Test Listing for Reviews - ${testType}`,
        description: 'This is a test listing created for review testing purposes.',
        category: 'apartment',
        roomCount: 2,
        bathroomCount: 1.5,
        guestCount: 4,
        streetAddress1: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        latitude: 34.0522,
        longitude: -118.2437,
      }
    })

    // Create monthly pricing for the test listing
    await prisma.listingMonthlyPricing.create({
      data: {
        listingId: testListing.id,
        months: 1,
        price: 2500,
        utilitiesIncluded: false
      }
    })

    // Create a test trip (required for match)
    const testTrip = await prisma.trip.create({
      data: {
        userId: user.id,
        locationString: 'Test City, CA',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        latitude: 34.0522,
        longitude: -118.2437,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
        numAdults: 1,
        numPets: 0,
        numChildren: 0
      }
    })

    // Create a test match record (required for booking)
    const testMatch = await prisma.match.create({
      data: {
        tripId: testTrip.id,
        listingId: testListing.id,
        monthlyRent: 2500
      }
    })

    // Create a test booking with current user as both host and renter (for testing)
    const testBooking = await prisma.booking.create({
      data: {
        userId: user.id, // Current user as renter
        listingId: testListing.id, // Listing owned by current user (so they're also the host)
        matchId: testMatch.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
        totalPrice: 2500,
        monthlyRent: 2500,
        status: 'completed' // Reviews typically only for completed bookings
      }
    })

    // Generate the appropriate review URL
    let reviewUrl: string
    if (testType === 'HOST_TO_RENTER') {
      reviewUrl = `/app/host/${testListing.id}/booking/${testBooking.id}/review`
    } else {
      reviewUrl = `/app/rent/${testBooking.id}/review`
    }

    return {
      success: true,
      data: {
        listingId: testListing.id,
        bookingId: testBooking.id,
        matchId: testMatch.id,
        reviewUrl,
        testType
      }
    }

  } catch (error) {
    console.error('Error creating test review scenario:', error)
    return {
      success: false,
      error: `Failed to create test scenario: ${error.message}`
    }
  }
}

export async function getTestReviewData() {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get test listings and bookings created by current user
    const testListings = await prisma.listing.findMany({
      where: {
        userId: user.id,
        isTestListing: true
      },
      include: {
        bookings: {
          include: {
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return {
      success: true,
      data: testListings
    }

  } catch (error) {
    console.error('Error fetching test review data:', error)
    return {
      success: false,
      error: `Failed to fetch test data: ${error.message}`
    }
  }
}

export async function cleanupTestReviewData() {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Delete test data in correct order (due to foreign key constraints)

    // First, delete reviews associated with test bookings
    const testBookings = await prisma.booking.findMany({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true
        }
      },
      select: { id: true }
    })

    const testBookingIds = testBookings.map(b => b.id)

    if (testBookingIds.length > 0) {
      await prisma.review.deleteMany({
        where: {
          bookingId: {
            in: testBookingIds
          }
        }
      })
    }

    // Delete test bookings
    await prisma.booking.deleteMany({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true
        }
      }
    })

    // Delete test matches (first get trips to delete them after)
    const testMatches = await prisma.match.findMany({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true
        }
      },
      select: { tripId: true }
    })

    await prisma.match.deleteMany({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true
        }
      }
    })

    // Delete test trips
    const testTripIds = testMatches.map(m => m.tripId)
    if (testTripIds.length > 0) {
      await prisma.trip.deleteMany({
        where: {
          id: {
            in: testTripIds
          }
        }
      })
    }

    // Delete test listing pricing
    await prisma.listingMonthlyPricing.deleteMany({
      where: {
        listing: {
          userId: user.id,
          isTestListing: true
        }
      }
    })

    // Delete test listings
    const deletedListings = await prisma.listing.deleteMany({
      where: {
        userId: user.id,
        isTestListing: true
      }
    })

    return {
      success: true,
      message: `Cleaned up ${deletedListings.count} test listings and associated data`
    }

  } catch (error) {
    console.error('Error cleaning up test review data:', error)
    return {
      success: false,
      error: `Failed to cleanup test data: ${error.message}`
    }
  }
}