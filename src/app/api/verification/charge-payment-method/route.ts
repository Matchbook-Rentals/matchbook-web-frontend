import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    console.log('💳 [Verification Payment] Creating payment intent for saved method:', paymentMethodId);

    // First, retrieve the payment method to get the customer ID
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const customerId = paymentMethod.customer as string;

    if (!customerId) {
      return NextResponse.json({ error: 'Payment method is not attached to a customer' }, { status: 400 });
    }

    console.log('✅ [Verification Payment] Found customer:', customerId);

    // Create a payment intent for $25.00 using the saved payment method
    // Don't confirm yet - let client handle confirmation and polling
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500, // $25.00 in cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      metadata: {
        userId,
        type: 'matchbookVerification',
      },
      // Restrict to only card payment methods (no ACH/bank accounts)
      payment_method_types: ['card'],
    });

    console.log('✅ [Verification Payment] Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    // Return client secret for client-side confirmation
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('❌ [Verification Payment] Error charging payment method:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process payment',
        details: error.raw?.message,
      },
      { status: 500 }
    );
  }
}
