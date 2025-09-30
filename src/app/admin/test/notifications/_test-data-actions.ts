'use server'

import prisma from '@/lib/prismadb'
import { checkAdminAccess } from '@/utils/roles'
import { currentUser } from '@clerk/nextjs/server'

export async function createTestConversationData() {
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) return { success: false, error: 'Unauthorized - Admin access required' }

  try {
    // Get current admin user's email to use as test host recipient
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return { success: false, error: 'User not authenticated' }
    }

    const adminEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!adminEmail) {
      return { success: false, error: 'Admin email not found' }
    }

    // 1. Find or create test host user using admin's real email (so they receive notifications)
    let testHost = await prisma.user.findFirst({
      where: { email: adminEmail }
    })

    if (!testHost) {
      testHost = await prisma.user.create({
        data: {
          id: 'test-host-' + Date.now(),
          email: adminEmail,
          firstName: 'Michael',
          lastName: 'Chen',
          fullName: 'Michael Chen'
        }
      })
    }

    // 2. Find or create test renter user
    let testRenter = await prisma.user.findFirst({
      where: { email: 'test-renter@matchbook-test.local' }
    })

    if (!testRenter) {
      testRenter = await prisma.user.create({
        data: {
          id: 'test-renter-' + Date.now(),
          email: 'test-renter@matchbook-test.local',
          firstName: 'Sarah',
          lastName: 'Johnson',
          fullName: 'Sarah Johnson'
        }
      })
    }

    // 3. Create test listing
    const testListing = await prisma.listing.create({
      data: {
        userId: testHost.id,
        title: 'Cozy 2BR Downtown Apartment',
        description: 'Beautiful apartment with modern amenities and great location',
        isTestListing: true,
        roomCount: 2,
        bathroomCount: 1,
        shortestLeasePrice: 2000,
        longestLeasePrice: 1800,
        city: 'Test City',
        state: 'TS',
        latitude: 0,
        longitude: 0
      }
    })

    return {
      success: true,
      data: {
        hostId: testHost.id,
        hostEmail: testHost.email,
        renterId: testRenter.id,
        renterEmail: testRenter.email,
        listingId: testListing.id,
        listingTitle: testListing.title
      }
    }
  } catch (error) {
    console.error('Error creating test conversation data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create test data'
    }
  }
}
