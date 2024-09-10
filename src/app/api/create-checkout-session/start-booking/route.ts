import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server'

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
  matchId: string;
}

const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return userId;
}

export async function POST(req: CheckoutSessionRequest) {
  try {
    const userId = await checkAuth();

    // Read the request body as text
    const rawBody = await req.text();

    // Log the raw request body
    console.log('Raw request body:', rawBody);

    // Parse the JSON manually and add error handling
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { depositAmountCents, rentAmountCents, listingTitle, locationString, listingOwnerId, matchId } = requestData;

    // Add validation for required fields
    if (!depositAmountCents || !rentAmountCents || !listingTitle || !locationString || !listingOwnerId || !matchId) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }

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
              name: `Deposit for "${listingTitle}" at ${locationString}`,
            },
            unit_amount: depositAmountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `First Month's Rent for "${listingTitle}" at ${locationString}`,
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
      return_url: `${process.env.NEXT_PUBLIC_URL}/platform/dashboard`,
      metadata: {
        userId: userId,
        type: 'booking',
        matchId: matchId,
      },
    });

    if (!session.id) {
      return NextResponse.json({ error: 'Error creating checkout session' }, { status: 500 });
    }
    return NextResponse.json({ sessionId: session.id, clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Error creating checkout session', details: error.message }, { status: 500 });
  }
}