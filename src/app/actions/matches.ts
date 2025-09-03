'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent'
import { Trip, Listing, Notification } from '@prisma/client'
import { createNotification } from './notifications'

type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}

// Find existing match or create a new one
export async function createMatch(trip: Trip, listing: Listing) {
  try {
    await checkAuth()
    
    // First try to find existing match
    let match = await prisma.match.findFirst({
      where: {
        tripId: trip.id,
        listingId: listing.id,
      }
    });

    if (match) {
      console.log('Found existing match:', match.id);
      return { success: true, match };
    }

    // Create new match if none exists
    const monthlyRent = calculateRent({ listing, trip })
    match = await prisma.match.create({
      data: {
        tripId: trip.id,
        listingId: listing.id,
        monthlyRent: monthlyRent,
      },
    });
    
    console.log('Created new match:', match.id);

    const notificationData: CreateNotificationInput = {
      userId: trip.userId,
      content: 'New Match',
      url: `/app/rent/searches/?tab=matchbook&searchId=${trip.id}`,
      actionType: 'view',
      actionId: trip.id,
    }
    createNotification(notificationData)
    return { success: true, match }
  } catch (error) {
    console.error('Error creating match:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create match' }
  }
}

// Read a match by housing request id
export async function getMatch(housingRequestId: string) {
  try {
    await checkAuth()
    
    // First get the housing request to find the match
    const housingRequest = await prisma.housingRequest.findUnique({
      where: { id: housingRequestId }
    })
    
    if (!housingRequest) {
      return { success: false, error: 'Housing request not found' }
    }
    
    const match = await prisma.match.findFirst({
      where: {
        tripId: housingRequest.tripId,
        listingId: housingRequest.listingId
      },
      include: {
        listing: {
          include: {
            monthlyPricing: true
          }
        },
        trip: true,
        BoldSignLease: true,
        Lease: true,
      },
    })
    
    if (!match) {
      return { success: false, error: 'Match not found' }
    }
    
    return { success: true, match }
  } catch (error) {
    console.error('Error fetching match:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch match' }
  }
}

// Update a match
export async function updateMatch(id: string, data: { tripId?: string; matchId?: string; leaseDocumentId?: string | null }) {
  try {
    await checkAuth()
    const match = await prisma.match.update({
      where: { id },
      data: data,
    })
    return { success: true, match }
  } catch (error) {
    console.error('Error updating match:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update match' }
  }
}

// Delete a match
export async function deleteMatch(id: string) {
  try {
    await checkAuth()
    await prisma.match.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting match:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete match' }
  }
}

// Get all matches for a trip
export async function getMatchesForTrip(tripId: string) {
  try {
    await checkAuth()
    const matches = await prisma.match.findMany({
      where: { tripId },
    })
    return { success: true, matches }
  } catch (error) {
    console.error('Error fetching matches for trip:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch matches for trip' }
  }
}

// Get a match by matchId
export async function getMatchById(matchId: string) {
  try {
    await checkAuth()
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          include: {
            listingImages: {
              orderBy: {
                rank: 'asc'
              }
            },
            user: true,
            bedrooms: true,
            monthlyPricing: true,
          }
        },
        trip: {
          include: {
            user: true,
          }
        },
        BoldSignLease: true,
        Lease: true,
      },
    })
    
    if (!match) {
      return { success: false, error: 'Match not found' }
    }
    
    return { success: true, match }
  } catch (error) {
    console.error('Error fetching match by ID:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch match' }
  }
}
