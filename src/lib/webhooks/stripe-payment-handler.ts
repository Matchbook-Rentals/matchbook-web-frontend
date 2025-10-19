/**
 * Stripe Payment Webhook Event Handlers
 *
 * Handles payment lifecycle events: processing, succeeded, failed
 * For documentation, see /docs/webhooks/stripe.md
 */
import prismadb from '@/lib/prismadb';
import { getHumanReadableFailureReason } from '@/lib/utils/payment-error-codes';
import {
  sendPaymentSuccessNotification,
  sendPaymentFailureNotificationToRenter,
  sendPaymentFailureNotificationToHost
} from '@/lib/notifications/payment-notifications';
import { sendDisputeAlert, sendRefundAlert, sendPaymentFailureAlert, sendBookingCreatedAlert, sendPaymentSuccessAlert } from '@/lib/sms-alerts';
import {
  sendRentPaymentFailureNotification,
  sendRentPaymentFailureNotificationToHost,
  sendRentPaymentSuccessNotification,
  sendRentPaymentProcessingNotification
} from '@/lib/notifications/rent-payment-notifications';
import {
  PaymentIntentProcessingEvent,
  PaymentIntentSucceededEvent,
  PaymentIntentFailedEvent,
  PaymentIntentCreatedEvent,
  PaymentIntentCanceledEvent,
  PaymentIntentAmountCapturableUpdatedEvent,
  PaymentIntentRequiresActionEvent,
  ChargeRefundedEvent,
  ChargeDisputeCreatedEvent,
  ChargeDisputeUpdatedEvent,
  ChargeDisputeClosedEvent
} from './stripe-event-types';

export async function handlePaymentIntentProcessing(event: PaymentIntentProcessingEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId, rentPaymentId } = paymentIntent.metadata;

  // Handle recurring rent payment processing (ACH)
  if (type === 'monthly_rent' && rentPaymentId) {
    console.log(`⏳ Rent payment processing for rent payment ${rentPaymentId}`);

    await prismadb.rentPayment.update({
      where: { id: rentPaymentId },
      data: {
        status: 'PROCESSING',
      },
    });

    // Send processing notification (for ACH payments)
    try {
      await sendRentPaymentProcessingNotification(rentPaymentId);
      console.log(`✉️ Rent payment processing notification sent for ${rentPaymentId}`);
    } catch (notificationError) {
      console.error('Failed to send rent payment processing notification:', notificationError);
    }

    console.log(`✓ Rent payment ${rentPaymentId} marked as PROCESSING`);
  }

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

export async function handlePaymentIntentSucceeded(event: PaymentIntentSucceededEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { userId, type, matchId, hostUserId, rentPaymentId } = paymentIntent.metadata;

  // Handle recurring rent payment success
  if (type === 'monthly_rent' && rentPaymentId) {
    console.log(`✅ Rent payment succeeded for rent payment ${rentPaymentId}`);

    await prismadb.rentPayment.update({
      where: { id: rentPaymentId },
      data: {
        status: 'SUCCEEDED',
        isPaid: true, // Keep for backward compatibility
        paymentCapturedAt: new Date(),
      },
    });

    // Send success notification
    try {
      await sendRentPaymentSuccessNotification(rentPaymentId);
      console.log(`✉️ Rent payment success notification sent for ${rentPaymentId}`);
    } catch (notificationError) {
      console.error('Failed to send rent payment success notification:', notificationError);
    }

    console.log(`✓ Rent payment ${rentPaymentId} marked as SUCCEEDED`);
  }

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

        // Send SMS alert for new booking
        await sendBookingCreatedAlert({
          bookingId: booking.id,
          matchId: matchId,
          listingAddress: match.listing.locationString || 'Unknown location',
          renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim() || 'Unknown renter',
          totalAmount: paymentIntent.amount,
          startDate: booking.startDate,
          endDate: booking.endDate,
        });
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

      // Send SMS alert for payment success
      await sendPaymentSuccessAlert({
        matchId,
        bookingId: booking.id,
        amount: paymentIntent.amount,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
        renterName: `${match.trip.user.firstName || ''} ${match.trip.user.lastName || ''}`.trim() || 'Unknown renter',
      });

      console.log(`Match ${matchId} payment settled successfully`);
    }
  }
}

