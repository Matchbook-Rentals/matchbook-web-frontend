/**
 * Payment Notification Builders for Initial Booking Payments
 *
 * Helper functions to create and send notifications for initial booking payment events
 * (security deposits, first month rent + deposit, etc.)
 * Used by Stripe webhooks for payment_intent.succeeded and payment_intent.failed events.
 */

import prismadb from '@/lib/prismadb';
import { sendNotificationEmail } from '@/lib/send-notification-email';

interface PaymentSuccessNotificationData {
  renterEmail: string;
  renterName: string;
  renterId: string;
  bookingId: string;
  listingAddress: string;
  amount: number;
}

interface PaymentFailureNotificationData {
  renterEmail: string;
  renterName: string;
  renterId: string;
  hostEmail: string;
  hostName: string;
  hostId: string;
  matchId: string;
  bookingId: string;
  failureReason: string;
  amount: number;
}

/**
 * Send payment success notification to renter
 */
export async function sendPaymentSuccessNotification(
  data: PaymentSuccessNotificationData
): Promise<void> {
  const { renterId, renterEmail, renterName, bookingId, listingAddress, amount } = data;

  try {
    // Create in-app notification
    await prismadb.notification.create({
      data: {
        userId: renterId,
        actionType: 'payment_success',
        content: `Your payment of $${amount.toFixed(2)} has been confirmed. Your booking is complete!`,
        url: `/app/rent/bookings/${bookingId}`,
        isRead: false,
      }
    });

    // Send email notification using Resend
    await sendNotificationEmail({
      to: renterEmail,
      subject: 'Payment Confirmed - Your Booking is Complete',
      emailData: {
        title: 'Payment Confirmed!',
        previewText: `Your payment of $${amount.toFixed(2)} has successfully cleared.`,
        greeting: `Hi ${renterName},`,
        body: `
          <p>Great news! Your payment of <strong>$${amount.toFixed(2)}</strong> has successfully cleared.</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Property:</strong> ${listingAddress}</p>
          </div>

          <p>Your booking is now fully confirmed. You'll receive move-in instructions closer to your start date.</p>

          <p>If you have any questions, feel free to contact your host or reach out to our support team.</p>
        `,
        ctaText: 'View Booking',
        ctaUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/bookings/${bookingId}`,
      }
    });

    console.log(`✅ Payment success notification sent to renter ${renterId}`);
    console.log(`   Amount: $${amount.toFixed(2)}`);
    console.log(`   Property: ${listingAddress}`);

  } catch (error) {
    console.error('❌ Failed to send payment success notification:', error);
    throw error;
  }
}

/**
 * Send payment failure notification to renter with retry link
 */
export async function sendPaymentFailureNotificationToRenter(
  data: PaymentFailureNotificationData
): Promise<void> {
  const { renterId, renterEmail, renterName, matchId, bookingId, failureReason, amount } = data;

  try {
    // Create in-app notification
    await prismadb.notification.create({
      data: {
        userId: renterId,
        actionType: 'payment_failed',
        content: `Your payment of $${amount.toFixed(2)} could not be processed. Please retry payment.`,
        url: `/app/rent/match/${matchId}/retry-payment`,
        isRead: false,
      }
    });

    // Send email notification using Resend
    await sendNotificationEmail({
      to: renterEmail,
      subject: 'Payment Failed - Action Required',
      emailData: {
        title: 'Payment Issue - Action Needed',
        previewText: `Your payment of $${amount.toFixed(2)} could not be processed.`,
        greeting: `Hi ${renterName},`,
        body: `
          <p>Unfortunately, your payment of <strong>$${amount.toFixed(2)}</strong> could not be processed.</p>

          <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p><strong>Reason:</strong> ${failureReason}</p>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
          </div>

          <p><strong>What to do next:</strong></p>
          <ul>
            <li>Click the button below to retry with a different payment method</li>
            <li>You have <strong style="color: #EF4444;">48 hours</strong> to complete payment before your booking is cancelled</li>
          </ul>

          <p style="margin-top: 30px;">If you need help, please contact our support team.</p>
        `,
        ctaText: 'Retry Payment Now',
        ctaUrl: `${process.env.NEXT_PUBLIC_URL}/app/rent/match/${matchId}/retry-payment`,
      }
    });

    console.log(`✅ Payment failure notification sent to renter ${renterId}`);
    console.log(`   Amount: $${amount.toFixed(2)}`);
    console.log(`   Reason: ${failureReason}`);

  } catch (error) {
    console.error('❌ Failed to send payment failure notification to renter:', error);
    throw error;
  }
}

/**
 * Send payment failure notification to host
 */
export async function sendPaymentFailureNotificationToHost(
  data: PaymentFailureNotificationData
): Promise<void> {
  const { hostId, hostEmail, hostName, renterName, bookingId, failureReason, amount } = data;

  try {
    // Create in-app notification for host
    await prismadb.notification.create({
      data: {
        userId: hostId,
        actionType: 'payment_failed_host',
        content: `${renterName}'s payment of $${amount.toFixed(2)} could not be processed. They have been notified to retry.`,
        url: `/app/messages`,
        isRead: false,
      }
    });

    // Send email notification using Resend
    await sendNotificationEmail({
      to: hostEmail,
      subject: 'Booking Payment Issue - Renter Notified',
      emailData: {
        title: 'Payment Issue Notification',
        previewText: `Payment for booking ${bookingId} could not be processed.`,
        greeting: `Hi ${hostName},`,
        body: `
          <p>We wanted to let you know that the payment for booking <strong>${bookingId}</strong> could not be processed.</p>

          <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Renter:</strong> ${renterName}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Reason:</strong> ${failureReason}</p>
          </div>

          <p>The renter has been notified and has 48 hours to provide alternative payment. We'll keep you updated on their progress.</p>

          <p>If payment is not received within 48 hours, the booking will be automatically cancelled and the dates will be made available again.</p>
        `,
        ctaText: 'View Messages',
        ctaUrl: `${process.env.NEXT_PUBLIC_URL}/app/messages`,
      }
    });

    console.log(`✅ Payment failure notification sent to host ${hostId}`);
    console.log(`   Renter: ${renterName}`);
    console.log(`   Amount: $${amount.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Failed to send payment failure notification to host:', error);
    throw error;
  }
}
