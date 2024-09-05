'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'

// Helper function to check authentication
async function checkAuth() {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}

// Create a new match
export async function createMatch(tripId: string, listingId: string) {
  try {
    await checkAuth()
    const match = await prisma.match.create({
      data: {
        tripId,
        listingId,
      },
    })
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