export async function handlePaymentIntentFailed(event: PaymentIntentFailedEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId, rentPaymentId } = paymentIntent.metadata;

  // Handle recurring rent payment failures
  if (type === 'monthly_rent' && rentPaymentId) {
    console.log(`❌ Rent payment failed for rent payment ${rentPaymentId}`);

    // Extract failure details
    const failureCode = paymentIntent.last_payment_error?.code || 'unknown';
    const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    console.log(`Failure reason: ${failureCode} - ${failureMessage}`);

    // Get the rent payment with relations
    const rentPayment = await prismadb.rentPayment.findUnique({
      where: { id: rentPaymentId },
      include: {
        booking: {
          include: {
            listing: true,
            user: true, // renter
          }
        }
      }
    });

    if (rentPayment && rentPayment.booking) {
      // Determine failure type based on payment method
      const paymentMethod = paymentIntent.payment_method_types?.[0];
      const failureType = paymentMethod === 'us_bank_account' ? 'ach_return' :
                          paymentMethod === 'card' ? 'card_decline' : 'processing_error';

      // Create failure record for audit trail
      await prismadb.rentPaymentFailure.create({
        data: {
          rentPaymentId: rentPaymentId,
          failureCode: failureCode,
          failureMessage: failureMessage,
          failureType: failureType,
          stripePaymentIntentId: paymentIntent.id,
          stripeErrorType: paymentIntent.last_payment_error?.type,
          attemptNumber: rentPayment.retryCount + 1,
        },
      });

      console.log(`✓ Created failure record for rent payment ${rentPaymentId} (attempt #${rentPayment.retryCount + 1})`);

      // Build failure reason entry for backward compatibility
      const newFailureEntry = `[${failureCode}] ${failureMessage}`;
      const updatedFailureReason = rentPayment.failureReason
        ? `${rentPayment.failureReason} | ${newFailureEntry}`
        : newFailureEntry;

      // Update rent payment with failure status
      await prismadb.rentPayment.update({
        where: { id: rentPaymentId },
        data: {
          status: 'FAILED',
          isPaid: false, // Keep for backward compatibility
          failureReason: updatedFailureReason, // Keep for backward compatibility
          retryCount: { increment: 1 },
        },
      });

      console.log(`Rent payment ${rentPaymentId} marked as FAILED (retry count: ${rentPayment.retryCount + 1})`);

      // Send failure notifications to renter and host
      try {
        const listing = rentPayment.booking.listing;
        const renter = rentPayment.booking.user;

        // Get host from listing
        const host = await prismadb.user.findUnique({
          where: { id: listing.userId },
          select: { id: true, email: true, firstName: true, lastName: true }
        });

        if (!host) {
          console.error(`Host not found for listing ${listing.id}`);
        }

        // Send notification to renter
        await sendRentPaymentFailureNotification({
          paymentTransactionId: rentPayment.transactionId || '',
          bookingId: rentPayment.bookingId,
          renterId: renter.id,
          hostId: host?.id || '',
          amount: rentPayment.totalAmount || rentPayment.amount,
          listingTitle: listing.title || listing.locationString || 'your property',
          failureCode,
          failureMessage,
          retryCount: rentPayment.retryCount + 1,
        });

        // Send notification to host (if host exists)
        if (host) {
          await sendRentPaymentFailureNotificationToHost({
            paymentTransactionId: rentPayment.transactionId || '',
            bookingId: rentPayment.bookingId,
            renterId: renter.id,
            hostId: host.id,
            amount: rentPayment.totalAmount || rentPayment.amount,
            listingTitle: listing.title || listing.locationString || 'your property',
            failureCode,
            failureMessage,
            retryCount: rentPayment.retryCount + 1,
          });
        }

        console.log(`✉️ Rent payment failure notifications sent to renter and host`);
      } catch (notificationError) {
        console.error('Failed to send rent payment failure notifications:', notificationError);
        // Don't fail the webhook if notification fails
      }

      console.log(`Rent payment ${rentPaymentId} failure handling completed`);
    }
  }

  // Handle initial booking payment failures
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

      // Send SMS alert to subscribed admins
      await sendPaymentFailureAlert({
        matchId,
        amount: paymentIntent.amount,
        failureCode: failureCode,
        paymentMethod: paymentIntent.payment_method_types?.[0],
      });

      console.log(`Match ${matchId} payment marked as failed`);
    }
  }
}

