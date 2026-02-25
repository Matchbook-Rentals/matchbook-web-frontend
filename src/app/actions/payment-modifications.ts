'use server'

import prisma from '@/lib/prismadb'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createNotification } from './notifications'

export async function createPaymentModification({
  rentPaymentId,
  newAmount,
  newDueDate,
  reason,
  recipientId
}: {
  rentPaymentId: string
  newAmount: number
  newDueDate: Date
  reason?: string
  recipientId: string
}) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the original rent payment details
    const rentPayment = await prisma.rentPayment.findUnique({
      where: { id: rentPaymentId },
      include: {
        booking: {
          include: {
            listing: { select: { id: true, userId: true } },
            user: { select: { id: true } }
          }
        }
      }
    })

    if (!rentPayment) {
      throw new Error('Rent payment not found')
    }

    // Verify user has permission to modify this payment
    const isHost = rentPayment.booking.listing.userId === userId
    const isRenter = rentPayment.booking.user.id === userId
    
    if (!isHost && !isRenter) {
      throw new Error('Unauthorized to modify this payment')
    }

    // Create the payment modification request
    const paymentModification = await prisma.paymentModification.create({
      data: {
        rentPaymentId,
        requestorId: userId,
        recipientId,
        originalAmount: rentPayment.amount,
        originalDueDate: rentPayment.dueDate,
        newAmount,
        newDueDate,
        reason,
        status: 'pending'
      },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        recipient: { select: { fullName: true, firstName: true, lastName: true } },
        rentPayment: {
          include: {
            booking: {
              include: {
                listing: { select: { id: true, title: true, userId: true } }
              }
            }
          }
        }
      }
    })

    // Create notification for the recipient
    const requestorName = paymentModification.requestor.fullName ||
      `${paymentModification.requestor.firstName || ''} ${paymentModification.requestor.lastName || ''}`.trim()

    const listingTitle = paymentModification.rentPayment.booking.listing.title

    // Determine correct URL based on who the recipient is
    const isRecipientHost = rentPayment.booking.listing.userId === recipientId
    const notificationUrl = isRecipientHost
      ? `/app/host/${rentPayment.booking.listingId}/bookings/${rentPayment.bookingId}/changes`
      : `/app/rent/bookings/${rentPayment.bookingId}/changes`

    await createNotification({
      userId: recipientId,
      content: `${requestorName} has requested to modify a payment for "${listingTitle}."`,
      url: notificationUrl,
      actionType: 'payment_modification_request',
      actionId: paymentModification.id,
      emailData: {
        listingTitle,
        senderName: requestorName
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true, paymentModification }
  } catch (error) {
    console.error('Error creating payment modification:', error)
    throw new Error('Failed to create payment modification request')
  }
}

export async function approvePaymentModification(paymentModificationId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the payment modification
    const paymentModification = await prisma.paymentModification.findUnique({
      where: { id: paymentModificationId },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        rentPayment: {
          include: {
            booking: {
              include: {
                listing: { select: { id: true, title: true, userId: true } }
              }
            }
          }
        }
      }
    })

    if (!paymentModification) {
      throw new Error('Payment modification not found')
    }

    // Verify user is the recipient
    if (paymentModification.recipientId !== userId) {
      throw new Error('Unauthorized to approve this modification')
    }

    // Verify status is pending
    if (paymentModification.status !== 'pending') {
      throw new Error('Payment modification is no longer pending')
    }

    // Update the payment modification and the original rent payment
    await prisma.$transaction([
      // Update the payment modification status
      prisma.paymentModification.update({
        where: { id: paymentModificationId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          viewedAt: paymentModification.viewedAt || new Date() // Mark as viewed if not already
        }
      }),
      // Update the original rent payment
      prisma.rentPayment.update({
        where: { id: paymentModification.rentPaymentId },
        data: {
          amount: paymentModification.newAmount,
          dueDate: paymentModification.newDueDate
        }
      })
    ])

    // Notify the requestor of approval
    const approver = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, firstName: true, lastName: true }
    })
    const approverName = approver?.fullName ||
      `${approver?.firstName || ''} ${approver?.lastName || ''}`.trim() || 'the other party'

    const isRequestorHost = paymentModification.rentPayment.booking.listing.userId === paymentModification.requestorId
    const approveNotificationUrl = isRequestorHost
      ? `/app/host/${paymentModification.rentPayment.booking.listingId}/bookings/${paymentModification.rentPayment.bookingId}/changes`
      : `/app/rent/bookings/${paymentModification.rentPayment.bookingId}/changes`

    await createNotification({
      userId: paymentModification.requestorId,
      content: `Good news! Your payment modification for "${paymentModification.rentPayment.booking.listing.title}" has been approved by ${approverName}.`,
      url: approveNotificationUrl,
      actionType: 'payment_modification_approved',
      actionId: paymentModification.id,
      emailData: {
        senderName: approverName,
        listingTitle: paymentModification.rentPayment.booking.listing.title
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true }
  } catch (error) {
    console.error('Error approving payment modification:', error)
    throw new Error('Failed to approve payment modification')
  }
}

