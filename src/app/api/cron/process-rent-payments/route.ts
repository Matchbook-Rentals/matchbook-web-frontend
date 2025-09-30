import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import stripe from '@/lib/stripe';
import { FEES } from '@/lib/fee-constants';
import { sendNotificationEmail } from '@/lib/send-notification-email';

/**
 * CRON JOB: Process Rent Payments
 *
 * Purpose:
 * This cron job automatically processes rent payments that are due today (Pacific time).
 * It runs at 1am Pacific time (8am UTC) to charge renters and transfer funds to hosts.
 *
 * Business Logic:
 * 1. FIND DUE PAYMENTS: Identifies rent payments where dueDate is today (Pacific time)
 * 2. PAYMENT PROCESSING: Creates Stripe PaymentIntents with automatic capture
 * 3. FEE CALCULATION: Applies appropriate platform fees (1.5% ACH, 3% cards)
 * 4. FUND TRANSFER: Transfers net amount to host's Stripe Connect account
 * 5. RECORD KEEPING: Updates payment status and creates transaction records
 * 6. NOTIFICATIONS: Sends email notifications for success/failure
 * 7. ERROR HANDLING: Implements retry logic and comprehensive error tracking
 *
 * Fee Structure:
 * - ACH/Bank Transfer: 1.5% platform fee
 * - Credit/Debit Cards: 3% platform fee
 * - Stripe processing fees are automatically deducted by Stripe
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
    const todayPacific = getTodayInPacific();

    // Find all rent payments due today that haven't been paid or cancelled
    const duePayments = await findDuePayments(todayPacific);

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
 * Get today's date in Pacific timezone
 */
const getTodayInPacific = (): Date => {
  const now = new Date();
  // Convert to Pacific time and get start of day
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  pacificTime.setHours(0, 0, 0, 0);
  return pacificTime;
};

/**
 * Find all rent payments due today that need processing
 */
