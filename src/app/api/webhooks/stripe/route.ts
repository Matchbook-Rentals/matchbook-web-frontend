import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to verify webhook signature
const verifyWebhookSignature = async (
  request: NextRequest,
  body: string
): Promise<any> => {
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    throw new Error('No stripe signature found');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('⚠️ [Webhook] Signature verification failed:', err);
    throw new Error('Invalid signature');
  }
};

// Helper function to handle setup intent succeeded
const handleSetupIntentSucceeded = async (setupIntent: any) => {
  console.log('🎯 [Webhook] Processing setup_intent.succeeded:', {
    id: setupIntent.id,
    customer: setupIntent.customer,
    payment_method: setupIntent.payment_method,
    status: setupIntent.status,
  });

  if (!setupIntent.payment_method) {
    console.warn('⚠️ [Webhook] No payment method in setup intent');
    return;
  }

  // Verify the payment method is attached to the customer
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      setupIntent.payment_method
    );

    console.log('💳 [Webhook] Payment method details:', {
      id: paymentMethod.id,
      type: paymentMethod.type,
      customer: paymentMethod.customer,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
      } : null,
    });

    // Ensure payment method is attached to customer
    if (paymentMethod.customer !== setupIntent.customer) {
      console.log('🔗 [Webhook] Attaching payment method to customer');
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: setupIntent.customer as string,
      });
    }

    console.log('✅ [Webhook] Payment method successfully verified and attached');
  } catch (error) {
    console.error('💥 [Webhook] Error processing payment method:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  console.log('🔔 [Webhook] Stripe webhook received');
  
  try {
    // Get the raw body as text for signature verification
    const body = await request.text();
    
    // Verify the webhook signature
    const event = await verifyWebhookSignature(request, body);
    
    console.log('📦 [Webhook] Event type:', event.type);
    console.log('🆔 [Webhook] Event ID:', event.id);

    // Handle different event types
    switch (event.type) {
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object);
        break;
        
      case 'setup_intent.setup_failed':
        console.error('❌ [Webhook] Setup intent failed:', {
          id: event.data.object.id,
          last_setup_error: event.data.object.last_setup_error,
        });
        break;
        
      case 'payment_method.attached':
        console.log('📎 [Webhook] Payment method attached:', {
          id: event.data.object.id,
          customer: event.data.object.customer,
          type: event.data.object.type,
        });
        break;
        
      case 'payment_method.detached':
        console.log('🔓 [Webhook] Payment method detached:', {
          id: event.data.object.id,
          type: event.data.object.type,
        });
        break;
        
      default:
        console.log(`🤷 [Webhook] Unhandled event type: ${event.type}`);
    }

    // Return success response
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('💥 [Webhook] Error processing webhook:', error);
    
    if (error instanceof Error && error.message === 'Invalid signature') {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}