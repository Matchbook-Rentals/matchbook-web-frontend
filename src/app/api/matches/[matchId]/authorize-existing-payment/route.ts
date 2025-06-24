import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();

    // Get the match with existing payment method info
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        trip: { include: { user: true } },
        listing: { include: { user: true } }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter
    if (match.trip.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Verify the host has a Stripe Connect account
    if (!match.listing.user?.stripeAccountId) {
      return NextResponse.json({ error: 'Host must setup Stripe Connect account first' }, { status: 400 });
    }

    // Check if payment method exists
    if (!match.stripePaymentMethodId) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    // Check if already authorized
    if (match.paymentAuthorizedAt) {
      return NextResponse.json({ error: 'Payment already authorized' }, { status: 400 });
    }

    // Get the user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Create payment intent for authorization with Stripe Connect transfer
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: match.stripePaymentMethodId,
      capture_method: 'manual', // Don't capture the payment yet
      confirm: true,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/platform/match/${params.matchId}/payment-success`,
      transfer_data: {
        destination: match.listing.user.stripeAccountId,
      },
      metadata: {
        matchId: params.matchId,
        userId,
        hostUserId: match.listing.userId,
        type: 'lease_deposit_and_rent_existing',
      },
    });

    // Update match with authorization info
    await prisma.match.update({
      where: { id: params.matchId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        paymentAuthorizedAt: new Date(),
        paymentAmount: amount,
        paymentStatus: 'authorized',
      },
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: amount,
    });
  } catch (error) {
    console.error('Error authorizing existing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to authorize payment method' },
      { status: 500 }
    );
  }
}