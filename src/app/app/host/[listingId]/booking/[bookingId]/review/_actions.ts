'use server'

import prisma from '@/lib/prismadb'
import { currentUser } from '@clerk/nextjs/server'
import { ReviewType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

interface CreateHostReviewParams {
  bookingId: string
  listingId: string
  rating: number
  comment?: string
}

export async function createHostReview({ bookingId, listingId, rating, comment }: CreateHostReviewParams) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' }
    }

    // Find the booking and verify the user is the host
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        listing: {
          id: listingId,
          userId: user.id // Ensure current user is the host
        }
      },
      include: {
        listing: true,
        user: true // The renter being reviewed
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found or unauthorized' }
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        bookingId_reviewType: {
          bookingId,
          reviewType: ReviewType.HOST_TO_RENTER
        }
      }
    })

    if (existingReview) {
      return { success: false, error: 'Review already exists for this booking' }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment,
        reviewType: ReviewType.HOST_TO_RENTER,
        reviewerId: user.id,
        reviewedUserId: booking.user.id, // The renter
        isPublished: true, // Auto-publish for now
        publishedAt: new Date()
      }
    })

    revalidatePath(`/app/host/${listingId}/booking/${bookingId}/review`)

    return { success: true, review }
  } catch (error) {
    console.error('Error creating host review:', error)
    return { success: false, error: 'Failed to create review' }
  }
}

export async function getExistingHostReview(bookingId: string, listingId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify the user is the host of this listing
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        listing: {
          id: listingId,
          userId: user.id
        }
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found or unauthorized' }
    }

    const review = await prisma.review.findUnique({
      where: {
        bookingId_reviewType: {
          bookingId,
          reviewType: ReviewType.HOST_TO_RENTER
        }
      }
    })

    return { success: true, review }
  } catch (error) {
    console.error('Error fetching existing review:', error)
    return { success: false, error: 'Failed to fetch review' }
  }
}