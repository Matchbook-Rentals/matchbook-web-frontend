/**
 * Stripe Payment Webhook Handler
 *
 * ⚠️ DEPRECATED: This endpoint is deprecated. Please use /api/webhooks/stripe instead.
 * This unified endpoint handles both payment and Connect events with a single webhook secret.
 *
 * For webhook event details and flow, see:
 * - /docs/webhooks/stripe.md - Complete webhook event documentation
 * - /docs/webhooks/master.md - All webhook endpoints
 * - /docs/payment-spec.md - Payment flow and specification
 */
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prismadb from '@/lib/prismadb';
import { getHumanReadableFailureReason } from '@/lib/utils/payment-error-codes';
import {
  sendPaymentSuccessNotification,
  sendPaymentFailureNotificationToRenter,
  sendPaymentFailureNotificationToHost
} from '@/lib/notifications/payment-notifications';

// Function to verify Stripe webhook signature
const verifyStripeSignature = (req: Request, body: string, signature: string): boolean => {
  try {
    // Get Stripe webhook secret from environment variables
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.error('Missing Stripe webhook secret');
      return false;
    }

    // Verify the signature
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    return true;
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return false;
  }
};

export async function POST(req: Request) {
  try {
    // Get the request body as text
    const body = await req.text();
    
    // Get the signature from the request header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    // Verify the signature
    if (!verifyStripeSignature(req, body, signature)) {
      return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    // Handle the webhook event
    console.log(`Webhook event received: ${event.type}`);

    // ACH Processing Confirmation - payment initiated but not settled yet
    if (event.type === 'payment_intent.processing') {
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

    // Payment Succeeded - final settlement complete
    else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Extract metadata
      const { userId, type, matchId, hostUserId } = paymentIntent.metadata;

      if (type === 'matchbookVerification') {
        // Check if Purchase already exists (may have been created by payment-status polling)
        const existingPurchases = await prismadb.purchase.findMany({
          where: {
            userId: userId || undefined,
            type: 'matchbookVerification',
          },
        });

        const alreadyExists = existingPurchases.some((p) => {
          if (!p.metadata) return false;
          try {
            const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
            return meta.paymentIntentId === paymentIntent.id;
          } catch {
            return false;
          }
        });

        if (alreadyExists) {
          console.log(`ℹ️ [Webhook] Purchase already exists for paymentIntentId ${paymentIntent.id}, skipping creation`);
        } else {
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
        }
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

          // Send success notification
          try {
            await sendPaymentSuccessNotification({
              renterEmail: match.trip.user.email || '',
              renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim(),
              renterId: match.trip.userId,
              bookingId: booking.id,
              listingAddress: match.listing.locationString || 'your property',
              amount: (paymentIntent.amount || 0) / 100, // Convert from cents
            });
            console.log(`✉️ Success notification sent to ${match.trip.user.email}`);
          } catch (notificationError) {
            console.error('Failed to send success notification:', notificationError);
            // Don't fail the webhook if notification fails
          }

          console.log(`Match ${matchId} payment settled successfully`);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
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

            // Send notification to renter
            await sendPaymentFailureNotificationToRenter({
              renterEmail: match.trip.user.email || '',
              renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim(),
              renterId: match.trip.userId,
              hostEmail: match.listing.user.email || '',
              hostName: `${match.listing.user.firstName || ''} ${match.listing.user.lastName || ''}`.trim(),
              hostId: match.listing.userId,
              matchId,
              bookingId: match.booking.id,
              failureReason: humanReadableReason,
              amount: (paymentIntent.amount || 0) / 100, // Convert from cents
            });

            // Send notification to host
            await sendPaymentFailureNotificationToHost({
              renterEmail: match.trip.user.email || '',
              renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim(),
              renterId: match.trip.userId,
              hostEmail: match.listing.user.email || '',
              hostName: `${match.listing.user.firstName || ''} ${match.listing.user.lastName || ''}`.trim(),
              hostId: match.listing.userId,
              matchId,
              bookingId: match.booking.id,
              failureReason: humanReadableReason,
              amount: (paymentIntent.amount || 0) / 100, // Convert from cents
            });

            console.log(`✉️ Failure notifications sent to renter and host`);
          } catch (notificationError) {
            console.error('Failed to send failure notifications:', notificationError);
            // Don't fail the webhook if notification fails
          }

          console.log(`Match ${matchId} payment marked as failed`);
        }
      }
    }

    // ============================================================================
    // Stripe Identity Verification Webhooks
    // ============================================================================
    // Note: These are separate from Stripe Connect identity verification
    // Stripe Identity is used for fraud prevention/trust & safety verification

    else if (event.type === 'identity.verification_session.created') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        console.log(`🆔 Identity verification session created for user ${userId}`);

        await prismadb.user.update({
          where: { id: userId },
          data: {
            stripeVerificationStatus: session.status,
            stripeVerificationLastCheck: new Date(),
          },
        });
      }
    }

    else if (event.type === 'identity.verification_session.processing') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        console.log(`⏳ Identity verification processing for user ${userId}`);

        await prismadb.user.update({
          where: { id: userId },
          data: {
            stripeVerificationStatus: 'processing',
            stripeVerificationLastCheck: new Date(),
          },
        });
      }
    }

    else if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        console.log(`✅ Identity verified for user ${userId}`);

        await prismadb.user.update({
          where: { id: userId },
          data: {
            stripeVerificationStatus: 'verified',
            stripeVerificationReportId: session.last_verification_report,
            stripeVerificationLastCheck: new Date(),
            stripeIdentityPayload: session as any,
          },
        });

        console.log(`User ${userId} identity verification complete`);
      }
    }

    else if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        console.log(`⚠️ Identity verification requires input for user ${userId}`);

        await prismadb.user.update({
          where: { id: userId },
          data: {
            stripeVerificationStatus: 'requires_input',
            stripeVerificationLastCheck: new Date(),
            stripeIdentityPayload: session as any,
          },
        });

        // Log the specific error for debugging
        if (session.last_error) {
          console.log(`Verification error code: ${session.last_error.code}`);
          console.log(`Verification error reason: ${session.last_error.reason}`);
        }
      }
    }

    else if (event.type === 'identity.verification_session.canceled') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        console.log(`❌ Identity verification canceled for user ${userId}`);

        await prismadb.user.update({
          where: { id: userId },
          data: {
            stripeVerificationStatus: 'canceled',
            stripeVerificationLastCheck: new Date(),
          },
        });
      }
    }

    // Return a success response
    return NextResponse.json({ received: true, type: event.type });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}