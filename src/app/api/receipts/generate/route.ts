import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPaymentReceipt } from '@/lib/receipt-utils';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      matchId,
      bookingId,
      paymentType = 'reservation',
      paymentMethodType,
      stripePaymentIntentId,
      stripeChargeId,
      transactionStatus = 'succeeded'
    } = body;

    // Validate that user owns the match or booking
    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          trip: { select: { userId: true } },
          listing: { select: { userId: true } }
        }
      });

      if (!match) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      // User must be either the tenant (trip owner) or landlord (listing owner)
      if (match.trip.userId !== userId && match.listing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get reservation deposit from listing
      const listing = await prisma.listing.findUnique({
        where: { id: match.listingId },
        select: { reservationDeposit: true }
      });

      const reservationDeposit = listing?.reservationDeposit || 77;

      // Create receipt
      const result = await createPaymentReceipt({
        userId,
        matchId,
        paymentType,
        reservationDeposit,
        paymentMethodType,
        stripePaymentIntentId,
        stripeChargeId,
        transactionStatus
      });

      return NextResponse.json({
        success: true,
        receiptId: result.receipt.id,
        receiptNumber: result.receipt.receiptNumber,
        transactionId: result.transaction.id,
        transactionNumber: result.transaction.transactionNumber
      });
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true, listing: { select: { userId: true, reservationDeposit: true } } }
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // User must be either the tenant or landlord
      if (booking.userId !== userId && booking.listing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const reservationDeposit = booking.listing.reservationDeposit || 77;

      // Create receipt
      const result = await createPaymentReceipt({
        userId,
        bookingId,
        paymentType,
        reservationDeposit,
        paymentMethodType,
        stripePaymentIntentId,
        stripeChargeId,
        transactionStatus
      });

      return NextResponse.json({
        success: true,
        receiptId: result.receipt.id,
        receiptNumber: result.receipt.receiptNumber,
        transactionId: result.transaction.id,
        transactionNumber: result.transaction.transactionNumber
      });
    }

    return NextResponse.json({ error: 'Match ID or Booking ID required' }, { status: 400 });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}