import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prismadb';
import { logger } from '@/lib/logger';

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

// Helper function to handle account.updated event
const handleAccountUpdated = async (account: any) => {
  logger.info('🔄 [Webhook] Processing account.updated:', {
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    requirements: {
      currently_due: account.requirements?.currently_due?.length || 0,
      past_due: account.requirements?.past_due?.length || 0,
      eventually_due: account.requirements?.eventually_due?.length || 0,
      disabled_reason: account.requirements?.disabled_reason,
      current_deadline: account.requirements?.current_deadline,
    }
  });

  try {
    // Find user by Stripe account ID
    const user = await prisma.user.findFirst({
      where: { stripeAccountId: account.id }
    });

    if (!user) {
      logger.warn('⚠️ [Webhook] No user found for Stripe account:', account.id);
      return;
    }

    // Check if account needs additional information
    const requirementsNeeded = account.requirements?.currently_due?.length > 0 || 
                               account.requirements?.past_due?.length > 0;
    
    if (requirementsNeeded) {
      logger.warn('📋 [Webhook] Account has requirements:', {
        userId: user.id,
        accountId: account.id,
        currently_due: account.requirements.currently_due,
        past_due: account.requirements.past_due,
        deadline: account.requirements.current_deadline 
          ? new Date(account.requirements.current_deadline * 1000).toISOString()
          : null,
      });

      // TODO: Send notification to user about requirements
      // TODO: Store requirements in database for dashboard display
    }

    // Log capability status
    if (!account.charges_enabled || !account.payouts_enabled) {
      logger.warn('⚠️ [Webhook] Account capabilities limited:', {
        userId: user.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        disabled_reason: account.requirements?.disabled_reason,
      });
    }

    logger.info('✅ [Webhook] Account update processed successfully');
  } catch (error) {
    logger.error('💥 [Webhook] Error processing account update:', error);
    throw error;
  }
};

// Helper function to handle person.updated event
const handlePersonUpdated = async (person: any) => {
  logger.info('👤 [Webhook] Processing person.updated:', {
    id: person.id,
    account: person.account,
    verification_status: person.verification?.status,
    requirements: person.requirements,
  });

  // Log if verification is needed
  if (person.requirements?.currently_due?.length > 0) {
    logger.warn('📋 [Webhook] Person has verification requirements:', {
      personId: person.id,
      accountId: person.account,
      requirements: person.requirements.currently_due,
    });
  }
};

// Helper function to handle capability.updated event
const handleCapabilityUpdated = async (capability: any) => {
  logger.info('🎯 [Webhook] Processing capability.updated:', {
    id: capability.id,
    account: capability.account,
    status: capability.status,
    requested: capability.requested,
    requirements: capability.requirements,
  });

  // Log if capability is not active
  if (capability.status !== 'active') {
    logger.warn('⚠️ [Webhook] Capability not active:', {
      capabilityId: capability.id,
      accountId: capability.account,
      status: capability.status,
      requirements: capability.requirements,
    });
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
      // Connect account events
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
        
      case 'person.updated':
        await handlePersonUpdated(event.data.object);
        break;
        
      case 'capability.updated':
        await handleCapabilityUpdated(event.data.object);
        break;
      
      // Payment method events
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