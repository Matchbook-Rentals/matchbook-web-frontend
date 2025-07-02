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

    const { sessionId, amount } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'payment_intent.payment_method']
    });

    if (!session.payment_intent) {
      return NextResponse.json({ error: 'No payment intent found' }, { status: 400 });
    }

    const paymentIntent = session.payment_intent as any;
    const paymentMethodId = paymentIntent.payment_method?.id;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment was not successful' }, { status: 400 });
    }

    // Get the match to find the host's Stripe Connect account
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { user: true }
        },
        trip: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter
    if (match.trip.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Get payment method details for record keeping
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    console.log('💳 Payment completed via Stripe Checkout:', paymentMethod.type, 'PaymentIntent:', paymentIntent.id);

    // Save payment completion info to the match
    const updateData: any = {
      stripePaymentMethodId: paymentMethodId,
      stripePaymentIntentId: paymentIntent.id,
      paymentAuthorizedAt: new Date(),
      paymentCapturedAt: new Date(), // Payment is completed via Checkout
      paymentAmount: amount,
      paymentStatus: 'captured', // Payment is already completed
    };

    await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
    });

    console.log('💾 Match updated with completed payment from checkout');

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      paymentMethodType: paymentMethod.type,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
      sessionId: sessionId,
    });

  } catch (error) {
    console.error('❌ Error processing payment setup success:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}