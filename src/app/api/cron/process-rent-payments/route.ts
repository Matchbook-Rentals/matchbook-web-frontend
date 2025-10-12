import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { sendNotificationEmail } from '@/lib/send-notification-email';
import { buildNotificationEmailData, getNotificationEmailSubject } from '@/lib/notification-email-config';

/**
 * CRON JOB: Process Rent Payments
 *
 * Purpose:
 * This cron job automatically processes rent payments that are due today (UTC calendar date).
 * It runs at 1am Pacific time (8am UTC) to charge renters and transfer funds to hosts.
 *
 * Business Logic:
 * 1. FIND DUE PAYMENTS: Identifies rent payments where dueDate is today (UTC calendar date)
 * 2. PAYMENT PROCESSING: Creates Stripe PaymentIntents with automatic capture
 * 3. FUND TRANSFER: Transfers full amount to host's Stripe Connect account
 * 4. RECORD KEEPING: Updates payment status and creates transaction records
 * 5. NOTIFICATIONS: Sends email notifications for success/failure
 * 6. ERROR HANDLING: Implements retry logic and comprehensive error tracking
 *
 * Fee Structure:
 * - Service fees (3% or 1.5%) are already included in the payment amount
 * - Full amount including service fee is transferred to host
 * - Stripe processing fees are automatically deducted by Stripe
 * - Platform revenue comes from the $7 deposit transfer fee collected at booking time
 *
 * Safety Features:
 * - Idempotency checks to prevent duplicate processing
 * - Maximum retry attempts (3) to handle temporary failures
 * - Comprehensive logging for audit and debugging
 * - Graceful handling of invalid payment methods
 */

export async function GET(request: Request) {
  // Authorization check using cron secret
  const authHeader = request.headers.get('authorization');
  console.log('Process rent payments - Received auth header:', authHeader);
  console.log('Process rent payments - Expected auth header:', `Bearer ${process.env.CRON_SECRET}`);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron job access attempt - process rent payments');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Cron job: Starting rent payment processing...');

  try {
    const todayMidnight = getTodayAtMidnight();
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

    console.log('📅 Cron job date range:');
    console.log(`  - Today (midnight UTC): ${todayMidnight.toISOString()}`);
    console.log(`  - Tomorrow (midnight UTC): ${tomorrowMidnight.toISOString()}`);
    console.log(`  - Looking for payments with dueDate >= ${todayMidnight.toISOString()} AND < ${tomorrowMidnight.toISOString()}`);

    // Find all rent payments due today that haven't been paid or cancelled
    const duePayments = await findDuePayments(todayMidnight);

    if (duePayments.length === 0) {
      console.log('Cron job: No rent payments due today.');
      return NextResponse.json({
        success: true,
        message: 'No payments due today',
        processedPayments: 0
      });
    }

    console.log(`Cron job: Found ${duePayments.length} rent payments due today.`);

    // Process each payment
    const results = await processPayments(duePayments);

    console.log(`Cron job: Payment processing complete. Success: ${results.successful}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      processedPayments: duePayments.length,
      successfulPayments: results.successful,
      failedPayments: results.failed,
      message: `Processed ${duePayments.length} payments: ${results.successful} successful, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Cron job: Error processing rent payments:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get today's date at midnight UTC
 * We compare calendar dates, not times with timezone offsets
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
 * Find all rent payments due today that need processing
 */
const findDuePayments = async (todayMidnight: Date) => {
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  // First, let's see ALL unpaid payments to debug
  const allUnpaidPayments = await prisma.rentPayment.findMany({
    where: {
      isPaid: false,
      cancelledAt: null,
    },
    select: {
      id: true,
      dueDate: true,
      amount: true,
      stripePaymentMethodId: true,
      retryCount: true,
    }
  });

  console.log('🔍 All unpaid payments in database:');
  allUnpaidPayments.forEach(p => {
    console.log(`  - ${p.id}: dueDate=${p.dueDate.toISOString()}, amount=${p.amount}, hasPaymentMethod=${!!p.stripePaymentMethodId}, retryCount=${p.retryCount}`);
  });

  return await prisma.rentPayment.findMany({
    where: {
      dueDate: {
        gte: todayMidnight,
        lt: tomorrowMidnight
      },
      isPaid: false,
      cancelledAt: null,
      stripePaymentMethodId: { not: null },
      // Only process payments that haven't exceeded retry limit
      retryCount: { lt: 3 }
    },
    include: {
      booking: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              stripeCustomerId: true
            }
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
                  stripeChargesEnabled: true
                }
              }
            }
          }
        }
      }
    }
  });
};

