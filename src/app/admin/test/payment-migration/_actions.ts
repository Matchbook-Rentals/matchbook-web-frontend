'use server';

import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { FEES } from '@/lib/fee-constants';

/**
 * Get all bookings with their payment status for migration
 */
export async function getMigrationBookings() {
  // Get all matches first
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      stripePaymentMethodId: true,
      stripePaymentIntentId: true,
      paymentAmount: true,
    },
  });

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  // Get all bookings where the matchId exists in our match map
  const bookings = await prisma.booking.findMany({
    where: {
      matchId: {
        in: Array.from(matchMap.keys()),
      },
    },
    include: {
      rentPayments: {
        include: {
          charges: true,
        },
        orderBy: {
          dueDate: 'asc',
        },
      },
    },
  });

  return bookings.map((booking) => {
    const match = matchMap.get(booking.matchId);

    const paymentsWithoutMethod = booking.rentPayments.filter(
      (rp) => !rp.stripePaymentMethodId
    );
    const paymentsWithoutCharges = booking.rentPayments.filter(
      (rp) => rp.charges.length === 0
    );

    // Check if security deposit payment exists (isPaid=true, has SECURITY_DEPOSIT charge)
    const hasSecurityDepositRecord = booking.rentPayments.some(
      (rp) =>
        rp.isPaid &&
        rp.charges.some((c) => c.category === 'SECURITY_DEPOSIT')
    );

    // Check for monthly rent payments
    const monthlyRentPayments = booking.rentPayments.filter(
      (rp) => rp.type === 'MONTHLY_RENT' && !rp.isPaid
    );

    return {
      id: booking.id,
      matchId: booking.matchId,
      startDate: booking.startDate,
      createdAt: booking.createdAt,
      monthlyRent: booking.monthlyRent,
      match: match || null,
      rentPayments: booking.rentPayments,
      needsPaymentMethod: paymentsWithoutMethod.length > 0,
      paymentsWithoutMethodCount: paymentsWithoutMethod.length,
      needsChargeItemization: paymentsWithoutCharges.length > 0,
      paymentsWithoutChargesCount: paymentsWithoutCharges.length,
      hasSecurityDepositRecord,
      needsPendingMoveInMigration: paymentsNotPendingMoveIn.length > 0,
      paymentsNotPendingMoveInCount: paymentsNotPendingMoveIn.length,
    };
  });
}

/**
 * Attach payment method from Match to all RentPayments for a booking
 */
