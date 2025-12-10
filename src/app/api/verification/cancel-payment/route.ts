import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';
import { logPaymentEvent } from '@/lib/audit-logger';

// Cancel a pre-authorized payment when verification fails
// This releases the hold immediately - no refund needed
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

    console.log('🚫 [Verification] Canceling payment hold:', paymentIntentId);

    // Retrieve the payment intent to verify it belongs to this user
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId) {
      console.error('❌ [Verification] User mismatch - payment belongs to different user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Can only cancel if not yet captured
    if (paymentIntent.status === 'succeeded') {
      console.error('❌ [Verification] Payment already captured, cannot cancel');
      return NextResponse.json(
        { error: 'Payment has already been captured and cannot be canceled' },
        { status: 400 }
      );
    }

    // Cancel the payment intent (releases the hold)
    const canceledPayment = await stripe.paymentIntents.cancel(paymentIntentId);

    console.log('✅ [Verification] Payment hold released:', {
      id: canceledPayment.id,
      status: canceledPayment.status,
    });

    // Mark user as having a failed verification (for tracking purposes)
    const verification = await prisma.verification.upsert({
      where: { userId },
      update: {
        status: 'FAILED',
        verificationRefundedAt: new Date(), // Track that they got their money back
        paymentCancelledAt: new Date(), // Audit: when hold was released
      },
      create: {
        userId,
        status: 'FAILED',
        verificationRefundedAt: new Date(),
        paymentCancelledAt: new Date(),
      },
    });

    // Log to audit history
    if (verification) {
      await logPaymentEvent(
        verification.id,
        'payment_cancelled',
        canceledPayment.id,
        paymentIntent.amount,
        true
      );
    }

    console.log('✅ [Verification] Verification record updated');

    return NextResponse.json({
      success: true,
      status: canceledPayment.status,
      message: 'Payment hold has been released. No charge was made.',
    });
  } catch (error: any) {
    console.error('❌ [Verification] Error canceling payment:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to cancel payment',
        details: error.raw?.message,
      },
      { status: 500 }
    );
  }
}