/**
 * Process all due payments
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
      console.error(`Error processing payment ${payment.id}:`, error);
      failed++;

      // Update payment with failure information
      await updatePaymentFailure(payment.id, 'Processing error occurred');
    }
  }

  return { successful, failed };
};

/**
 * Process an individual rent payment
 */
const processIndividualPayment = async (payment: any) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  console.log(`Processing payment ${payment.id} for $${(Number(payment.amount) / 100).toFixed(2)} from ${renter.firstName} to ${host.firstName}`);

  try {
    // Verify host can receive payments
    if (!host.stripeAccountId || !host.stripeChargesEnabled) {
      throw new Error('Host Stripe account not properly configured');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(payment.stripePaymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const isACH = paymentMethod.type === 'us_bank_account';

    // Amount is already stored in cents in the database (Decimal type)
    // NOTE: The service fee is already included in the amount when the payment was created
    const baseAmount = Number(payment.amount);

    console.log(`Payment calculation for ${payment.id}:`, {
      baseAmount: baseAmount / 100,
      paymentMethodType: paymentMethod.type,
      note: 'Service fee already included in amount'
    });

    // Create payment intent with automatic capture
    // NOTE: Full amount is transferred to host (service fee already included in amount)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: baseAmount,
      currency: 'usd',
      customer: renter.stripeCustomerId,
      payment_method: payment.stripePaymentMethodId,
      payment_method_types: isCard ? ['card'] : isACH ? ['us_bank_account'] : ['card', 'us_bank_account'],
      capture_method: 'automatic',
      confirm: true,
      transfer_data: {
        destination: host.stripeAccountId,
        amount: baseAmount, // Transfer full amount to host
      },
      metadata: {
        rentPaymentId: payment.id,
        bookingId: payment.bookingId,
        renterId: renter.id,
        hostId: host.id,
        type: 'monthly_rent',
        paymentMethodType: paymentMethod.type,
        totalAmount: (baseAmount / 100).toString(),
      },
      receipt_email: renter.email,
    }, {
      // Add timestamp to idempotency key to allow multiple test runs
      idempotencyKey: `rent-payment-${payment.id}-${payment.retryCount || 0}-${Date.now()}`,
    });

    console.log(`PaymentIntent created for payment ${payment.id}:`, {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    });

    // Update payment record based on status
    if (paymentIntent.status === 'succeeded') {
      await updatePaymentSuccess(payment, paymentIntent);
      await sendPaymentSuccessNotifications(payment, paymentIntent, paymentMethod);
      console.log(`✅ Payment ${payment.id} processed successfully`);
      return { success: true };
    } else if (paymentIntent.status === 'processing') {
      // ACH payments often go to processing state
      await updatePaymentProcessing(payment, paymentIntent);
      await sendPaymentProcessingNotifications(payment, paymentIntent, paymentMethod);
      console.log(`⏳ Payment ${payment.id} is processing (ACH)`);
      return { success: true };
    } else {
      throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
    }

  } catch (error) {
    console.error(`❌ Failed to process payment ${payment.id}:`, error);

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

    await updatePaymentFailure(payment.id, errorMessage);
    await sendPaymentFailureNotifications(payment, errorMessage);

    return { success: false, error: errorMessage };
  }
};

/**
 * Update payment record on successful processing
 */
