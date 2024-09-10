// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prismadb'
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// New function to handle different purchase types
const handleSuccessfulPurchase = async (session: any) => {
  switch (session.metadata?.type) {
    case 'backgroundCheck':
      await prisma.purchase.create({
        data: {
          type: 'backgroundCheck',
          amount: session.amount_total,
          userId: session.metadata?.userId || null,
          email: session.customer_details?.email || null,
        },
      });
      break;
    case 'booking':
      console.log('Booking session:', session);
      // TODO: Set Trip to 'booked'
      // TODO: block off listing dates
      // TODO: Create payment schedule
      // TODO: Send email to user and host
      // TODO: Send notification to user and host
      await handleBookingPurchase(session);
      break;
    default:
      console.log(`Unhandled purchase type: ${session.metadata?.type}`);
  }
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get('Stripe-Signature');

  let event;

  try {
    // Ensure sig is not null before passing it to constructEvent
    if (!sig) {
      throw new Error('No Stripe signature found in headers');
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    console.log(process.env.STRIPE_WEBHOOK_SECRET)
    console.log(sig)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('FROM WEBHOOK', session);
      await handleSuccessfulPurchase(session);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}



async function handleBookingPurchase(session: any) {
  console.log('FROM WEBHOOK', session);
  await prisma.booking.create({
    data: {
      userId: session.metadata?.userId || null,
      listingId: session.metadata?.listingId || null,
      startDate: session.metadata?.startDate || null,
      endDate: session.metadata?.endDate || null,
      totalPrice: session.amount_total,
      matchId: session.metadata?.matchId || null,
    },
  });
}