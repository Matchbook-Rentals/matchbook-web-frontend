import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ Clearing payment info for match:', params.matchId);

    // Get the match with payment information
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

    // Cancel payment intent if it exists and hasn't been captured
    if (match.stripePaymentIntentId) {
      try {
        console.log('❌ Canceling payment intent:', match.stripePaymentIntentId);
        await stripe.paymentIntents.cancel(match.stripePaymentIntentId);
        console.log('✅ Payment intent canceled');
      } catch (stripeError) {
        console.log('⚠️ Could not cancel payment intent (may already be processed):', stripeError);
        // Continue anyway - we still want to clear the database
      }
    }

    // Detach payment method from customer if it exists
    if (match.stripePaymentMethodId) {
      try {
        console.log('🔗 Detaching payment method:', match.stripePaymentMethodId);
        await stripe.paymentMethods.detach(match.stripePaymentMethodId);
        console.log('✅ Payment method detached');
      } catch (stripeError) {
        console.log('⚠️ Could not detach payment method:', stripeError);
        // Continue anyway - we still want to clear the database
      }
    }

    // Clear payment fields from the match
    console.log('💾 Clearing payment fields from database');
    await prisma.match.update({
      where: { id: params.matchId },
      data: {
        stripePaymentMethodId: null,
        stripePaymentIntentId: null,
        paymentAuthorizedAt: null,
        paymentAmount: null,
        paymentCapturedAt: null,
        paymentStatus: null,
      },
    });

    console.log('✅ Payment information cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'Payment information cleared successfully',
    });
  } catch (error) {
    console.error('❌ Error clearing payment information:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear payment information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}