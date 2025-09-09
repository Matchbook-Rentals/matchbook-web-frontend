import stripe from '@/lib/stripe';

/**
 * Verify that a payment method was successfully saved to a customer
 */
export const verifyPaymentMethodSaved = async (
  customerId: string,
  expectedMethodId?: string
): Promise<boolean> => {
  console.log('🔍 [StripeHelper] Verifying payment method saved for customer:', customerId);
  
  try {
    // Fetch all payment methods for the customer
    const [cardMethods, bankMethods] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      }),
      stripe.paymentMethods.list({
        customer: customerId,
        type: 'us_bank_account',
      })
    ]);
    
    const allMethods = [...cardMethods.data, ...bankMethods.data];
    
    console.log('📊 [StripeHelper] Found payment methods:', {
      total: allMethods.length,
      cards: cardMethods.data.length,
      banks: bankMethods.data.length,
      methodIds: allMethods.map(m => m.id),
    });
    
    if (expectedMethodId) {
      const found = allMethods.some(method => method.id === expectedMethodId);
      console.log(`🎯 [StripeHelper] Expected method ${expectedMethodId} found:`, found);
      return found;
    }
    
    return allMethods.length > 0;
  } catch (error) {
    console.error('💥 [StripeHelper] Error verifying payment methods:', error);
    return false;
  }
};

/**
 * Get detailed information about a SetupIntent
 */
export const getSetupIntentDetails = async (
  setupIntentId: string
): Promise<any> => {
  console.log('🔍 [StripeHelper] Getting SetupIntent details:', setupIntentId);
  
  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    console.log('📦 [StripeHelper] SetupIntent details:', {
      id: setupIntent.id,
      status: setupIntent.status,
      customer: setupIntent.customer,
      payment_method: setupIntent.payment_method,
      created: new Date(setupIntent.created * 1000).toISOString(),
      usage: setupIntent.usage,
    });
    
    return setupIntent;
  } catch (error) {
    console.error('💥 [StripeHelper] Error retrieving SetupIntent:', error);
    throw error;
  }
};

/**
 * Check if Stripe webhook endpoint is configured
 */
export const checkWebhookConfiguration = async (): Promise<void> => {
  console.log('🔧 [StripeHelper] Checking webhook configuration...');
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ [StripeHelper] STRIPE_WEBHOOK_SECRET not configured');
    console.warn('💡 [StripeHelper] To set up webhooks:');
    console.warn('   1. Go to https://dashboard.stripe.com/webhooks');
    console.warn('   2. Add endpoint: https://your-domain.com/api/webhooks/stripe');
    console.warn('   3. Select events: setup_intent.succeeded, payment_method.attached');
    console.warn('   4. Copy the signing secret to STRIPE_WEBHOOK_SECRET env var');
  } else {
    console.log('✅ [StripeHelper] Webhook secret configured');
  }
};