/**
 * Handle payment_intent.created events
 * Useful for audit trail and tracking all payment attempts
 */
export async function handlePaymentIntentCreated(event: PaymentIntentCreatedEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId } = paymentIntent.metadata;

  console.log(`💰 Payment intent created: ${paymentIntent.id}`);
  console.log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
  console.log(`   Type: ${type || 'unknown'}`);
  console.log(`   Match ID: ${matchId || 'none'}`);

  // TODO: Log to audit trail database table
  // This helps track all payment attempts, including abandoned ones
}

/**
 * Handle payment_intent.canceled events
 * Occurs when a payment is explicitly canceled
 */
export async function handlePaymentIntentCanceled(event: PaymentIntentCanceledEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { type, matchId } = paymentIntent.metadata;

  console.log(`❌ Payment intent canceled: ${paymentIntent.id}`);
  console.log(`   Cancellation reason: ${paymentIntent.cancellation_reason || 'not provided'}`);
  console.log(`   Match ID: ${matchId || 'none'}`);

  if ((type === 'security_deposit_direct' || type === 'lease_deposit_and_rent') && matchId) {
    // Update match and booking status
    const match = await prismadb.match.findUnique({
      where: { id: matchId },
      include: { booking: true }
    });

    if (match) {
      await prismadb.match.update({
        where: { id: matchId },
        data: {
          paymentStatus: 'failed',
          paymentFailureMessage: `Payment canceled: ${paymentIntent.cancellation_reason || 'user_canceled'}`
        }
      });

      if (match.booking) {
        await prismadb.booking.update({
          where: { id: match.booking.id },
          data: {
            status: 'cancelled',
            paymentStatus: 'failed'
          }
        });
      }

      console.log(`✓ Match ${matchId} marked as canceled`);
    }
  }

  // TODO: Notify user about cancellation if needed
}

/**
 * Handle payment_intent.amount_capturable_updated events
 * Occurs when funds become available to capture (for manual capture flow)
 */
export async function handlePaymentIntentAmountCapturableUpdated(event: PaymentIntentAmountCapturableUpdatedEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { matchId } = paymentIntent.metadata;

  console.log(`💵 Amount capturable updated for payment intent: ${paymentIntent.id}`);
  console.log(`   Amount capturable: $${(paymentIntent.amount_capturable || 0) / 100}`);
  console.log(`   Match ID: ${matchId || 'none'}`);

  // Note: We use automatic capture, so this should rarely fire
  // If we implement manual capture in the future, handle it here
}

/**
 * Handle payment_intent.requires_action events
 * Occurs when additional authentication is required (e.g., 3D Secure)
 */
export async function handlePaymentIntentRequiresAction(event: PaymentIntentRequiresActionEvent): Promise<void> {
  const paymentIntent = event.data.object;
  const { matchId } = paymentIntent.metadata;

  console.log(`🔐 Payment requires action: ${paymentIntent.id}`);
  console.log(`   Next action: ${paymentIntent.next_action ? JSON.stringify(paymentIntent.next_action) : 'none'}`);
  console.log(`   Match ID: ${matchId || 'none'}`);

  // Client-side Stripe Elements handles 3DS automatically
  // This is logged for monitoring purposes
  // TODO: If action not completed within X minutes, send reminder email
}

/**
 * Handle charge.refunded events
 * Occurs when a charge is refunded (full or partial)
 */
