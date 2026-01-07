import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { createPaymentReceipt } from '@/lib/receipt-utils';
import { createNotification } from '@/app/actions/notifications';
import { qualifyReferral } from '@/lib/referral';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the match with payment information
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { user: true }
        },
        trip: {
          include: { user: true }
        },
        BoldSignLease: true
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the landlord (listing owner)
    if (match.listing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not landlord' }, { status: 403 });
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return NextResponse.json({ error: 'Host must setup Stripe Connect account first' }, { status: 400 });
    }

    // Check if payment intent exists and is ready to capture
    if (!match.stripePaymentIntentId) {
      return NextResponse.json({ error: 'No payment method authorized' }, { status: 400 });
    }

    // Verify payment is authorized but not captured yet
    if (!match.paymentAuthorizedAt) {
      return NextResponse.json({ error: 'Payment not authorized yet' }, { status: 400 });
    }

    if (match.paymentCapturedAt) {
      return NextResponse.json({ error: 'Payment already captured' }, { status: 400 });
    }

    // Verify lease is fully signed before capturing payment
    // Check both BoldSignLease completion AND regular lease signatures
    const isBoldSignLeaseComplete = match.BoldSignLease?.tenantSigned && match.BoldSignLease?.landlordSigned;
    const isRegularLeaseComplete = match.landlordSignedAt && match.tenantSignedAt;
    
    if (!isBoldSignLeaseComplete && !isRegularLeaseComplete) {
      return NextResponse.json({ error: 'Lease must be fully signed before capturing payment' }, { status: 400 });
    }

    // Capture the payment (Connect transfer was set up during authorization)
    const paymentIntent = await stripe.paymentIntents.capture(match.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update match to record payment capture
      await prisma.match.update({
        where: { id: params.matchId },
        data: {
          paymentCapturedAt: new Date(),
          paymentStatus: 'captured',
        },
      });

      // Check if booking already exists (it should if payment was automatic)
      let booking = await prisma.booking.findFirst({
        where: { matchId: params.matchId }
      });

      if (!booking) {
        // Create booking if it doesn't exist (fallback for manual capture or legacy flows)
        console.log('Booking not found, creating new booking for match:', params.matchId);
        booking = await prisma.booking.create({
          data: {
            userId: match.trip.userId,
            listingId: match.listingId,
            tripId: match.tripId,
            matchId: params.matchId,
            startDate: match.trip.startDate,
            endDate: match.trip.endDate,
            totalPrice: paymentIntent.amount,
            monthlyRent: match.monthlyRent,
            status: 'confirmed'
          }
        });

        // Create listing unavailability if not already created
        const existingUnavailability = await prisma.listingUnavailability.findFirst({
          where: {
            listingId: booking.listingId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            reason: 'Booking'
          }
        });

        if (!existingUnavailability) {
          await prisma.listingUnavailability.create({
            data: {
              startDate: booking.startDate,
              endDate: booking.endDate,
              reason: 'Booking',
              listingId: booking.listingId
            }
          });
        }

        // Send notification to host about confirmed booking
        await createNotification({
          userId: match.listing.userId,  // Host's user ID
          content: `Your booking for "${match.listing.title}" with "${match.trip.user.firstName} ${match.trip.user.lastName}" is confirmed.`,
          url: `/app/host/${match.listingId}/bookings/${booking.id}`,
          unread: true,
          actionType: 'booking',
          actionId: booking.id
        });

        console.log('Created booking record:', booking.id);
      } else {
        console.log('Booking already exists for match:', params.matchId, 'Booking ID:', booking.id);
        // Update booking status if needed
        if (booking.status !== 'confirmed') {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'confirmed' }
          });
        }
      }

      // Generate receipt for the tenant
      try {
        const rentDueAtBooking = match.listing.rentDueAtBooking || 77;
        const paymentMethodType = 'card'; // Assuming card payment for now

        await createPaymentReceipt({
          userId: match.trip.userId, // Receipt for the tenant
          matchId: params.matchId,
          bookingId: booking.id,
          paymentType: 'reservation',
          rentDueAtBooking,
          paymentMethodType,
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge as string,
          transactionStatus: 'succeeded'
        });

        console.log('Generated payment receipt for match:', params.matchId);
      } catch (receiptError) {
        console.error('Error generating receipt:', receiptError);
        // Don't fail the payment capture if receipt generation fails
      }

      // Check if this is the host's first booking and qualify referral if applicable
      try {
        const hostId = match.listing.userId;

        // Count host's confirmed bookings (including this one)
        const hostBookingsCount = await prisma.booking.count({
          where: {
            listing: { userId: hostId },
            status: 'confirmed'
          }
        });

        // If this is the host's first booking, try to qualify their referral
        if (hostBookingsCount === 1) {
          const wasQualified = await qualifyReferral(hostId, booking.id);
          if (wasQualified) {
            console.log(`🎉 [Referral] Qualified referral for host ${hostId} on their first booking (${booking.id})`);
          }
        }
      } catch (referralError) {
        console.error('Error processing referral qualification:', referralError);
        // Don't fail the payment capture if referral processing fails
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        booking: {
          id: booking.id,
          status: booking.status
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Payment capture failed', status: paymentIntent.status },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
