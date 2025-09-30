/**
 * Stripe Payment Webhook Event Handlers
 *
 * Handles payment lifecycle events: processing, succeeded, failed
 * For documentation, see /docs/webhooks/stripe.md
 */
import prismadb from '@/lib/prismadb';
import { sendPaymentSuccessEmail, sendPaymentFailureEmails, getHumanReadableFailureReason } from '@/lib/emails';

export async function handlePaymentIntentProcessing(event: any): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId } = paymentIntent.metadata;

  if (type === 'security_deposit_direct' && matchId) {
    console.log(`⏳ ACH payment processing for match ${matchId}`);

    const match = await prismadb.match.findUnique({
      where: { id: matchId },
      include: {
        booking: true,
      }
    });

    if (match) {
      // Update match status
      await prismadb.match.update({
        where: { id: matchId },
        data: {
          paymentStatus: 'processing',
        },
      });

      // Update booking status to pending_payment if exists
      if (match.booking) {
        await prismadb.booking.update({
          where: { id: match.booking.id },
          data: {
            status: 'pending_payment',
            paymentStatus: 'processing',
          },
        });
      }

      console.log(`✓ ACH payment marked as processing for match ${matchId}`);
    }
  }
}

export async function handlePaymentIntentSucceeded(event: any): Promise<void> {
  const paymentIntent = event.data.object;
  const { userId, type, matchId, hostUserId } = paymentIntent.metadata;

  if (type === 'matchbookVerification') {
    // Extract the session ID
    const sessionId = paymentIntent.metadata.sessionId;

    // Create a purchase record with isRedeemed=false and store the session ID
    await prismadb.purchase.create({
      data: {
        type: 'matchbookVerification',
        amount: paymentIntent.amount,
        userId: userId || null,
        email: paymentIntent.receipt_email || null,
        status: 'completed',
        isRedeemed: false,
        metadata: JSON.stringify({
          sessionId,
          paymentIntentId: paymentIntent.id
        }),
      },
    });

    console.log(`User ${userId} verification payment succeeded - purchase created with session ID: ${sessionId}`);
  } else if ((type === 'security_deposit_direct' || type === 'lease_deposit_and_rent') && matchId) {
    // Handle deposit payment settlement (ACH or card)
    console.log(`✅ Payment succeeded for match ${matchId}`);

    // Get the match with all relations
    const match = await prismadb.match.findUnique({
      where: { id: matchId },
      include: {
        listing: { include: { user: true } },
        trip: { include: { user: true } },
        booking: true,
      }
    });

    if (match) {
      // Update match with payment settlement
      await prismadb.match.update({
        where: { id: matchId },
        data: {
          paymentStatus: 'captured',
          paymentCapturedAt: new Date(),  // NOW we can set this for ACH
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      // Check if booking already exists
      let booking = match.booking;

      if (!booking) {
        console.log(`Creating booking for match ${matchId} via webhook (backup)`);
        // Create booking if it doesn't exist (backup for when payment action didn't create it)
        booking = await prismadb.booking.create({
          data: {
            userId: match.trip.userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId: matchId,
            startDate: match.trip.startDate,
            endDate: match.trip.endDate,
            totalPrice: paymentIntent.amount,
            monthlyRent: match.monthlyRent,
            status: 'confirmed',
            paymentStatus: 'settled',
            paymentSettledAt: new Date(),
          }
        });

        // Create listing unavailability if not already created
        const existingUnavailability = await prismadb.listingUnavailability.findFirst({
          where: {
            listingId: booking.listingId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            reason: 'Booking'
          }
        });

        if (!existingUnavailability) {
          await prismadb.listingUnavailability.create({
            data: {
              startDate: booking.startDate,
              endDate: booking.endDate,
              reason: 'Booking',
              listingId: booking.listingId
            }
          });
        }

        console.log(`Created booking ${booking.id} for match ${matchId}`);
      } else {
        // Update existing booking to confirmed status (for ACH payments)
        console.log(`Updating existing booking ${booking.id} to confirmed status`);
        await prismadb.booking.update({
          where: { id: booking.id },
          data: {
            status: 'confirmed',
            paymentStatus: 'settled',
            paymentSettledAt: new Date(),
          },
        });
      }

      // Send success email notification
      try {
        await sendPaymentSuccessEmail({
          renterEmail: match.trip.user.email || '',
          renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim(),
          bookingId: booking.id,
          listingAddress: match.listing.locationString || 'your property',
          amount: (paymentIntent.amount || 0) / 100, // Convert from cents
        });
        console.log(`✉️ Success email sent to ${match.trip.user.email}`);
      } catch (emailError) {
        console.error('Failed to send success email:', emailError);
        // Don't fail the webhook if email fails
      }

      console.log(`Match ${matchId} payment settled successfully`);
    }
  }
}

export async function handlePaymentIntentFailed(event: any): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId } = paymentIntent.metadata;

  if ((type === 'security_deposit_direct' || type === 'lease_deposit_and_rent') && matchId) {
    // Handle payment failure (ACH rejection, card decline, etc)
    console.log(`❌ Payment failed for match ${matchId}`);

    // Extract failure details
    const failureCode = paymentIntent.last_payment_error?.code || 'unknown';
    const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    console.log(`Failure reason: ${failureCode} - ${failureMessage}`);

    // Get the match with relations
    const match = await prismadb.match.findUnique({
      where: { id: matchId },
      include: {
        listing: { include: { user: true } },
        trip: { include: { user: true } },
        booking: true,
      }
    });

    if (match) {
      // Update match with failure details
      await prismadb.match.update({
        where: { id: matchId },
        data: {
          paymentStatus: 'failed',
          paymentFailureCode: failureCode,
          paymentFailureMessage: failureMessage,
        },
      });

      // Update booking to payment_failed status
      if (match.booking) {
        await prismadb.booking.update({
          where: { id: match.booking.id },
          data: {
            status: 'payment_failed',
            paymentStatus: 'failed',
            paymentFailureCode: failureCode,
            paymentFailureMessage: failureMessage,
          },
        });

        console.log(`Booking ${match.booking.id} marked as payment_failed`);
      }

      // Send failure notifications to both renter and host
      try {
        const humanReadableReason = getHumanReadableFailureReason(failureCode);

        await sendPaymentFailureEmails({
          renterEmail: match.trip.user.email || '',
          renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim(),
          hostEmail: match.listing.user.email || '',
          hostName: `${match.listing.user.firstName || ''} ${match.listing.user.lastName || ''}`.trim(),
          matchId,
          bookingId: match.booking.id,
          failureReason: humanReadableReason,
          amount: (paymentIntent.amount || 0) / 100, // Convert from cents
        });

        console.log(`✉️ Failure emails sent to renter and host`);
      } catch (emailError) {
        console.error('Failed to send failure emails:', emailError);
        // Don't fail the webhook if email fails
      }

      console.log(`Match ${matchId} payment marked as failed`);
    }
  }
}
