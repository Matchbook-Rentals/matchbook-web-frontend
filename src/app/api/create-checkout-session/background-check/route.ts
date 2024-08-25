// app/api/create-checkout-session/background-check/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
});

export async function POST(request: Request) {
  try {
    const { userId } = await request.json(); // Extract userId from request body

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Background Screening',
            },
            unit_amount: 1099, // $10.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/platform/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/platform/checkout/failure`,
      metadata: {
        userId: userId,
      },
    });
    console.log('session', session);
    if (!session.id) {
      return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}