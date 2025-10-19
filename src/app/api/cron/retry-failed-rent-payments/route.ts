import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { sendNotificationEmail } from '@/lib/send-notification-email';
import { buildNotificationEmailData, getNotificationEmailSubject } from '@/lib/notification-email-config';
import {
  centsToDollars,
  PERCENT_MULTIPLIER,
  MS_PER_DAY,
  DAYS_PER_MONTH_PRECISE
} from '@/lib/payment-constants';
import { FEES } from '@/lib/fee-constants';

/**
 * CRON JOB: Retry Failed Rent Payments
 *
 * Purpose:
 * Automatically retry rent payments that previously failed, with intelligent retry logic.
 *
 * Schedule:
 * Runs Monday-Friday at 10am Pacific (5pm UTC) - after main payment processing cron
 *
 * Business Logic:
 * 1. FIND FAILED PAYMENTS: Identifies past-due payments that failed with retryCount < 2
 * 2. PREVENT SAME-DAY RETRIES: Skips payments already attempted today (via lastRetryAttempt)
 * 3. PAYMENT PROCESSING: Creates Stripe PaymentIntents with automatic capture (same as main cron)
 * 4. RETRY LIMIT: Max 2 retries (3 total attempts including initial)
 * 5. NOTIFICATIONS: Sends appropriate success/failure notifications
 * 6. KEEPS DUE DATE: Original dueDate unchanged to track how late the payment is
 *
 * Retry Flow Example:
 * - Day 1: Initial payment fails (retryCount = 1, lastRetryAttempt = Day 1)
 * - Day 2: Retry #1 fails (retryCount = 2, lastRetryAttempt = Day 2)
 * - Day 3+: No more retries (retryCount = 2 is NOT < 2)
 * - After 2 retries, requires manual intervention (user must update payment method)
 */

export async function GET(request: Request) {
  // Authorization check using cron secret
  const authHeader = request.headers.get('authorization');
  console.log('Retry failed payments - Received auth header:', authHeader);
  console.log('Retry failed payments - Expected auth header:', `Bearer ${process.env.CRON_SECRET}`);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - retry failed payments');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Starting failed payment retry processing...');

  try {
    const todayMidnight = getTodayAtMidnight();

    console.log('📅 Retry cron job date:');
    console.log(`  - Today (midnight UTC): ${todayMidnight.toISOString()}`);
    console.log(`  - Looking for failed payments with dueDate < ${todayMidnight.toISOString()}`);

    // Find all failed payments that need retry
    const failedPayments = await findFailedPaymentsForRetry(todayMidnight);

    if (failedPayments.length === 0) {
      console.log('Cron job: No failed payments need retry today.');
      return NextResponse.json({
        success: true,
        message: 'No failed payments to retry',
        retriedPayments: 0
      });
    }

    console.log(`Cron job: Found ${failedPayments.length} failed payments to retry.`);

    // Process each payment
    const results = await processPayments(failedPayments);

    console.log(`Cron job: Retry processing complete. Success: ${results.successful}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      retriedPayments: failedPayments.length,
      successfulPayments: results.successful,
      failedPayments: results.failed,
      message: `Retried ${failedPayments.length} payments: ${results.successful} successful, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Cron job: Error retrying failed payments:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get today's date at midnight UTC
 */
const getTodayAtMidnight = (): Date => {
  const now = new Date();
  // Get current date in Pacific timezone to determine which calendar day it is
  const pacificDateString = now.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
  const [month, day, year] = pacificDateString.split('/').map(Number);

  // Create midnight UTC for that calendar date
  const todayMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return todayMidnight;
};

/**
 * Find all failed rent payments that need retry
 */
const findFailedPaymentsForRetry = async (todayMidnight: Date) => {
  return await prisma.rentPayment.findMany({
    where: {
      // Past due (original dueDate has passed)
      dueDate: {
        lt: todayMidnight
      },
      // Failed status
      status: 'FAILED',
      // Not cancelled
      cancelledAt: null,
      // Has payment method
      stripePaymentMethodId: { not: null },
      // Only retry up to 2 times (retryCount: 0 or 1)
      // This means max 2 retries after initial attempt = 3 total attempts
      retryCount: { lt: 2 },
      // Either never retried, or last retry was before today (prevent same-day retries)
      OR: [
        { lastRetryAttempt: null },
        { lastRetryAttempt: { lt: todayMidnight } }
      ]
    },
    include: {
      booking: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          listingId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              stripeCustomerId: true,
              verifiedAt: true
            }
          },
          listing: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  stripeAccountId: true,
                  stripeChargesEnabled: true,
                  verifiedAt: true
                }
              }
            }
          }
        }
      },
      charges: true // Include itemized charges for new payment model
    }
  });
};

