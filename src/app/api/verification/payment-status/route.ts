import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prismadb';

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get payment intent ID from query params
    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    console.log('🔍 [Payment Status] Checking status for:', paymentIntentId);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('📊 [Payment Status] Current status:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    let purchaseCreated = false;

    // Create Purchase record when payment is authorized or succeeds
    // - requires_capture: pre-auth hold placed (manual capture flow)
    // - succeeded: payment fully captured
    // - processing: async payment (e.g., ACH) in progress
    if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
      // Check if Purchase already exists for this paymentIntentId
      const existingPurchases = await prisma.purchase.findMany({
        where: {
          userId: userId,
          type: 'matchbookVerification',
        },
      });

      // Check if any existing purchase has this paymentIntentId in metadata
      const alreadyExists = existingPurchases.some((p) => {
        if (!p.metadata) return false;
        try {
          const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
          return meta.paymentIntentId === paymentIntentId;
        } catch {
          return false;
        }
      });

      if (!alreadyExists) {
        console.log('✅ [Payment Status] Creating Purchase record for paymentIntentId:', paymentIntentId);
        await prisma.purchase.create({
          data: {
            type: 'matchbookVerification',
            amount: paymentIntent.amount,
            userId: userId,
            email: paymentIntent.receipt_email || null,
            status: 'completed',
            isRedeemed: false,
            metadata: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          },
        });
        purchaseCreated = true;
        console.log('✅ [Payment Status] Purchase record created successfully');
      } else {
        console.log('ℹ️ [Payment Status] Purchase already exists for paymentIntentId:', paymentIntentId);
      }
    }

    // Return status and relevant information
    return NextResponse.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      error: paymentIntent.last_payment_error?.message || null,
      purchaseCreated,
    });
  } catch (error: any) {
    console.error('❌ [Payment Status] Error checking payment status:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check payment status',
        details: error.raw?.message,
      },
      { status: 500 }
    );
  }
}
