'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { calculateRent } from '@/lib/calculate-rent'
import { Trip, Listing, Notification } from '@prisma/client'
import { createNotification } from './notifications'

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}

// Create a new match
export async function createMatch(trip: Trip, listing: Listing) {
  try {
    await checkAuth()
    const monthlyRent = calculateRent({ listing, trip })
    const match = await prisma.match.create({
      data: {
        tripId: trip.id,
        listingId: listing.id,
      },
    })
    const notificationData: CreateNotificationInput = {
      userId: trip.userId,
      content: 'New Match',
      url: `/platform/searches/?tab=matchbook&searchId=${trip.id}`,
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

// Read a match by id
export async function getMatch(id: string) {
  try {
    await checkAuth()
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        listing: true,
        trip: true,
        // TODO: add housingRequest
      },
    })
    return { success: true, match }
  } catch (error) {
    console.error('Error fetching match:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch match' }
  }
}

// Update a match
export async function updateMatch(id: string, tripId?: string, matchId?: string) {
  try {
    await checkAuth()
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(tripId && { tripId }),
        ...(matchId && { matchId }),
      },
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