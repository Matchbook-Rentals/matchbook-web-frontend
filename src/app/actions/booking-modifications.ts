'use server'

/**
 * BOOKING MODIFICATIONS FEATURE
 * 
 * This module handles modifications to existing bookings. Modifications can include changes to:
 * - Guest count (adults, children, pets)
 * - Booking dates (start/end dates)
 * - Pricing (as a result of guest or date changes)
 * 
 * BUSINESS RULES:
 * - All modifications must be approved by both parties (host and renter)
 * - Guest changes affect pricing (e.g., pets may incur additional fees)
 * - Date changes affect pro-rated pricing calculations
 * - Any change to guests or dates MUST trigger price recalculation
 * 
 * NOTIFICATION SYSTEM:
 * - Notifications are automatically sent to the other party when changes are requested
 * - Both parties are kept informed of modification status (pending, approved, rejected)
 * - Email notifications are sent based on user preferences
 * 
 * UI PAGES NEEDED:
 * - Host modifications page: /app/host/[listingId]/bookings/[bookingId]/changes
 * - Renter modifications page: /app/rent/bookings/[bookingId]/changes
 * - These pages should display modification history and allow approval/rejection actions
 * 
 * CURRENT STATUS:
 * - ✅ Basic date modification requests (implemented)
 * - ✅ Approval/rejection workflow (implemented)
 * - ✅ Notification system (implemented)
 * - ❌ Guest count modifications (not yet implemented)
 * - ❌ Price recalculation for changes (not yet implemented)
 * - ❌ Dedicated modification management pages (not yet implemented)
 */

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createNotification } from './notifications'
import { approvePaymentModification, rejectPaymentModification } from './payment-modifications'

// Unified modification type that can represent both booking and payment modifications
export type UnifiedModification = {
  id: string
  type: 'booking' | 'payment'
  requestorId: string
  recipientId: string
  reason?: string
  status: string
  requestedAt: Date
  viewedAt?: Date | null
  approvedAt?: Date | null
  rejectedAt?: Date | null
  rejectionReason?: string | null
  createdAt: Date
  requestor: {
    fullName?: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }
  recipient: {
    fullName?: string
    firstName?: string
    lastName?: string
    imageUrl?: string
  }
  // Booking modification specific fields
  originalStartDate?: Date
  originalEndDate?: Date
  newStartDate?: Date
  newEndDate?: Date
  // Payment modification specific fields
  originalAmount?: number
  originalDueDate?: Date
  newAmount?: number
  newDueDate?: Date
  rentPaymentId?: string
}

export async function getAllBookingModifications(bookingId: string): Promise<{
  success: boolean
  modifications?: UnifiedModification[]
  error?: string
}> {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the booking with both types of modifications
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { userId: true } },
        user: { select: { id: true } },
        rentPayments: {
          include: {
            paymentModifications: {
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
            }
          }
        },
        bookingModifications: {
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
        }
      }
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Verify user has permission to view this booking
    const isHost = booking.listing?.userId === userId
    const isRenter = booking.user?.id === userId
    
    if (!isHost && !isRenter) {
      return { success: false, error: 'Unauthorized to view this booking' }
    }

    // Convert booking modifications to unified format
    const bookingMods: UnifiedModification[] = booking.bookingModifications.map(mod => ({
      id: mod.id,
      type: 'booking' as const,
      requestorId: mod.requestorId,
      recipientId: mod.recipientId,
      reason: mod.reason,
      status: mod.status,
      requestedAt: mod.requestedAt,
      viewedAt: mod.viewedAt,
      approvedAt: mod.approvedAt,
      rejectedAt: mod.rejectedAt,
      rejectionReason: mod.rejectionReason,
      createdAt: mod.createdAt,
      requestor: mod.requestor,
      recipient: mod.recipient,
      originalStartDate: mod.originalStartDate,
      originalEndDate: mod.originalEndDate,
      newStartDate: mod.newStartDate,
      newEndDate: mod.newEndDate
    }))

    // Convert payment modifications to unified format
    const paymentMods: UnifiedModification[] = booking.rentPayments
      .flatMap(payment => payment.paymentModifications)
      .map(mod => ({
        id: mod.id,
        type: 'payment' as const,
        requestorId: mod.requestorId,
        recipientId: mod.recipientId,
        reason: mod.reason,
        status: mod.status,
        requestedAt: mod.requestedAt,
        viewedAt: mod.viewedAt,
        approvedAt: mod.approvedAt,
        rejectedAt: mod.rejectedAt,
        rejectionReason: mod.rejectionReason,
        createdAt: mod.createdAt,
        requestor: mod.requestor,
        recipient: mod.recipient,
        originalAmount: mod.originalAmount,
        originalDueDate: mod.originalDueDate,
        newAmount: mod.newAmount,
        newDueDate: mod.newDueDate,
        rentPaymentId: mod.rentPaymentId
      }))

    // Combine and sort by creation date (newest first)
    const allModifications = [...bookingMods, ...paymentMods]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return { success: true, modifications: allModifications }
  } catch (error) {
    console.error('Error fetching all booking modifications:', error)
    return { success: false, error: 'Failed to fetch modifications' }
  }
}

