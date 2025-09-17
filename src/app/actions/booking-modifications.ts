'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createNotification } from './notifications'

export async function createBookingModification({
  bookingId,
  newStartDate,
  newEndDate,
  reason,
  recipientId
}: {
  bookingId: string
  newStartDate: Date
  newEndDate: Date
  reason?: string
  recipientId: string
}) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the original booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { userId: true, title: true } },
        user: { select: { id: true } }
      }
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    // Verify user has permission to modify this booking
    const isHost = booking.listing.userId === userId
    const isRenter = booking.user.id === userId
    
    if (!isHost && !isRenter) {
      throw new Error('Unauthorized to modify this booking')
    }

    // Validate new dates
    if (newStartDate >= newEndDate) {
      throw new Error('End date must be after start date')
    }

    // Create the booking modification request
    const bookingModification = await prisma.bookingModification.create({
      data: {
        bookingId,
        requestorId: userId,
        recipientId,
        originalStartDate: booking.startDate,
        originalEndDate: booking.endDate,
        newStartDate,
        newEndDate,
        reason,
        status: 'pending'
      },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        recipient: { select: { fullName: true, firstName: true, lastName: true } },
        booking: {
          include: {
            listing: { select: { title: true } }
          }
        }
      }
    })

    // Create notification for the recipient
    const requestorName = bookingModification.requestor.fullName || 
      `${bookingModification.requestor.firstName || ''} ${bookingModification.requestor.lastName || ''}`.trim()
    
    await createNotification({
      userId: recipientId,
      title: 'Booking Date Modification Request',
      message: `${requestorName} has requested to modify booking dates for ${bookingModification.booking.listing.title}`,
      type: 'booking_modification_request',
      metadata: {
        bookingModificationId: bookingModification.id,
        bookingId: bookingId
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true, bookingModification }
  } catch (error) {
    console.error('Error creating booking modification:', error)
    throw new Error('Failed to create booking modification request')
  }
}

export async function approveBookingModification(bookingModificationId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the booking modification
    const bookingModification = await prisma.bookingModification.findUnique({
      where: { id: bookingModificationId },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        booking: {
          include: {
            listing: { select: { title: true } }
          }
        }
      }
    })

    if (!bookingModification) {
      throw new Error('Booking modification not found')
    }

    // Verify user is the recipient
    if (bookingModification.recipientId !== userId) {
      throw new Error('Unauthorized to approve this modification')
    }

    // Verify status is pending
    if (bookingModification.status !== 'pending') {
      throw new Error('Booking modification is no longer pending')
    }

    // Update the booking modification and the original booking
    await prisma.$transaction([
      // Update the booking modification status
      prisma.bookingModification.update({
        where: { id: bookingModificationId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          viewedAt: bookingModification.viewedAt || new Date() // Mark as viewed if not already
        }
      }),
      // Update the original booking
      prisma.booking.update({
        where: { id: bookingModification.bookingId },
        data: {
          startDate: bookingModification.newStartDate,
          endDate: bookingModification.newEndDate
        }
      })
    ])

    // Notify the requestor of approval
    const requestorName = bookingModification.requestor.fullName || 
      `${bookingModification.requestor.firstName || ''} ${bookingModification.requestor.lastName || ''}`.trim()
    
    await createNotification({
      userId: bookingModification.requestorId,
      title: 'Booking Date Modification Approved',
      message: `Your booking date modification request for ${bookingModification.booking.listing.title} has been approved`,
      type: 'booking_modification_approved',
      metadata: {
        bookingModificationId: bookingModification.id,
        bookingId: bookingModification.bookingId
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true }
  } catch (error) {
    console.error('Error approving booking modification:', error)
    throw new Error('Failed to approve booking modification')
  }
}

export async function rejectBookingModification(bookingModificationId: string, rejectionReason?: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the booking modification
    const bookingModification = await prisma.bookingModification.findUnique({
      where: { id: bookingModificationId },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        booking: {
          include: {
            listing: { select: { title: true } }
          }
        }
      }
    })

    if (!bookingModification) {
      throw new Error('Booking modification not found')
    }

    // Verify user is the recipient
    if (bookingModification.recipientId !== userId) {
      throw new Error('Unauthorized to reject this modification')
    }

    // Verify status is pending
    if (bookingModification.status !== 'pending') {
      throw new Error('Booking modification is no longer pending')
    }

    // Update the booking modification status
    await prisma.bookingModification.update({
      where: { id: bookingModificationId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
        viewedAt: bookingModification.viewedAt || new Date() // Mark as viewed if not already
      }
    })

    // Notify the requestor of rejection
    await createNotification({
      userId: bookingModification.requestorId,
      title: 'Booking Date Modification Rejected',
      message: `Your booking date modification request for ${bookingModification.booking.listing.title} has been rejected${rejectionReason ? `: ${rejectionReason}` : ''}`,
      type: 'booking_modification_rejected',
      metadata: {
        bookingModificationId: bookingModification.id,
        bookingId: bookingModification.bookingId
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true }
  } catch (error) {
    console.error('Error rejecting booking modification:', error)
    throw new Error('Failed to reject booking modification')
  }
}

export async function getBookingModifications(bookingId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const modifications = await prisma.bookingModification.findMany({
      where: { bookingId },
      include: {
        requestor: { 
          select: { 
            fullName: true, 
            firstName: true, 
            lastName: true,
            imageUrl: true 
          } 
        },
        recipient: { 
          select: { 
            fullName: true, 
            firstName: true, 
            lastName: true,
            imageUrl: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, modifications }
  } catch (error) {
    console.error('Error fetching booking modifications:', error)
    throw new Error('Failed to fetch booking modifications')
  }
}

export async function markBookingModificationAsViewed(bookingModificationId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const bookingModification = await prisma.bookingModification.findUnique({
      where: { id: bookingModificationId }
    })

    if (!bookingModification) {
      throw new Error('Booking modification not found')
    }

    // Verify user is the recipient
    if (bookingModification.recipientId !== userId) {
      throw new Error('Unauthorized to view this modification')
    }

    // Update viewedAt if not already set
    if (!bookingModification.viewedAt) {
      await prisma.bookingModification.update({
        where: { id: bookingModificationId },
        data: { viewedAt: new Date() }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking booking modification as viewed:', error)
    throw new Error('Failed to mark modification as viewed')
  }
}

export async function getUserBookingModifications(status?: 'pending' | 'approved' | 'rejected') {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const modifications = await prisma.bookingModification.findMany({
      where: {
        OR: [
          { requestorId: userId },
          { recipientId: userId }
        ],
        ...(status && { status })
      },
      include: {
        requestor: { 
          select: { 
            fullName: true, 
            firstName: true, 
            lastName: true,
            imageUrl: true 
          } 
        },
        recipient: { 
          select: { 
            fullName: true, 
            firstName: true, 
            lastName: true,
            imageUrl: true 
          } 
        },
        booking: {
          include: {
            listing: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, modifications }
  } catch (error) {
    console.error('Error fetching user booking modifications:', error)
    throw new Error('Failed to fetch booking modifications')
  }
}