export async function handleChargeRefunded(event: ChargeRefundedEvent): Promise<void> {
  const charge = event.data.object;
  const paymentIntentId = charge.payment_intent;

  console.log(`💸 Charge refunded: ${charge.id}`);
  console.log(`   Payment intent: ${paymentIntentId}`);
  console.log(`   Amount refunded: $${(charge.amount_refunded / 100).toFixed(2)}`);
  console.log(`   Fully refunded: ${charge.refunded}`);

  if (paymentIntentId) {
    // Find match by payment intent ID
    const match = await prismadb.match.findFirst({
      where: { stripePaymentIntentId: paymentIntentId as string },
      include: {
        booking: true,
        trip: { include: { user: true } }
      }
    });

    if (match && match.booking) {
      const refundType = charge.refunded ? 'full' : 'partial';

      // Create refund record
      try {
        await prismadb.refund.create({
          data: {
            stripeRefundId: charge.id, // Using charge ID as unique identifier
            stripeChargeId: charge.id,
            stripePaymentIntentId: paymentIntentId as string,
            amount: charge.amount_refunded,
            currency: charge.currency,
            reason: charge.refunded ? 'requested_by_customer' : undefined,
            status: 'succeeded',
            refundType: refundType,
            processedAt: new Date(),
            matchId: match.id,
            bookingId: match.booking.id,
            userId: match.trip.userId,
            initiatedBy: 'stripe', // Refund initiated via Stripe Dashboard or API
          }
        });

        console.log(`✓ Refund record created for booking ${match.booking.id}`);
      } catch (refundError) {
        console.error('Failed to create refund record:', refundError);
        // Continue with booking update even if refund record fails
      }

      // Update booking status
      await prismadb.booking.update({
        where: { id: match.booking.id },
        data: {
          status: 'cancelled',
        }
      });

      // Update payment transaction status if exists
      const paymentTransaction = await prismadb.paymentTransaction.findFirst({
        where: { stripePaymentIntentId: paymentIntentId as string }
      });

      if (paymentTransaction) {
        await prismadb.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: 'refunded',
            refundedAt: new Date()
          }
        });
        console.log(`✓ Payment transaction marked as refunded`);
      }

      console.log(`✓ Booking ${match.booking.id} marked as cancelled due to refund`);

      // Send SMS alert to subscribed admins
      await sendRefundAlert({
        refundId: charge.id,
        amount: charge.amount_refunded,
        bookingId: match.booking.id,
        refundType: refundType,
      });

      // TODO: Send refund confirmation email to renter
      // TODO: Notify host about refund
      // TODO: Make listing dates available again (remove ListingUnavailability)
    }
  }
}

/**
 * Handle charge.dispute.created events
 * Occurs when a customer disputes a charge (chargeback)
 */
export async function handleChargeDisputeCreated(event: ChargeDisputeCreatedEvent): Promise<void> {
  const dispute = event.data.object;
  const chargeId = dispute.charge;
  const paymentIntentId = dispute.payment_intent;

  console.log(`⚠️ DISPUTE CREATED: ${dispute.id}`);
  console.log(`   Charge: ${chargeId}`);
  console.log(`   Amount: $${(dispute.amount / 100).toFixed(2)}`);
  console.log(`   Reason: ${dispute.reason}`);
  console.log(`   Status: ${dispute.status}`);

  // Find match and booking by payment intent ID
  let match = null;
  if (paymentIntentId) {
    match = await prismadb.match.findFirst({
      where: { stripePaymentIntentId: paymentIntentId as string },
      include: {
        booking: true,
        trip: { include: { user: true } },
        listing: { include: { user: true } }
      }
    });
  }

  // Create dispute record in database
  try {
    const disputeRecord = await prismadb.stripeDispute.create({
      data: {
        stripeDisputeId: dispute.id,
        stripeChargeId: chargeId,
        stripePaymentIntentId: paymentIntentId as string || null,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidenceDetails: JSON.stringify(dispute.evidence_details),
        dueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
        matchId: match?.id || null,
        bookingId: match?.booking?.id || null,
        userId: match?.trip?.userId || 'unknown',
        adminNotifiedAt: new Date(), // Mark as notified since we'll send email
      }
    });

    console.log(`✓ Dispute record created: ${disputeRecord.id}`);

    // Update booking status if exists
    if (match?.booking) {
      await prismadb.booking.update({
        where: { id: match.booking.id },
        data: {
          status: 'disputed', // Mark booking as disputed
        }
      });
      console.log(`✓ Booking ${match.booking.id} marked as disputed`);
    }

    // Send SMS alert to subscribed admins
    await sendDisputeAlert({
      disputeId: dispute.id,
      amount: dispute.amount,
      bookingId: match?.booking?.id || null,
      dueBy: dispute.evidence_details?.due_by || null,
    });

    // TODO: Send urgent notification email to admin
    // TODO: Email host about dispute
    // TODO: Pause host payouts if needed

    console.error(`🚨 URGENT: Charge dispute created - manual review required!`);
    console.error(`   Dispute ID: ${dispute.id}`);
    console.error(`   Due by: ${dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toISOString() : 'Unknown'}`);
    console.error(`   View in Stripe: https://dashboard.stripe.com${event.livemode ? '' : '/test'}/disputes/${dispute.id}`);

  } catch (error) {
    console.error('❌ Failed to create dispute record:', error);
    console.error(`   Dispute ID: ${dispute.id} - Please handle manually!`);
  }
}