export async function rejectPaymentModification(paymentModificationId: string, rejectionReason?: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the payment modification
    const paymentModification = await prisma.paymentModification.findUnique({
      where: { id: paymentModificationId },
      include: {
        requestor: { select: { fullName: true, firstName: true, lastName: true } },
        rentPayment: {
          include: {
            booking: {
              include: {
                listing: { select: { id: true, title: true, userId: true } }
              }
            }
          }
        }
      }
    })

    if (!paymentModification) {
      throw new Error('Payment modification not found')
    }

    // Verify user is the recipient
    if (paymentModification.recipientId !== userId) {
      throw new Error('Unauthorized to reject this modification')
    }

    // Verify status is pending
    if (paymentModification.status !== 'pending') {
      throw new Error('Payment modification is no longer pending')
    }

    // Update the payment modification status
    await prisma.paymentModification.update({
      where: { id: paymentModificationId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
        viewedAt: paymentModification.viewedAt || new Date() // Mark as viewed if not already
      }
    })

    // Notify the requestor of rejection
    const rejecter = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, firstName: true, lastName: true }
    })
    const rejecterName = rejecter?.fullName ||
      `${rejecter?.firstName || ''} ${rejecter?.lastName || ''}`.trim() || 'the other party'

    const isRequestorHost = paymentModification.rentPayment.booking.listing.userId === paymentModification.requestorId
    const rejectNotificationUrl = isRequestorHost
      ? `/app/host/${paymentModification.rentPayment.booking.listingId}/bookings/${paymentModification.rentPayment.bookingId}/changes`
      : `/app/rent/bookings/${paymentModification.rentPayment.bookingId}/changes`

    await createNotification({
      userId: paymentModification.requestorId,
      content: `Your payment modification for "${paymentModification.rentPayment.booking.listing.title}" has been declined by ${rejecterName}.`,
      url: rejectNotificationUrl,
      actionType: 'payment_modification_rejected',
      actionId: paymentModification.id,
      emailData: {
        senderName: rejecterName,
        listingTitle: paymentModification.rentPayment.booking.listing.title
      }
    })

    revalidatePath('/app/host')
    revalidatePath('/app/rent')

    return { success: true }
  } catch (error) {
    console.error('Error rejecting payment modification:', error)
    throw new Error('Failed to reject payment modification')
  }
}

export async function getPaymentModifications(rentPaymentId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const modifications = await prisma.paymentModification.findMany({
      where: { rentPaymentId },
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
    console.error('Error fetching payment modifications:', error)
    throw new Error('Failed to fetch payment modifications')
  }
}

export async function markPaymentModificationAsViewed(paymentModificationId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const paymentModification = await prisma.paymentModification.findUnique({
      where: { id: paymentModificationId }
    })

    if (!paymentModification) {
      throw new Error('Payment modification not found')
    }

    // Verify user is the recipient
    if (paymentModification.recipientId !== userId) {
      throw new Error('Unauthorized to view this modification')
    }

    // Update viewedAt if not already set
    if (!paymentModification.viewedAt) {
      await prisma.paymentModification.update({
        where: { id: paymentModificationId },
        data: { viewedAt: new Date() }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking payment modification as viewed:', error)
    throw new Error('Failed to mark modification as viewed')
  }
}

export async function getUserPaymentModifications(status?: 'pending' | 'approved' | 'rejected') {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const modifications = await prisma.paymentModification.findMany({
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
        rentPayment: {
          include: {
            booking: {
              include: {
                listing: { select: { id: true, title: true, userId: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, modifications }
  } catch (error) {
    console.error('Error fetching user payment modifications:', error)
    throw new Error('Failed to fetch payment modifications')
  }
}