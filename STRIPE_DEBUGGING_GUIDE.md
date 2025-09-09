# Stripe Payment Method Addition Debugging Guide

## Overview
This guide helps troubleshoot issues with adding payment methods using Stripe SetupIntents.

## Common Issues and Solutions

### 1. Payment Method Not Saving

**Symptoms:**
- Modal shows success but payment method doesn't appear in list
- No errors in console

**Check These Logs:**
```
🎯 [SetupIntent API] Creating setup intent for user:
📦 [SetupIntent API] Stripe customer created:
✅ [SetupIntent API] SetupIntent created successfully:
📤 [AddPaymentMethod] Calling stripe.confirmSetup with params:
📊 [AddPaymentMethod] confirmSetup result:
```

**Common Causes:**
1. **Missing Customer ID**: User doesn't have a Stripe customer ID
2. **Webhook Not Configured**: SetupIntent succeeds but webhook isn't processing
3. **Incorrect redirect handling**: Payment method requires 3D Secure

### 2. SetupIntent Creation Fails

**Check Backend Logs:**
```
💥 [SetupIntent API] Error creating setup intent:
```

**Solutions:**
1. Verify Stripe API keys are correct
2. Check user has valid Clerk auth
3. Ensure database connection is working

### 3. confirmSetup Fails

**Frontend Error Logs:**
```
❌ [AddPaymentMethod] confirmSetup failed:
```

**Common Error Types:**
- `card_error`: Card was declined
- `validation_error`: Invalid card details
- `authentication_required`: 3D Secure needed

## Testing Checklist

### Prerequisites
- [ ] STRIPE_PUBLISHABLE_KEY environment variable set
- [ ] STRIPE_SECRET_KEY environment variable set
- [ ] User is authenticated via Clerk
- [ ] Database is accessible

### Test Flow
1. **Open Browser DevTools Console**
2. **Click "Add Payment Method"**
3. **Look for these success indicators:**
   - `🎯 [SetupIntent API] Request received`
   - `✅ [SetupIntent API] SetupIntent created successfully`
   - `📤 [AddPaymentMethod] Calling stripe.confirmSetup`
   - `✅ [AddPaymentMethod] Payment method setup successful`

### Webhook Setup (Optional but Recommended)

1. **Install Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

2. **Set STRIPE_WEBHOOK_SECRET:**
Copy the webhook signing secret from the CLI output

3. **Monitor webhook events:**
```
🔔 [Webhook] Stripe webhook received
📦 [Webhook] Event type: setup_intent.succeeded
```

## Debug Mode

To enable verbose logging, the code already includes comprehensive logging. Check:

1. **Browser Console** for frontend logs
2. **Terminal/Server Console** for backend logs
3. **Stripe Dashboard** > Events for Stripe-side logs

## Quick Fixes

### Payment Methods Not Showing
```javascript
// Force refresh payment methods
window.refreshPaymentMethods?.()
```

### Clear Test Data
Use Stripe Dashboard to:
1. Delete test customers
2. Cancel incomplete SetupIntents
3. Remove test payment methods

## Support Resources

- [Stripe SetupIntent Docs](https://stripe.com/docs/payments/setup-intents)
- [Stripe Elements Docs](https://stripe.com/docs/stripe-js)
- [Testing Cards](https://stripe.com/docs/testing#cards)

## Test Card Numbers

| Card | Number | Behavior |
|------|--------|----------|
| Success | 4242 4242 4242 4242 | Always succeeds |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |
| Decline | 4000 0000 0000 9995 | Always declines |
| Insufficient Funds | 4000 0000 0000 9995 | Decline: insufficient_funds |