/**
 * Handle charge.dispute.updated events
 * Occurs when dispute status changes
 */
export async function handleChargeDisputeUpdated(event: ChargeDisputeUpdatedEvent): Promise<void> {
  const dispute = event.data.object;

  console.log(`🔄 DISPUTE UPDATED: ${dispute.id}`);
  console.log(`   New status: ${dispute.status}`);
  console.log(`   Reason: ${dispute.reason}`);

  // Update dispute record in database
  try {
    const existingDispute = await prismadb.stripeDispute.findUnique({
      where: { stripeDisputeId: dispute.id }
    });

    if (existingDispute) {
      await prismadb.stripeDispute.update({
        where: { stripeDisputeId: dispute.id },
        data: {
          status: dispute.status,
          evidenceDetails: JSON.stringify(dispute.evidence_details),
          evidenceSubmittedAt: dispute.evidence_details?.submission_count && dispute.evidence_details.submission_count > 0
            ? new Date()
            : existingDispute.evidenceSubmittedAt,
        }
      });

      console.log(`✓ Dispute record updated: ${existingDispute.id}`);

      // TODO: Send status update notification to admin
    } else {
      console.warn(`⚠️ Dispute record not found for ${dispute.id} - may have been created before tracking`);
    }
  } catch (error) {
    console.error('❌ Failed to update dispute record:', error);
  }
}

/**
 * Handle charge.dispute.closed events
 * Occurs when dispute is resolved (won or lost)
 */
export async function handleChargeDisputeClosed(event: ChargeDisputeClosedEvent): Promise<void> {
  const dispute = event.data.object;

  console.log(`✅ DISPUTE CLOSED: ${dispute.id}`);
  console.log(`   Final status: ${dispute.status}`);
  console.log(`   Outcome: ${dispute.status === 'won' ? 'WON - Funds retained' : dispute.status === 'lost' ? 'LOST - Funds refunded to customer' : 'OTHER'}`);

  // Update dispute record in database
  try {
    const existingDispute = await prismadb.stripeDispute.findUnique({
      where: { stripeDisputeId: dispute.id },
      include: { booking: true }
    });

    if (existingDispute) {
      await prismadb.stripeDispute.update({
        where: { stripeDisputeId: dispute.id },
        data: {
          status: dispute.status,
          resolvedAt: new Date(),
          evidenceDetails: JSON.stringify(dispute.evidence_details),
        }
      });

      console.log(`✓ Dispute marked as resolved: ${existingDispute.id}`);

      // Update booking status based on outcome
      if (existingDispute.bookingId) {
        let newBookingStatus = existingDispute.booking?.status || 'confirmed';

        if (dispute.status === 'lost' || dispute.status === 'charge_refunded') {
          newBookingStatus = 'cancelled'; // Lost dispute = refunded
        } else if (dispute.status === 'won') {
          newBookingStatus = 'confirmed'; // Won dispute = booking stands
        }

        await prismadb.booking.update({
          where: { id: existingDispute.bookingId },
          data: { status: newBookingStatus }
        });

        console.log(`✓ Booking ${existingDispute.bookingId} status updated to: ${newBookingStatus}`);
      }

      // TODO: Send resolution notification to admin
      // TODO: Notify host about outcome
      // TODO: If won, release any paused payouts
      // TODO: If lost, ensure refund is tracked

    } else {
      console.warn(`⚠️ Dispute record not found for ${dispute.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to update dispute closure:', error);
  }
}