const findDuePayments = async (todayPacific: Date) => {
  const tomorrowPacific = new Date(todayPacific);
  tomorrowPacific.setDate(tomorrowPacific.getDate() + 1);

  return await prisma.rentPayment.findMany({
    where: {
      dueDate: {
        gte: todayPacific,
        lt: tomorrowPacific
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

  console.log(`Processing payment ${payment.id} for $${payment.amount} from ${renter.firstName} to ${host.firstName}`);

  try {
    // Verify host can receive payments
    if (!host.stripeAccountId || !host.stripeChargesEnabled) {
      throw new Error('Host Stripe account not properly configured');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(payment.stripePaymentMethodId);
    const isCard = paymentMethod.type === 'card';
    const isACH = paymentMethod.type === 'us_bank_account';

    // Calculate fees
    const baseAmount = payment.amount * 100; // Convert to cents
    const platformFeeRate = isACH ? FEES.ACH_RATE : FEES.CARD_RATE;
    const platformFee = Math.round(baseAmount * platformFeeRate);
    const hostAmount = baseAmount - platformFee;

    console.log(`Payment calculation for ${payment.id}:`, {
      baseAmount: baseAmount / 100,
      platformFeeRate,
      platformFee: platformFee / 100,
      hostAmount: hostAmount / 100,
      paymentMethodType: paymentMethod.type
    });

    // Create payment intent with automatic capture
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
        amount: hostAmount,
      },
      metadata: {
        rentPaymentId: payment.id,
        bookingId: payment.bookingId,
        renterId: renter.id,
        hostId: host.id,
        type: 'monthly_rent',
        paymentMethodType: paymentMethod.type,
        platformFee: (platformFee / 100).toString(),
        hostAmount: (hostAmount / 100).toString(),
      },
      receipt_email: renter.email,
    }, {
      idempotencyKey: `rent-payment-${payment.id}-${payment.retryCount || 0}`,
    });

    console.log(`PaymentIntent created for payment ${payment.id}:`, {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100
    });

    // Update payment record based on status
    if (paymentIntent.status === 'succeeded') {
      await updatePaymentSuccess(payment, paymentIntent, platformFee);
      await sendPaymentSuccessNotifications(payment, paymentIntent);
      console.log(`✅ Payment ${payment.id} processed successfully`);
      return { success: true };
    } else if (paymentIntent.status === 'processing') {
      // ACH payments often go to processing state
      await updatePaymentProcessing(payment, paymentIntent, platformFee);
      await sendPaymentProcessingNotifications(payment, paymentIntent);
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
const updatePaymentSuccess = async (payment: any, paymentIntent: any, platformFee: number) => {
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
      platformFeeAmount: platformFee,
      stripeFeeAmount: 0, // Stripe fees are automatically deducted
      netAmount: paymentIntent.amount - platformFee,
      processedAt: new Date(),
      userId: payment.booking.user.id,
      bookingId: payment.bookingId,
    },
  });
};

/**
 * Update payment record for processing status (ACH)
 */
const updatePaymentProcessing = async (payment: any, paymentIntent: any, platformFee: number) => {
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
      platformFeeAmount: platformFee,
      stripeFeeAmount: 0,
      netAmount: paymentIntent.amount - platformFee,
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
const sendPaymentSuccessNotifications = async (payment: any, paymentIntent: any) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  // Notify renter
  await sendNotificationEmail({
    to: renter.email,
    subject: 'Rent Payment Processed Successfully',
    emailData: {
      type: 'payment_success',
      recipientName: renter.firstName || renter.email,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentDate: new Date().toLocaleDateString(),
      propertyName: booking.listing.title,
      paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
    },
  });

  // Notify host
  await sendNotificationEmail({
    to: host.email,
    subject: 'Rent Payment Received',
    emailData: {
      type: 'payment_received',
      recipientName: host.firstName || host.email,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentDate: new Date().toLocaleDateString(),
      propertyName: booking.listing.title,
      renterName: `${renter.firstName} ${renter.lastName}`.trim() || renter.email,
    },
  });
};

/**
 * Send notifications for processing payments (ACH)
 */
const sendPaymentProcessingNotifications = async (payment: any, paymentIntent: any) => {
  const { booking } = payment;
  const renter = booking.user;

  // Notify renter that ACH payment is processing
  await sendNotificationEmail({
    to: renter.email,
    subject: 'Rent Payment Processing',
    emailData: {
      type: 'payment_processing',
      recipientName: renter.firstName || renter.email,
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      paymentDate: new Date().toLocaleDateString(),
      propertyName: booking.listing.title,
      expectedCompletionDays: '3-5 business days',
    },
  });
};

/**
 * Send notifications for failed payments
 */
const sendPaymentFailureNotifications = async (payment: any, errorMessage: string) => {
  const { booking } = payment;
  const renter = booking.user;
  const host = booking.listing.user;

  // Notify renter of failure
  await sendNotificationEmail({
    to: renter.email,
    subject: 'Rent Payment Failed - Action Required',
    emailData: {
      type: 'payment_failed',
      recipientName: renter.firstName || renter.email,
      paymentAmount: payment.amount.toFixed(2),
      paymentDate: new Date().toLocaleDateString(),
      propertyName: booking.listing.title,
      failureReason: errorMessage,
      actionUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/bookings/${payment.bookingId}`,
    },
  });

  // Notify admin (tyler.bennett52@gmail.com) of failure
  await sendNotificationEmail({
    to: 'tyler.bennett52@gmail.com',
    subject: `Rent Payment Failed - ${booking.listing.title}`,
    emailData: {
      type: 'admin_payment_failed',
      recipientName: 'Tyler',
      paymentAmount: payment.amount.toFixed(2),
      paymentDate: new Date().toLocaleDateString(),
      propertyName: booking.listing.title,
      renterName: `${renter.firstName} ${renter.lastName}`.trim() || renter.email,
      renterEmail: renter.email,
      hostName: `${host.firstName} ${host.lastName}`.trim() || host.email,
      hostEmail: host.email,
      failureReason: errorMessage,
      paymentId: payment.id,
      retryCount: (payment.retryCount || 0) + 1,
    },
  });
};