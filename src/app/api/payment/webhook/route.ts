// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prismadb'
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

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
      // Here, you can fulfill the order
      // For example, you could save the order to your database
      console.log('FROM WEBHOOK', session)
      await prisma.purchase.create({
        data: {
          type: 'payment',
          amount: session.amount_total,
          userId: session.metadata?.userId || null,
          email: session.customer_details?.email || null,
        },
      });
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}