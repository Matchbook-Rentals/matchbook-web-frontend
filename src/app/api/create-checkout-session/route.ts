// app/api/create-checkout-session/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    const productName = body.productName || 'Background Screening';
    const unitAmount = body.unitAmount || 1099; // $10.99 in cents
    
    if (body.unitAmount && (typeof body.unitAmount !== 'number' || body.unitAmount <= 0)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/platform/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/platform/checkout/failure`,
      client_reference_id: userId, // Add user ID for tracking
      metadata: {
        userId // Add user ID to metadata for audit trail
      }
    });
    
    if (!session.id) {
      return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Payment processing error' }, { status: 500 });
  }
}
