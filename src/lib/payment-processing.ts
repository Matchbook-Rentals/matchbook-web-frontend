import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { FEES } from '@/lib/fee-constants';

const DAYS_PER_MONTH_PRECISE = 30.4375;
const MS_PER_DAY = 86400000;
const PERCENT_MULTIPLIER = 100;

const centsToDollars = (cents: number) => cents / 100;

/**
 * Process a rent payment immediately (used for move-in first payment)
 * Extracted from cron job logic for reusability
 */
export async function processRentPaymentNow(paymentId: string) {
  try {
    // Fetch payment with all necessary relations
    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                stripeCustomerId: true,
              },
            },
            listing: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    stripeAccountId: true,
                    stripeChargesEnabled: true,
                  },
                },
              },
            },
          },
        },
        charges: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const { booking } = payment;
    const renter = booking.user;
    const host = booking.listing.user;

    // Verify host can receive payments
    if (!host.stripeAccountId || !host.stripeChargesEnabled) {
      throw new Error('Host Stripe account not properly configured');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      payment.stripePaymentMethodId!
    );
    const isCard = paymentMethod.type === 'card';
    const isACH = paymentMethod.type === 'us_bank_account';

    // Read amount - prefer totalAmount (new) over amount (legacy)
    const totalAmount =
      payment.totalAmount !== null && payment.totalAmount !== undefined
        ? Number(payment.totalAmount)
        : Number(payment.amount);

    // Calculate platform fee
    let platformFeeAmount = 0;
    let platformFeeRate = 0;

    if (payment.charges && payment.charges.length > 0) {
      // New system: Read platform fee from charges
      const platformFeeCharge = payment.charges.find(
        (c: any) => c.category === 'PLATFORM_FEE' && c.isApplied
      );

      if (platformFeeCharge) {
        platformFeeAmount = Number(platformFeeCharge.amount);
        if (
          platformFeeCharge.metadata &&
          typeof platformFeeCharge.metadata === 'object' &&
          'rate' in platformFeeCharge.metadata
        ) {
          platformFeeRate = Number(platformFeeCharge.metadata.rate) / PERCENT_MULTIPLIER;
        }
      }
    }

    // Fallback to legacy calculation if no charges
    if (platformFeeAmount === 0) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const durationInMonths = Math.round(
        (endDate.getTime() - startDate.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH_PRECISE)
      );

      platformFeeRate =
        durationInMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS
          ? FEES.SERVICE_FEE.LONG_TERM_RATE
          : FEES.SERVICE_FEE.SHORT_TERM_RATE;
      platformFeeAmount = Math.round(totalAmount * platformFeeRate);
    }

    const hostAmount = totalAmount - platformFeeAmount;
    const durationInMonths = Math.round(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (MS_PER_DAY * DAYS_PER_MONTH_PRECISE)
    );

    // Create payment intent with automatic capture
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalAmount,
        currency: 'usd',
        customer: renter.stripeCustomerId!,
        payment_method: payment.stripePaymentMethodId!,
        payment_method_types: isCard ? ['card'] : isACH ? ['us_bank_account'] : ['card', 'us_bank_account'],
        capture_method: 'automatic',
        confirm: true,
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: host.stripeAccountId!,
        },
        metadata: {
          rentPaymentId: payment.id,
          bookingId: payment.bookingId,
          renterId: renter.id,
          hostId: host.id,
          type: 'monthly_rent',
          paymentMethodType: paymentMethod.type,
          totalAmount: centsToDollars(totalAmount).toString(),
          platformFeeRate: (platformFeeRate * PERCENT_MULTIPLIER).toString() + '%',
          platformFeeAmount: centsToDollars(platformFeeAmount).toString(),
          hostAmount: centsToDollars(hostAmount).toString(),
          bookingDurationMonths: durationInMonths.toString(),
        },
        receipt_email: renter.email,
      },
      {
        idempotencyKey: `rent-payment-${payment.id}-movein-${Date.now()}`,
      }
    );

    // Update payment record based on status
    if (paymentIntent.status === 'succeeded') {
      // Card payment succeeded immediately
      await prisma.$transaction([
        prisma.rentPayment.update({
          where: { id: payment.id },
          data: {
            isPaid: true,
            status: 'SUCCEEDED',
            paymentCapturedAt: new Date(),
            stripePaymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          },
        }),
        prisma.paymentTransaction.create({
          data: {
            transactionNumber: `RENT-${payment.id}-${Date.now()}`,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: 'usd',
            status: 'succeeded',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
            platformFeeAmount: platformFeeAmount,
            stripeFeeAmount: 0,
            netAmount: totalAmount - platformFeeAmount,
            processedAt: new Date(),
            userId: renter.id,
            bookingId: payment.bookingId,
          },
        }),
      ]);

      return { success: true, status: 'succeeded' as const };
    } else if (paymentIntent.status === 'processing') {
      // ACH payment is processing
      await prisma.$transaction([
        prisma.rentPayment.update({
          where: { id: payment.id },
          data: {
            status: 'PROCESSING',
            paymentAuthorizedAt: new Date(),
            stripePaymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          },
        }),
        prisma.paymentTransaction.create({
          data: {
            transactionNumber: `RENT-${payment.id}-${Date.now()}`,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: 'usd',
            status: 'pending',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'us_bank_account',
            platformFeeAmount: platformFeeAmount,
            stripeFeeAmount: 0,
            netAmount: totalAmount - platformFeeAmount,
            userId: renter.id,
            bookingId: payment.bookingId,
          },
        }),
      ]);

      return { success: true, status: 'processing' as const };
    } else {
      throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error(`Failed to process payment ${paymentId}:`, error);

    // Extract meaningful error message
    let errorMessage = 'Payment processing failed';
    if (error instanceof Error) {
      if (error.message.includes('insufficient_funds')) {
        errorMessage = 'Insufficient funds';
      } else if (error.message.includes('card_declined')) {
        errorMessage = 'Card declined';
      } else if (error.message.includes('payment_method_unavailable')) {
        errorMessage = 'Payment method unavailable';
      } else {
        errorMessage = error.message;
      }
    }

    // Update payment as failed
    await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason: errorMessage,
        retryCount: { increment: 1 },
        lastRetryAttempt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: false, status: 'failed' as const, error: errorMessage };
  }
}
