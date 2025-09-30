/**
 * Unified Stripe Webhook Handler
 *
 * Processes ALL Stripe webhook events in one endpoint:
 * - Payment events (payment_intent.*)
 * - Connect account events (account.*, person.*)
 *
 * For documentation, see:
 * - /docs/webhooks/stripe.md - Complete webhook event documentation
 * - /docs/webhooks/master.md - All webhook endpoints
 * - /docs/payment-spec.md - Payment flow specification
 */
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import {
  handlePaymentIntentProcessing,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
} from '@/lib/webhooks/stripe-payment-handler';
import {
  handleAccountUpdated,
  handleAccountDeauthorized,
  handlePersonUpdated,
  handleExternalAccountUpdated
} from '@/lib/webhooks/stripe-connect-handler';

/**
 * Verify Stripe webhook signature
 */
const verifyStripeSignature = (req: Request, body: string, signature: string): boolean => {
  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return false;
    }

    // Verify the signature
    stripe.webhooks.constructEvent(body, signature, endpointSecret);
    return true;
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`);
    return false;
  }
};

export async function POST(req: Request) {
  try {
    // Get the request body as text
    const body = await req.text();

    // Get the signature from the request header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    // Verify the signature
    if (!verifyStripeSignature(req, body, signature)) {
      return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    console.log(`[Stripe Webhook] ${event.type} - ${event.id}`);

    // Route events to appropriate handlers
    switch (event.type) {
      // ===== PAYMENT EVENTS =====
      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      // ===== CONNECT ACCOUNT EVENTS =====
      case 'account.updated':
        await handleAccountUpdated(event);
        break;

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event);
        break;

      case 'person.updated':
        await handlePersonUpdated(event);
        break;

      case 'account.external_account.updated':
        await handleExternalAccountUpdated(event);
        break;

      // ===== UNHANDLED EVENTS =====
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        // Still return 200 so Stripe doesn't retry
        break;
    }

    // Always return success to Stripe
    return NextResponse.json({ received: true, type: event.type });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