export async function approveUnifiedModification(modificationId: string, modificationType: 'booking' | 'payment'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (modificationType === 'booking') {
      await approveBookingModification(modificationId)
    } else if (modificationType === 'payment') {
      await approvePaymentModification(modificationId)
    } else {
      throw new Error('Invalid modification type')
    }
    return { success: true }
  } catch (error) {
    console.error('Error approving unified modification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to approve modification' }
  }
}

export async function rejectUnifiedModification(modificationId: string, modificationType: 'booking' | 'payment', rejectionReason?: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (modificationType === 'booking') {
      await rejectBookingModification(modificationId, rejectionReason)
    } else if (modificationType === 'payment') {
      await rejectPaymentModification(modificationId, rejectionReason)
    } else {
      throw new Error('Invalid modification type')
    }
    return { success: true }
  } catch (error) {
    console.error('Error rejecting unified modification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject modification' }
  }
}

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

    // Determine correct URL based on who the recipient is
    const isRecipientHost = booking.listing.userId === recipientId
    const notificationUrl = isRecipientHost
      ? `/app/host/${booking.listingId}/bookings/${bookingId}/changes`
      : `/app/rent/bookings/${bookingId}/changes`

    await createNotification({
      userId: recipientId,
      content: `${requestorName} has requested a change to your booking for "${bookingModification.booking.listing.title}."`,
      url: notificationUrl,
      actionType: 'booking_change_request',
      actionId: bookingModification.id,
      emailData: {
        listingTitle: bookingModification.booking.listing.title,
        senderName: requestorName
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
            listing: { select: { id: true, title: true, userId: true } }
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

    // Get the approver's name from the current user
    const approver = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, firstName: true, lastName: true }
    })

    const approverName = approver?.fullName ||
      `${approver?.firstName || ''} ${approver?.lastName || ''}`.trim() || 'the other party'

    // Determine correct URL based on who the requestor is
    const isRequestorHost = bookingModification.booking.listing.userId === bookingModification.requestorId
    const notificationUrl = isRequestorHost
      ? `/app/host/${bookingModification.booking.listingId}/bookings/${bookingModification.bookingId}/changes`
      : `/app/rent/bookings/${bookingModification.bookingId}/changes`

    await createNotification({
      userId: bookingModification.requestorId,
      content: `Good news! Your requested change for "${bookingModification.booking.listing.title}" has been approved by ${approverName}.`,
      url: notificationUrl,
      actionType: 'booking_change_approved',
      actionId: bookingModification.id,
      emailData: {
        senderName: approverName,
        listingTitle: bookingModification.booking.listing.title
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
            listing: { select: { id: true, title: true, userId: true } }
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
    // Get the rejecter's name from the current user
    const rejecter = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, firstName: true, lastName: true }
    })

    const rejecterName = rejecter?.fullName ||
      `${rejecter?.firstName || ''} ${rejecter?.lastName || ''}`.trim() || 'the other party'

    // Determine correct URL based on who the requestor is
    const isRequestorHost = bookingModification.booking.listing.userId === bookingModification.requestorId
    const notificationUrl = isRequestorHost
      ? `/app/host/${bookingModification.booking.listingId}/bookings/${bookingModification.bookingId}/changes`
      : `/app/rent/bookings/${bookingModification.bookingId}/changes`

    await createNotification({
      userId: bookingModification.requestorId,
      content: `Your requested change for "${bookingModification.booking.listing.title}" has been declined by ${rejecterName}.`,
      url: notificationUrl,
      actionType: 'booking_change_declined',
      actionId: bookingModification.id,
      emailData: {
        senderName: rejecterName,
        listingTitle: bookingModification.booking.listing.title
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