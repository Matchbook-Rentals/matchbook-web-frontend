'use server'

import prisma from '@/lib/prismadb'
import { currentUser } from '@clerk/nextjs/server'
import { ReviewType } from '@prisma/client'
import { revalidatePath } from 'next/cache'

interface CreateRenterReviewParams {
  bookingId: string
  rating: number
  comment?: string
}

export async function createRenterReview({ bookingId, rating, comment }: CreateRenterReviewParams) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' }
    }

    // Find the booking and verify the user is the renter
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id // Ensure current user is the renter
      },
      include: {
        listing: true
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
          reviewType: ReviewType.RENTER_TO_LISTING
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
        reviewType: ReviewType.RENTER_TO_LISTING,
        reviewerId: user.id,
        reviewedListingId: booking.listing.id, // The listing being reviewed
        isPublished: true, // Auto-publish for now
        publishedAt: new Date()
      }
    })

    revalidatePath(`/app/rent/${bookingId}/review`)

    return { success: true, review }
  } catch (error) {
    console.error('Error creating renter review:', error)
    return { success: false, error: 'Failed to create review' }
  }
}

export async function getExistingRenterReview(bookingId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Verify the user is the renter of this booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found or unauthorized' }
    }

    const review = await prisma.review.findUnique({
      where: {
        bookingId_reviewType: {
          bookingId,
          reviewType: ReviewType.RENTER_TO_LISTING
        }
      }
    })

    return { success: true, review }
  } catch (error) {
    console.error('Error fetching existing review:', error)
    return { success: false, error: 'Failed to fetch review' }
  }
}