/**
 * Process all failed payments
 */
const processPayments = async (payments: any[]) => {
  let successful = 0;
  let failed = 0;

  for (const payment of payments) {
    try {
      const result = await processIndividualPayment(payment);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error retrying payment ${payment.id}:`, error);
      failed++;

      // Update payment with failure information
      await updatePaymentFailure(payment.id, 'Retry processing error occurred');
    }
  }

  return { successful, failed };
};

/**
 * Process an individual rent payment retry
 * (Same logic as main process-rent-payments cron)
 */
const processIndividualPayment = async (payment: any) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  console.log(`Retrying payment ${payment.id} for $${centsToDollars(Number(payment.amount)).toFixed(2)} from ${renter.firstName} to ${host.firstName}`);
  console.log(`  Original dueDate: ${payment.dueDate.toISOString()}`);
  console.log(`  Retry attempt: ${payment.retryCount + 1}`);

  try {
    // Verify host can receive payments
    if (!host.stripeAccountId || !host.stripeChargesEnabled) {
      throw new Error('Host Stripe account not properly configured');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(payment.stripePaymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const isACH = paymentMethod.type === 'us_bank_account';

    // Read amount - prefer totalAmount (new) over amount (legacy)
    const totalAmount = payment.totalAmount !== null && payment.totalAmount !== undefined
      ? Number(payment.totalAmount)
      : Number(payment.amount);

    // Calculate platform fee (same logic as main cron)
    let platformFeeAmount = 0;
    let platformFeeRate = 0;

    if (payment.charges && payment.charges.length > 0) {
      const platformFeeCharge = payment.charges.find(
        (c: any) => c.category === 'PLATFORM_FEE' && c.isApplied
      );

      if (platformFeeCharge) {
        platformFeeAmount = Number(platformFeeCharge.amount);
        if (platformFeeCharge.metadata && typeof platformFeeCharge.metadata === 'object' && 'rate' in platformFeeCharge.metadata) {
          platformFeeRate = Number(platformFeeCharge.metadata.rate) / PERCENT_MULTIPLIER;
        }
      }
    }

    // Fallback to legacy calculation if no charges
    if (platformFeeAmount === 0) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const durationInMonths = Math.round((endDate.getTime() - startDate.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH_PRECISE));

      platformFeeRate = durationInMonths >= FEES.SERVICE_FEE.THRESHOLD_MONTHS
        ? FEES.SERVICE_FEE.LONG_TERM_RATE
        : FEES.SERVICE_FEE.SHORT_TERM_RATE;
      platformFeeAmount = Math.round(totalAmount * platformFeeRate);
    }

    const hostAmount = totalAmount - platformFeeAmount;
    const durationInMonths = Math.round((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (MS_PER_DAY * DAYS_PER_MONTH_PRECISE));

    console.log(`Retry payment calculation for ${payment.id}:`, {
      totalAmount: centsToDollars(totalAmount),
      platformFeeRate: (platformFeeRate * PERCENT_MULTIPLIER) + '%',
      platformFeeAmount: centsToDollars(platformFeeAmount),
      hostAmount: centsToDollars(hostAmount),
      paymentMethodType: paymentMethod.type,
      retryAttempt: payment.retryCount + 1
    });

    // Create payment intent with automatic capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      customer: renter.stripeCustomerId,
      payment_method: payment.stripePaymentMethodId,
      payment_method_types: isCard ? ['card'] : isACH ? ['us_bank_account'] : ['card', 'us_bank_account'],
      capture_method: 'automatic',
      confirm: true,
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: host.stripeAccountId,
      },
      metadata: {
        rentPaymentId: payment.id,
        bookingId: payment.bookingId,
        renterId: renter.id,
        hostId: host.id,
        type: 'monthly_rent_retry',
        paymentMethodType: paymentMethod.type,
        totalAmount: centsToDollars(totalAmount).toString(),
        platformFeeRate: (platformFeeRate * PERCENT_MULTIPLIER).toString() + '%',
        platformFeeAmount: centsToDollars(platformFeeAmount).toString(),
        hostAmount: centsToDollars(hostAmount).toString(),
        bookingDurationMonths: durationInMonths.toString(),
        originalDueDate: payment.dueDate.toISOString(),
        retryAttempt: (payment.retryCount + 1).toString(),
      },
      receipt_email: renter.email,
    }, {
      idempotencyKey: `rent-payment-retry-${payment.id}-${payment.retryCount}-${Date.now()}`,
    });

    console.log(`PaymentIntent created for retry ${payment.id}:`, {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: centsToDollars(paymentIntent.amount)
    });

    // Update payment record based on status
    if (paymentIntent.status === 'succeeded') {
      await updatePaymentSuccess(payment, paymentIntent, platformFeeAmount);
      await sendPaymentSuccessNotifications(payment, paymentIntent, paymentMethod);
      console.log(`✅ Retry payment ${payment.id} processed successfully`);
      return { success: true };
    } else if (paymentIntent.status === 'processing') {
      await updatePaymentProcessing(payment, paymentIntent, platformFeeAmount);
      await sendPaymentProcessingNotifications(payment, paymentIntent, paymentMethod);
      console.log(`⏳ Retry payment ${payment.id} is processing (ACH)`);
      return { success: true };
    } else {
      throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
    }

  } catch (error) {
    console.error(`❌ Failed to retry payment ${payment.id}:`, error);

    // Extract meaningful error message
    let errorMessage = 'Payment retry failed';
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

    await updatePaymentFailure(payment.id, errorMessage);
    await sendPaymentFailureNotifications(payment, errorMessage);

    return { success: false, error: errorMessage };
  }
};

/**
 * Update payment record on successful processing
 */
const updatePaymentSuccess = async (payment: any, paymentIntent: any, platformFeeAmount: number) => {
  await prisma.rentPayment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCEEDED',
      isPaid: true,
      paymentCapturedAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
      lastRetryAttempt: new Date(),
      updatedAt: new Date(),
    },
  });

  const netAmount = paymentIntent.amount - platformFeeAmount;

  await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `RENT-RETRY-${payment.id}-${Date.now()}`,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
      platformFeeAmount: platformFeeAmount,
      stripeFeeAmount: 0,
      netAmount: netAmount,
      processedAt: new Date(),
      userId: payment.booking.user.id,
      bookingId: payment.bookingId,
    },
  });
};

/**
 * Update payment record for processing status (ACH)
 */
const updatePaymentProcessing = async (payment: any, paymentIntent: any, platformFeeAmount: number) => {
  await prisma.rentPayment.update({
    where: { id: payment.id },
    data: {
      status: 'PROCESSING',
      paymentAuthorizedAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
      lastRetryAttempt: new Date(),
      updatedAt: new Date(),
    },
  });

  const netAmount = paymentIntent.amount - platformFeeAmount;

  await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `RENT-RETRY-${payment.id}-${Date.now()}`,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: 'usd',
      status: 'pending',
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'us_bank_account',
      platformFeeAmount: platformFeeAmount,
      stripeFeeAmount: 0,
      netAmount: netAmount,
      userId: payment.booking.user.id,
      bookingId: payment.bookingId,
    },
  });
};

/**
 * Update payment record on failure
 */
const updatePaymentFailure = async (paymentId: string, errorMessage: string) => {
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
};

/**
 * Send notifications for successful payments
 */
const sendPaymentSuccessNotifications = async (payment: any, paymentIntent: any, paymentMethod: any) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  const amount = centsToDollars(paymentIntent.amount).toFixed(2);
  const listingTitle = booking.listing.title;
  const paymentDate = new Date().toLocaleDateString();

  const paymentMethodType = paymentMethod.type;
  const last4 = paymentMethodType === 'card'
    ? paymentMethod.card?.last4
    : paymentMethod.us_bank_account?.last4;

  // Notify renter
  const renterEmailData = buildNotificationEmailData(
    'rent_payment_success',
    {
      content: `Your rent payment of $${amount} for ${listingTitle} was processed successfully after retry.`,
      url: `/app/rent/bookings/${payment.bookingId}`
    },
    {
      firstName: renter.firstName,
      verifiedAt: renter.verifiedAt
    },
    {
      amount,
      listingTitle,
      paymentDate,
      paymentMethodType,
      paymentMethodLast4: last4,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/bookings/${payment.bookingId}`
    }
  );

  await sendNotificationEmail({
    to: renter.email,
    subject: getNotificationEmailSubject('rent_payment_success'),
    emailData: renterEmailData,
  });

  // Notify host
  const hostEmailData = buildNotificationEmailData(
    'rent_payment_success',
    {
      content: `Rent payment of $${amount} from ${renter.firstName} ${renter.lastName} for ${listingTitle} was processed successfully after retry.`,
      url: `/app/host/${booking.listingId}/bookings/${booking.id}`
    },
    {
      firstName: host.firstName,
      verifiedAt: host.verifiedAt
    },
    {
      amount,
      listingTitle,
      paymentDate,
      paymentMethodType,
      paymentMethodLast4: last4,
      renterName: `${renter.firstName} ${renter.lastName}`.trim() || renter.email,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/host/${booking.listingId}/bookings/${booking.id}`
    }
  );

  await sendNotificationEmail({
    to: host.email,
    subject: getNotificationEmailSubject('rent_payment_success'),
    emailData: hostEmailData,
  });
};

/**
 * Send notifications for processing payments (ACH)
 */
const sendPaymentProcessingNotifications = async (payment: any, paymentIntent: any, paymentMethod: any) => {
  const { booking } = payment;
  const renter = booking.user;

  const amount = centsToDollars(paymentIntent.amount).toFixed(2);
  const listingTitle = booking.listing.title;

  const paymentMethodType = paymentMethod.type;
  const last4 = paymentMethodType === 'card'
    ? paymentMethod.card?.last4
    : paymentMethod.us_bank_account?.last4;

  const emailData = buildNotificationEmailData(
    'rent_payment_processing',
    {
      content: `Your rent payment of $${amount} for ${listingTitle} is being processed (retry attempt ${payment.retryCount + 1}).`,
      url: `/app/rent/bookings/${payment.bookingId}`
    },
    {
      firstName: renter.firstName,
      verifiedAt: renter.verifiedAt
    },
    {
      amount,
      listingTitle,
      paymentMethodType,
      paymentMethodLast4: last4,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/bookings/${payment.bookingId}`
    }
  );

  await sendNotificationEmail({
    to: renter.email,
    subject: getNotificationEmailSubject('rent_payment_processing'),
    emailData,
  });
};

