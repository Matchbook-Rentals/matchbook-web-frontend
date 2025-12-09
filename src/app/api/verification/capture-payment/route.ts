import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

// Capture a pre-authorized payment after successful verification
export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    console.log('💰 [Verification] Capturing payment:', paymentIntentId);

    // Retrieve the payment intent to verify it belongs to this user
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId) {
      console.error('❌ [Verification] User mismatch - payment belongs to different user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (paymentIntent.status !== 'requires_capture') {
      console.error('❌ [Verification] Payment not in capturable state:', paymentIntent.status);
      return NextResponse.json(
        { error: `Payment cannot be captured. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

    console.log('✅ [Verification] Payment captured:', {
      id: capturedPayment.id,
      status: capturedPayment.status,
      amount: capturedPayment.amount,
    });

    // Create Purchase record now that payment is captured
    await prisma.purchase.create({
      data: {
        type: 'matchbookVerification',
        amount: capturedPayment.amount,
        userId: userId,
        status: 'completed',
        isRedeemed: false,
        metadata: JSON.stringify({
          paymentIntentId: capturedPayment.id,
        }),
      },
    });

    console.log('✅ [Verification] Purchase record created');

    return NextResponse.json({
      success: true,
      status: capturedPayment.status,
    });
  } catch (error: any) {
    console.error('❌ [Verification] Error capturing payment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to capture payment',
        details: error.raw?.message,
      },
      { status: 500 }
    );
  }
}
