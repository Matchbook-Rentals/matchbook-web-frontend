import { NextResponse, NextRequest } from 'next/server';
import stripe from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}