/**
 * Send notifications for failed payments
 */
const sendPaymentFailureNotifications = async (payment: any, errorMessage: string) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  const amount = centsToDollars(Number(payment.amount)).toFixed(2);
  const listingTitle = booking.listing.title;

  // Calculate next business day for retry message
  const nextRetryDate = getNextBusinessDay();

  // Determine if this is the final attempt (retryCount will be 2 after this failure)
  const isFinalAttempt = payment.retryCount + 1 >= 2;

  // Notify renter of failure
  const renterEmailData = buildNotificationEmailData(
    isFinalAttempt ? 'payment_failed_severe' : 'rent_payment_failed',
    {
      content: isFinalAttempt
        ? `Your rent payment of $${amount} for ${listingTitle} failed after ${payment.retryCount + 1} attempts.`
        : `Your rent payment of $${amount} for ${listingTitle} failed.`,
      url: `/app/rent/bookings/${payment.bookingId}`
    },
    {
      firstName: renter.firstName,
      verifiedAt: renter.verifiedAt
    },
    {
      amount,
      listingTitle,
      failureReason: errorMessage,
      nextRetryDate: isFinalAttempt ? null : nextRetryDate,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/payment-methods`,
    }
  );

  await sendNotificationEmail({
    to: renter.email,
    subject: getNotificationEmailSubject(isFinalAttempt ? 'payment_failed_severe' : 'rent_payment_failed'),
    emailData: renterEmailData,
  });

  // Notify admin (tyler.bennett52@gmail.com) of failure
  const adminEmailData = buildNotificationEmailData(
    'rent_payment_failed',
    {
      content: `Rent payment retry failed for ${listingTitle} (attempt ${payment.retryCount + 1})`,
      url: '/admin'
    },
    undefined,
    {
      amount,
      listingTitle,
      failureReason: errorMessage,
      renterName: `${renter.firstName} ${renter.lastName}`.trim() || renter.email,
      renterEmail: renter.email,
      hostName: `${host.firstName} ${host.lastName}`.trim() || host.email,
      hostEmail: host.email,
      paymentId: payment.id,
      retryCount: payment.retryCount + 1,
      isFinalAttempt,
    }
  );

  await sendNotificationEmail({
    to: 'tyler.bennett52@gmail.com',
    subject: `Rent Payment Retry Failed - ${booking.listing.title} (Attempt ${payment.retryCount + 1})`,
    emailData: adminEmailData,
  });
};

/**
 * Get next business day for retry message
 */
const getNextBusinessDay = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // If tomorrow is Saturday (6) or Sunday (0), move to Monday
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  return tomorrow.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
};