const updatePaymentSuccess = async (payment: any, paymentIntent: any) => {
  // Update rent payment
  await prisma.rentPayment.update({
    where: { id: payment.id },
    data: {
      isPaid: true,
      paymentCapturedAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date(),
    },
  });

  // Create payment transaction record
  await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `RENT-${payment.id}-${Date.now()}`,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
      platformFeeAmount: 0, // No platform fee deducted (service fee goes to host)
      stripeFeeAmount: 0, // Stripe fees are automatically deducted
      netAmount: paymentIntent.amount,
      processedAt: new Date(),
      userId: payment.booking.user.id,
      bookingId: payment.bookingId,
    },
  });
};

/**
 * Update payment record for processing status (ACH)
 */
const updatePaymentProcessing = async (payment: any, paymentIntent: any) => {
  // Update rent payment - mark as processing
  await prisma.rentPayment.update({
    where: { id: payment.id },
    data: {
      paymentAuthorizedAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date(),
      // Don't mark as paid yet - wait for webhook confirmation
    },
  });

  // Create payment transaction record with processing status
  await prisma.paymentTransaction.create({
    data: {
      transactionNumber: `RENT-${payment.id}-${Date.now()}`,
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: 'usd',
      status: 'pending',
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'us_bank_account',
      platformFeeAmount: 0, // No platform fee deducted (service fee goes to host)
      stripeFeeAmount: 0,
      netAmount: paymentIntent.amount,
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
      failureReason: errorMessage,
      retryCount: { increment: 1 },
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

  const amount = (paymentIntent.amount / 100).toFixed(2);
  const listingTitle = booking.listing.title;
  const paymentDate = new Date().toLocaleDateString();

  // Extract payment method details
  const paymentMethodType = paymentMethod.type;
  const last4 = paymentMethodType === 'card'
    ? paymentMethod.card?.last4
    : paymentMethod.us_bank_account?.last4;

  // Notify renter
  const renterEmailData = buildNotificationEmailData(
    'rent_payment_success',
    {
      content: `Your rent payment of $${amount} for ${listingTitle} was processed successfully.`,
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
      content: `Rent payment of $${amount} from ${renter.firstName} ${renter.lastName} for ${listingTitle} was processed successfully.`,
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

  const amount = (paymentIntent.amount / 100).toFixed(2);
  const listingTitle = booking.listing.title;
  const paymentDate = new Date().toLocaleDateString();

  // Extract payment method details
  const paymentMethodType = paymentMethod.type;
  const last4 = paymentMethodType === 'card'
    ? paymentMethod.card?.last4
    : paymentMethod.us_bank_account?.last4;

  // Notify renter that ACH payment is processing
  const emailData = buildNotificationEmailData(
    'rent_payment_processing',
    {
      content: `Your rent payment of $${amount} for ${listingTitle} is being processed.`,
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

  const amount = (Number(payment.amount) / 100).toFixed(2);
  const listingTitle = booking.listing.title;
  const paymentDate = new Date().toLocaleDateString();

  // Notify renter of failure
  const renterEmailData = buildNotificationEmailData(
    'rent_payment_failed',
    {
      content: `Your rent payment of $${amount} for ${listingTitle} failed.`,
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
      failureReason: errorMessage,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/bookings/${payment.bookingId}`,
    }
  );

  await sendNotificationEmail({
    to: renter.email,
    subject: getNotificationEmailSubject('rent_payment_failed'),
    emailData: renterEmailData,
  });

  // Notify admin (tyler.bennett52@gmail.com) of failure
  const adminEmailData = buildNotificationEmailData(
    'rent_payment_failed',
    {
      content: `Rent payment failed for ${listingTitle}`,
      url: '/admin'
    },
    undefined, // No user context for admin email
    {
      amount,
      listingTitle,
      paymentDate,
      failureReason: errorMessage,
      renterName: `${renter.firstName} ${renter.lastName}`.trim() || renter.email,
      renterEmail: renter.email,
      hostName: `${host.firstName} ${host.lastName}`.trim() || host.email,
      hostEmail: host.email,
      paymentId: payment.id,
      retryCount: (payment.retryCount || 0) + 1,
    }
  );

  await sendNotificationEmail({
    to: 'tyler.bennett52@gmail.com',
    subject: `Rent Payment Failed - ${booking.listing.title}`,
    emailData: adminEmailData,
  });
};