export async function attachPaymentMethodToPayments(bookingId: string) {
  try {
    // Get booking with match
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        match: {
          select: {
            stripePaymentMethodId: true,
          },
        },
        rentPayments: {
          select: {
            id: true,
            stripePaymentMethodId: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (!booking.match?.stripePaymentMethodId) {
      return {
        success: false,
        error: 'Match does not have a payment method ID',
      };
    }

    const paymentMethodId = booking.match.stripePaymentMethodId;

    // Update all rent payments that don't have a payment method
    const paymentsToUpdate = booking.rentPayments.filter(
      (rp) => !rp.stripePaymentMethodId
    );

    if (paymentsToUpdate.length === 0) {
      return {
        success: true,
        message: 'All payments already have payment method attached',
        updatedCount: 0,
      };
    }

    await prisma.rentPayment.updateMany({
      where: {
        id: {
          in: paymentsToUpdate.map((rp) => rp.id),
        },
      },
      data: {
        stripePaymentMethodId: paymentMethodId,
        type: 'MONTHLY_RENT',
      },
    });

    return {
      success: true,
      message: `Attached payment method to ${paymentsToUpdate.length} payment(s)`,
      updatedCount: paymentsToUpdate.length,
    };
  } catch (error) {
    console.error('Error attaching payment method:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create security deposit payment record by querying Stripe
 */
export async function createSecurityDepositRecord(bookingId: string) {
  try {
    // Get booking with match
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        match: {
          select: {
            id: true,
            stripePaymentIntentId: true,
            stripePaymentMethodId: true,
            paymentAmount: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (!booking.match?.stripePaymentIntentId) {
      return {
        success: false,
        error: 'Match does not have a payment intent ID',
      };
    }

    // Fetch payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.match.stripePaymentIntentId
    );

    const metadata = paymentIntent.metadata;

    // Verify this is a security deposit payment
    if (metadata.type !== 'security_deposit_direct') {
      return {
        success: false,
        error: `Payment intent type is "${metadata.type}", expected "security_deposit_direct"`,
      };
    }

    // Extract amounts from metadata
    const totalAmount = Math.round(parseFloat(metadata.totalAmount) * 100); // Convert to cents
    const transferFee = Math.round(parseFloat(metadata.transferFee) * 100); // Should be 700 cents
    const isCard = metadata.paymentMethodType === 'card';

    // Calculate security deposit and card fee
    let securityDepositAmount: number;
    let cardFeeAmount = 0;

    if (isCard) {
      // If card: totalAmount = (securityDeposit + transferFee) / (1 - 0.03)
      // Card fee was included, so reverse calculate
      const baseAmount = totalAmount * (1 - FEES.CREDIT_CARD_FEE.PERCENTAGE);
      cardFeeAmount = totalAmount - baseAmount;
      securityDepositAmount = baseAmount - transferFee;
    } else {
      // If ACH: totalAmount = securityDeposit + transferFee
      securityDepositAmount = totalAmount - transferFee;
    }

    console.log('💰 Security deposit calculation:', {
      totalAmount: totalAmount / 100,
      transferFee: transferFee / 100,
      isCard,
      cardFeeAmount: cardFeeAmount / 100,
      securityDepositAmount: securityDepositAmount / 100,
    });

    // Create RentPayment with charges
    // Use booking.createdAt as dueDate since security deposit is paid at booking creation (reservation time)
    const rentPayment = await prisma.rentPayment.create({
      data: {
        bookingId,
        amount: totalAmount, // Legacy field
        totalAmount,
        baseAmount: securityDepositAmount + transferFee,
        dueDate: booking.createdAt,
        isPaid: true,
        status: 'PROCESSING', // ACH payments are still settling
        stripePaymentMethodId: booking.match.stripePaymentMethodId,
        stripePaymentIntentId: booking.match.stripePaymentIntentId,
        paymentCapturedAt: new Date(),
        type: 'SECURITY_DEPOSIT',
        charges: {
          create: [
            {
              category: 'SECURITY_DEPOSIT',
              amount: securityDepositAmount,
              isApplied: true,
              metadata: {
                source: 'migration',
                stripePaymentIntentId: booking.match.stripePaymentIntentId,
              },
            },
            {
              category: 'TRANSFER_FEE',
              amount: transferFee,
              isApplied: true,
              metadata: {
                source: 'migration',
              },
            },
            ...(isCard && cardFeeAmount > 0
              ? [
                  {
                    category: 'CREDIT_CARD_FEE' as const,
                    amount: cardFeeAmount,
                    isApplied: true,
                    metadata: {
                      source: 'migration',
                      rate: FEES.CREDIT_CARD_FEE.PERCENTAGE * 100,
                    },
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        charges: true,
      },
    });

    return {
      success: true,
      message: `Created security deposit record with ${rentPayment.charges.length} charges`,
      rentPaymentId: rentPayment.id,
      charges: rentPayment.charges.map((c) => ({
        category: c.category,
        amount: c.amount / 100, // Convert to dollars for display
      })),
    };
  } catch (error) {
    console.error('Error creating security deposit record:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get security deposit transaction details from Stripe
 */
export async function getSecurityDepositTransaction(bookingId: string) {
  try {
    // Get booking with match
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        match: {
          select: {
            stripePaymentIntentId: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }

    if (!booking.match?.stripePaymentIntentId) {
      return {
        success: false,
        error: 'Match does not have a payment intent ID',
      };
    }

    // Fetch payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.match.stripePaymentIntentId
    );

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: paymentIntent.created,
        payment_method: paymentIntent.payment_method,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error) {
    console.error('Error fetching security deposit transaction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
