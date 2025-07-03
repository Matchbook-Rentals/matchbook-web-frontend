import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      select: {
        stripePaymentIntentId: true,
        paymentStatus: true,
        paymentAuthorizedAt: true,
        paymentCapturedAt: true,
        paymentAmount: true,
        listing: {
          select: {
            userId: true,
          }
        },
        trip: {
          select: {
            userId: true,
          }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user is authorized to view this match (host or tenant)
    if (match.listing.userId !== userId && match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!match.stripePaymentIntentId) {
      return NextResponse.json({ 
        error: 'No payment intent found',
        localStatus: match.paymentStatus,
        authorizedAt: match.paymentAuthorizedAt,
        capturedAt: match.paymentCapturedAt,
      }, { status: 404 });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(match.stripePaymentIntentId);
    
    return NextResponse.json({
      localStatus: match.paymentStatus,
      stripeStatus: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      authorizedAt: match.paymentAuthorizedAt,
      capturedAt: match.paymentCapturedAt,
      stripeCreated: new Date(paymentIntent.created * 1000).toISOString(),
      lastPaymentError: paymentIntent.last_payment_error?.message || null,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' }, 
      { status: 500 }
    );
  }
}