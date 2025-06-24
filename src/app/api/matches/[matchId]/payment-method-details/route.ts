import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the match with payment method info
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        trip: { include: { user: true } }
      }
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is the renter
    if (match.trip.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - not renter' }, { status: 403 });
    }

    // Check if payment method exists
    if (!match.stripePaymentMethodId) {
      return NextResponse.json({ error: 'No payment method found' }, { status: 400 });
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(match.stripePaymentMethodId);

    // Return sanitized payment method information
    return NextResponse.json({
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        } : null,
        created: paymentMethod.created,
      },
      match: {
        paymentAmount: match.paymentAmount,
        paymentAuthorizedAt: match.paymentAuthorizedAt,
        paymentCapturedAt: match.paymentCapturedAt,
        paymentStatus: match.paymentStatus,
      }
    });
  } catch (error) {
    console.error('Error fetching payment method details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment method details' },
      { status: 500 }
    );
  }
}