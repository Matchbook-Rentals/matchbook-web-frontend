'use server';

import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';
import { checkRole } from '@/utils/roles';
import { processRentPaymentNow } from '@/lib/payment-processing';

/**
 * Confirm successful move-in and transition payments to PENDING status
 */
export async function confirmMoveIn(bookingId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user owns the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        moveInCompletedAt: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (booking.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (booking.moveInCompletedAt) {
      return {
        success: false,
        error: 'Move-in already confirmed',
      };
    }

    // Get booking details to find first payment
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        rentPayments: {
          where: {
            type: 'MONTHLY_RENT',
            isPaid: false,
            cancelledAt: null,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });

    if (!bookingDetails) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    console.log('[MOVE-IN CONFIRM] Booking details:', {
      bookingId,
      startDate: bookingDetails.startDate,
      totalPaymentsFound: bookingDetails.rentPayments.length,
    });

    console.log('[MOVE-IN CONFIRM] All unpaid monthly rent payments:',
      bookingDetails.rentPayments.map(p => ({
        id: p.id,
        dueDate: p.dueDate,
        status: p.status,
        isPaid: p.isPaid,
        amount: p.amount,
      }))
    );

    // Get the first payment (earliest by dueDate since already ordered asc)
    const firstPayment = bookingDetails.rentPayments[0];

    console.log('[MOVE-IN CONFIRM] First payment (earliest dueDate):', firstPayment ? {
      id: firstPayment.id,
      dueDate: firstPayment.dueDate,
      status: firstPayment.status,
      amount: firstPayment.amount,
    } : 'NULL - No payments found');

    // Process first payment immediately if it exists
    let firstPaymentResult = null;
    if (firstPayment) {
      console.log('[MOVE-IN CONFIRM] Processing first payment:', firstPayment.id);
      firstPaymentResult = await processRentPaymentNow(firstPayment.id);
      console.log('[MOVE-IN CONFIRM] First payment processing result:', firstPaymentResult);
    } else {
      console.log('[MOVE-IN CONFIRM] No first payment to process - skipping payment processing');
    }

    // Get remaining payment IDs (exclude first payment)
    const remainingPaymentIds = bookingDetails.rentPayments
      .filter((p) => p.id !== firstPayment?.id)
      .map((p) => p.id);

    console.log('[MOVE-IN CONFIRM] Remaining payment IDs to transition to PENDING:', remainingPaymentIds);

    // Update booking and transition remaining payments to PENDING
    console.log('[MOVE-IN CONFIRM] Updating booking status and transitioning remaining payments...');

    await prisma.$transaction([
      // Mark booking as moved in
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          moveInCompletedAt: new Date(),
          moveInStatus: 'confirmed',
          moveInConfirmedAt: new Date(),
        },
      }),
      // Transition remaining PENDING_MOVE_IN payments to PENDING
      ...(remainingPaymentIds.length > 0
        ? [
            prisma.rentPayment.updateMany({
              where: {
                id: {
                  in: remainingPaymentIds,
                },
              },
              data: {
                status: 'PENDING',
              },
            }),
          ]
        : []),
    ]);

    console.log('[MOVE-IN CONFIRM] Move-in confirmation completed successfully');

    return {
      success: true,
      message: 'Move-in confirmed successfully. Your first payment has been processed and future payments are scheduled.',
    };
  } catch (error) {
    console.error('Error confirming move-in:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Report unsuccessful move-in and keep payments on hold
 */
export async function reportMoveInIssue(bookingId: string, reason?: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user owns the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        moveInCompletedAt: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (booking.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (booking.moveInCompletedAt) {
      return {
        success: false,
        error: 'Move-in already confirmed',
      };
    }

    // Update booking status to indicate issue and mark payments as failed move-in
    await prisma.$transaction([
      // Mark booking as having move-in issue
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          moveInStatus: 'issue_reported',
          moveInIssueReportedAt: new Date(),
          moveInIssueNotes: reason || 'Issue reported without specific details',
        },
      }),
      // Mark all PENDING_MOVE_IN payments as FAILED_MOVE_IN
      prisma.rentPayment.updateMany({
        where: {
          bookingId,
          status: 'PENDING_MOVE_IN',
        },
        data: {
          status: 'FAILED_MOVE_IN',
        },
      }),
    ]);

    return {
      success: true,
      message: 'Move-in issue reported. Your payments will remain on hold. Support will contact you shortly.',
    };
  } catch (error) {
    console.error('Error reporting move-in issue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * ADMIN DEV ONLY: Reset move-in status for testing purposes
 * Resets booking move-in fields and payment statuses back to PENDING_MOVE_IN
 */
export async function resetMoveInStatus(bookingId: string) {
  try {
    const { userId } = auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Check admin_dev role (defense in depth)
    const isAdminDev = await checkRole('admin_dev');
    if (!isAdminDev) {
      return {
        success: false,
        error: 'Admin dev access required',
      };
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        moveInStatus: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    // Reset move-in status and payment statuses in transaction
    await prisma.$transaction([
      // Reset all move-in tracking fields
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          moveInCompletedAt: null,
          moveInStatus: 'pending',
          moveInConfirmedAt: null,
          moveInIssueReportedAt: null,
          moveInIssueNotes: null,
        },
      }),
      // Reset all monthly rent payments to PENDING_MOVE_IN
      prisma.rentPayment.updateMany({
        where: {
          bookingId,
          type: 'MONTHLY_RENT',
        },
        data: {
          status: 'PENDING_MOVE_IN',
          isPaid: false,
          paymentAuthorizedAt: null,
          paymentCapturedAt: null,
          stripePaymentIntentId: null,
        },
      }),
    ]);

    console.log(`[ADMIN DEV] Move-in status reset for booking ${bookingId} by user ${userId}`);

    return {
      success: true,
      message: 'Move-in status and payment statuses reset successfully',
    };
  } catch (error) {
    console.error('Error resetting move-in status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
