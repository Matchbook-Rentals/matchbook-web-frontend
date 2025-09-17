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
            listing: { select: { userId: true } },
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
                listing: { select: { title: true } }
              }
            }
          }
        }
      }
    })

    // Create notification for the recipient
    const requestorName = paymentModification.requestor.fullName || 
      `${paymentModification.requestor.firstName || ''} ${paymentModification.requestor.lastName || ''}`.trim()
    
    await createNotification({
      userId: recipientId,
      title: 'Payment Modification Request',
      message: `${requestorName} has requested to modify a payment for ${paymentModification.rentPayment.booking.listing.title}`,
      type: 'payment_modification_request',
      metadata: {
        paymentModificationId: paymentModification.id,
        bookingId: rentPayment.bookingId
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
                listing: { select: { title: true } }
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
    const requestorName = paymentModification.requestor.fullName || 
      `${paymentModification.requestor.firstName || ''} ${paymentModification.requestor.lastName || ''}`.trim()
    
    await createNotification({
      userId: paymentModification.requestorId,
      title: 'Payment Modification Approved',
      message: `Your payment modification request for ${paymentModification.rentPayment.booking.listing.title} has been approved`,
      type: 'payment_modification_approved',
      metadata: {
        paymentModificationId: paymentModification.id,
        bookingId: paymentModification.rentPayment.bookingId
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
                listing: { select: { title: true } }
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
    await createNotification({
      userId: paymentModification.requestorId,
      title: 'Payment Modification Rejected',
      message: `Your payment modification request for ${paymentModification.rentPayment.booking.listing.title} has been rejected${rejectionReason ? `: ${rejectionReason}` : ''}`,
      type: 'payment_modification_rejected',
      metadata: {
        paymentModificationId: paymentModification.id,
        bookingId: paymentModification.rentPayment.bookingId
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
                listing: { select: { title: true } }
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