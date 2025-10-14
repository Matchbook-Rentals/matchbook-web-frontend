/**
 * Rent Payment Notification Builders
 *
 * Helper functions to create and send notifications for rent payment events.
 * Used by Stripe webhooks and cron jobs processing recurring rent payments.
 */

import prismadb from '@/lib/prismadb';
import { addBusinessDays, format } from 'date-fns';

interface RentPaymentFailureNotificationData {
  paymentTransactionId: string;
  bookingId: string;
  renterId: string;
  hostId: string;
  amount: number;
  listingTitle: string;
  failureCode?: string;
  failureMessage?: string;
  retryCount?: number;
}

/**
 * Calculate next retry date (next business day)
 */
function getNextRetryDate(): string {
  const nextBusinessDay = addBusinessDays(new Date(), 1);
  return format(nextBusinessDay, 'EEEE, MMMM d'); // e.g., "Monday, January 15"
}

/**
 * Send rent payment failure notification to renter
 */
export async function sendRentPaymentFailureNotification(
  data: RentPaymentFailureNotificationData
): Promise<void> {
  const { renterId, bookingId, amount, listingTitle, retryCount = 0 } = data;

  try {
    // Get renter details
    const renter = await prismadb.user.findUnique({
      where: { id: renterId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!renter) {
      console.error(`❌ Renter not found: ${renterId}`);
      return;
    }

    // Format amount (assuming it's in cents)
    const amountFormatted = (amount / 100).toFixed(2);

    // Calculate next retry date
    const nextRetryDate = getNextRetryDate();

    // Create in-app notification
    await prismadb.notification.create({
      data: {
        userId: renterId,
        actionType: 'rent_payment_failed',
        content: `Your rent payment of $${amountFormatted} could not be processed. We'll retry on ${nextRetryDate}.`,
        url: `/app/rent/bookings/${bookingId}`,
        isRead: false,
      }
    });

    console.log(`✅ Rent payment failure notification created for renter ${renterId}`);
    console.log(`   Amount: $${amountFormatted}`);
    console.log(`   Listing: ${listingTitle}`);
    console.log(`   Next retry: ${nextRetryDate}`);
    console.log(`   Retry count: ${retryCount}`);

    // Email notification will be sent automatically by the notification system
    // based on user's email preferences

  } catch (error) {
    console.error('❌ Failed to send rent payment failure notification:', error);
    throw error;
  }
}

/**
 * Send rent payment failure notification to host
 */
export async function sendRentPaymentFailureNotificationToHost(
  data: RentPaymentFailureNotificationData
): Promise<void> {
  const { hostId, renterId, bookingId, amount, listingTitle, retryCount = 0 } = data;

  try {
    // Get host and renter details
    const [host, renter] = await Promise.all([
      prismadb.user.findUnique({
        where: { id: hostId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      }),
      prismadb.user.findUnique({
        where: { id: renterId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      })
    ]);

    if (!host) {
      console.error(`❌ Host not found: ${hostId}`);
      return;
    }

    if (!renter) {
      console.error(`❌ Renter not found: ${renterId}`);
      return;
    }

    // Format amount (assuming it's in cents)
    const amountFormatted = (amount / 100).toFixed(2);
    const renterName = `${renter.firstName || ''} ${renter.lastName || ''}`.trim() || 'The renter';
    const nextRetryDate = getNextRetryDate();

    // Create in-app notification for host
    await prismadb.notification.create({
      data: {
        userId: hostId,
        actionType: 'rent_payment_failed_host',
        content: `${renterName}'s rent payment of $${amountFormatted} for ${listingTitle} could not be processed. We'll retry on ${nextRetryDate}.`,
        url: `/app/messages`, // Link to messages so host can contact renter
        isRead: false,
      }
    });

    console.log(`✅ Rent payment failure notification sent to host ${hostId}`);
    console.log(`   Renter: ${renterName}`);
    console.log(`   Amount: $${amountFormatted}`);
    console.log(`   Listing: ${listingTitle}`);
    console.log(`   Retry count: ${retryCount}`);

  } catch (error) {
    console.error('❌ Failed to send rent payment failure notification to host:', error);
    throw error;
  }
}

/**
 * Send rent payment success notification to renter
 */
export async function sendRentPaymentSuccessNotification(
  paymentTransactionId: string
): Promise<void> {
  try {
    // Get payment transaction details
    const payment = await prismadb.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
      include: {
        booking: {
          include: {
            listing: true,
            user: true, // renter
          }
        }
      }
    });

    if (!payment || !payment.booking) {
      console.error(`❌ Payment transaction or booking not found: ${paymentTransactionId}`);
      return;
    }

    const renter = payment.booking.user;
    const listing = payment.booking.listing;
    const amountFormatted = (payment.amount / 100).toFixed(2);

    // Create in-app notification
    await prismadb.notification.create({
      data: {
        userId: renter.id,
        actionType: 'rent_payment_success',
        content: `Your rent payment of $${amountFormatted} for ${listing.locationString || 'your property'} was processed successfully.`,
        url: `/app/rent/bookings/${payment.booking.id}`,
        isRead: false,
      }
    });

    console.log(`✅ Rent payment success notification sent to renter ${renter.id}`);
    console.log(`   Amount: $${amountFormatted}`);
    console.log(`   Listing: ${listing.locationString}`);

  } catch (error) {
    console.error('❌ Failed to send rent payment success notification:', error);
    throw error;
  }
}

/**
 * Send rent payment processing notification to renter (for ACH payments)
 */
export async function sendRentPaymentProcessingNotification(
  paymentTransactionId: string
): Promise<void> {
  try {
    // Get payment transaction details
    const payment = await prismadb.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
      include: {
        booking: {
          include: {
            listing: true,
            user: true, // renter
          }
        }
      }
    });

    if (!payment || !payment.booking) {
      console.error(`❌ Payment transaction or booking not found: ${paymentTransactionId}`);
      return;
    }

    const renter = payment.booking.user;
    const listing = payment.booking.listing;
    const amountFormatted = (payment.amount / 100).toFixed(2);

    // Create in-app notification
    await prismadb.notification.create({
      data: {
        userId: renter.id,
        actionType: 'rent_payment_processing',
        content: `Your rent payment of $${amountFormatted} for ${listing.locationString || 'your property'} is being processed (ACH takes 3-5 business days).`,
        url: `/app/rent/bookings/${payment.booking.id}`,
        isRead: false,
      }
    });

    console.log(`✅ Rent payment processing notification sent to renter ${renter.id}`);
    console.log(`   Amount: $${amountFormatted}`);
    console.log(`   Listing: ${listing.locationString}`);

  } catch (error) {
    console.error('❌ Failed to send rent payment processing notification:', error);
    throw error;
  }
}
