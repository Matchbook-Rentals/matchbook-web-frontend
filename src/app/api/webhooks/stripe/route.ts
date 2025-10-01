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
  handlePaymentIntentFailed,
  handlePaymentIntentCreated,
  handlePaymentIntentCanceled,
  handlePaymentIntentAmountCapturableUpdated,
  handlePaymentIntentRequiresAction,
  handleChargeRefunded,
  handleChargeDisputeCreated,
  handleChargeDisputeUpdated,
  handleChargeDisputeClosed
} from '@/lib/webhooks/stripe-payment-handler';
import {
  handleAccountUpdated,
  handleAccountDeauthorized,
  handlePersonUpdated,
  handleExternalAccountUpdated,
  handleCapabilityUpdated,
  handleExternalAccountCreated,
  handleExternalAccountDeleted
} from '@/lib/webhooks/stripe-connect-handler';
import {
  handleTransferCreated,
  handleTransferUpdated,
  handleTransferPaid,
  handleTransferFailed
} from '@/lib/webhooks/stripe-transfer-handler';

/**
 * Fallback handler for unhandled webhook events
 * Logs events that we don't currently process for analysis and potential future handling
 */
async function handleUnhandledEvent(event: any): Promise<void> {
  console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
  console.log(`   Event ID: ${event.id}`);
  console.log(`   Livemode: ${event.livemode}`);

  // Log the full event object for debugging (truncated if too long)
  const eventJson = JSON.stringify(event, null, 2);
  if (eventJson.length > 500) {
    console.log(`   Data preview: ${eventJson.substring(0, 500)}...`);
  } else {
    console.log(`   Data: ${eventJson}`);
  }

  // TODO: Store unhandled events in database for analysis
  // This helps identify events we might need to handle in the future
  // Schema suggestion:
  // - UnhandledWebhookEvent model with:
  //   - eventId, eventType, receivedAt, eventData (JSON), processed (boolean)

  // Common events that might appear here but are safe to ignore:
  const safeToIgnore = [
    'charge.succeeded', // Redundant with payment_intent.succeeded
    'payment_method.attached',
    'customer.created',
    'customer.updated',
    'invoice.created', // Only if using Stripe Billing
    'invoice.paid',
    'payout.created', // Between Stripe and host, not critical for us
    'payout.paid',
    'balance.available', // Platform balance, not critical for MVP
  ];

  if (safeToIgnore.includes(event.type)) {
    console.log(`   ℹ️ This event type is known and safe to ignore`);
    return;
  }

  // Events that might be important but we haven't implemented yet:
  const potentiallyImportant = [
    'payment_intent.partially_funded',
    'account.application.authorized',
    'charge.failed',
    'charge.expired',
  ];

  if (potentiallyImportant.includes(event.type)) {
    console.warn(`   ⚠️ This event type might be important to handle in the future`);
    // TODO: Send notification to admin for review
  }
}

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
  const startTime = Date.now();

  console.log('🔔 [Stripe Webhook] Received webhook request');

  try {
    // Get the request body as text
    const body = await req.text();

    // Get the signature from the request header
    const signature = req.headers.get('stripe-signature');

    console.log('📋 [Stripe Webhook] Request headers:', {
      signature: signature ? `${signature.substring(0, 30)}...` : 'MISSING',
      contentLength: body.length
    });

    if (!signature) {
      console.error('❌ [Stripe Webhook] Missing Stripe signature');
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    // Verify the signature
    console.log('🔐 [Stripe Webhook] Verifying signature...');
    if (!verifyStripeSignature(req, body, signature)) {
      console.error('❌ [Stripe Webhook] Invalid Stripe signature');
      return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
    }

    console.log('✅ [Stripe Webhook] Signature verified');

    // Parse the webhook event
    const event = JSON.parse(body);

    console.log(`🏷️ [Stripe Webhook] Event: ${event.type} - ${event.id}`);
    console.log('📦 [Stripe Webhook] Event payload preview:', JSON.stringify(event, null, 2).substring(0, 500));

    // Route events to appropriate handlers
    switch (event.type) {
      // ===== PAYMENT INTENT EVENTS =====
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event);
        break;

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event);
        break;

      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentAmountCapturableUpdated(event);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event);
        break;

      // ===== CHARGE EVENTS =====
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event);
        break;

      case 'charge.dispute.updated':
        await handleChargeDisputeUpdated(event);
        break;

      case 'charge.dispute.closed':
        await handleChargeDisputeClosed(event);
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

      case 'capability.updated':
        await handleCapabilityUpdated(event);
        break;

      // ===== EXTERNAL ACCOUNT EVENTS =====
      case 'account.external_account.created':
        await handleExternalAccountCreated(event);
        break;

      case 'account.external_account.updated':
        await handleExternalAccountUpdated(event);
        break;

      case 'account.external_account.deleted':
        await handleExternalAccountDeleted(event);
        break;

      // ===== TRANSFER EVENTS =====
      case 'transfer.created':
        await handleTransferCreated(event);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event);
        break;

      case 'transfer.paid':
        await handleTransferPaid(event);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event);
        break;

      // ===== UNHANDLED EVENTS =====
      default:
        await handleUnhandledEvent(event);
        break;
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ [Stripe Webhook] Webhook processed successfully');
    console.log('⏱️ [Stripe Webhook] Processing time:', processingTime, 'ms');

    // Always return success to Stripe
    return NextResponse.json({ received: true, type: event.type });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('❌ [Stripe Webhook] Error:', error);
    console.error('   Error type:', error instanceof Error ? error.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('⏱️ [Stripe Webhook] Failed after:', processingTime, 'ms');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
