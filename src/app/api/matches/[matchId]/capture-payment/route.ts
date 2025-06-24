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

    // Get the match with payment information
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        listing: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the landlord (listing owner)
    if (match.listing.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not landlord' }, { status: 403 });
    }

    // Check if payment intent exists and is ready to capture
    if (!match.stripePaymentIntentId) {
      return NextResponse.json({ error: 'No payment method authorized' }, { status: 400 });
    }

    // Capture the payment
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

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
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