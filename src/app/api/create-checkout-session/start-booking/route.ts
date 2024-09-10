import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Define the interface for the expected request body
export interface CheckoutSessionRequest extends Request {
  depositAmountCents: number;
  rentAmountCents: number;
  listingTitle: string;
  locationString: string;
  listingOwnerId: string;
}

export async function POST(req: CheckoutSessionRequest) {
  try {
    const { depositAmountCents, rentAmountCents, listingTitle, locationString, listingOwnerId } = await req.json();
    const listingOwner = await prisma.user.findUnique({
      where: {
        id: listingOwnerId,
      },
    });

    if (!listingOwner) {
      return NextResponse.json({ error: 'Listing owner not found' }, { status: 404 });
    }

    const totalAmount = depositAmountCents + rentAmountCents;
    const matchMakerFeeCents = Math.round(totalAmount * 0.01);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['us_bank_account', 'card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Deposit for "${listingTitle}" in ${locationString}`,
            },
            unit_amount: depositAmountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `First Month's Rent for "${listingTitle}" in ${locationString}`,
            },
            unit_amount: rentAmountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Match Maker Fee',
            },
            unit_amount: matchMakerFeeCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: matchMakerFeeCents,
        transfer_data: {
          destination: listingOwner?.stripeAccountId,
        },
      },
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: `${process.env.NEXT_PUBLIC_URL}/platform/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    console.log('session', session);
    if (!session.id) {
      return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
    }

    console.log('session', session, new Date());
    return NextResponse.json({ sessionId: session.id, clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
  }
}