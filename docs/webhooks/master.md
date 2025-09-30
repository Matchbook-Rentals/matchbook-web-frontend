# Webhook Master Documentation

This document provides an index of all webhook endpoints in the Matchbook platform.

## Overview

Webhooks allow external services to notify Matchbook of events in real-time. Each webhook endpoint is designed to receive events from a specific service and trigger appropriate business logic.

---

## Active Webhook Endpoints

### Payment & Financial Webhooks

#### 1. Stripe Payment Webhooks
**Endpoint**: `/api/payment-webhook`
**Service**: Stripe
**Purpose**: Payment lifecycle events (success, failure, processing)
**Documentation**: [`/docs/webhooks/stripe.md`](./stripe.md)

**Events Handled**:
- `payment_intent.processing` - ACH payment initiated
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed

**Related Documentation**:
- [Payment Specification](/docs/payment-spec.md)
- [ACH Flow Summary](/docs/ach-flow-summary.md)

---

#### 2. Stripe Connect Webhooks
**Endpoint**: `/api/connect-webhook`
**Service**: Stripe Connect
**Purpose**: Monitor connected account (host) health and status
**Documentation**: [`/docs/webhooks/stripe.md`](./stripe.md)

**Events Handled**:
- `account.updated` - Account status/capability changes
- `account.application.deauthorized` - Host disconnects
- `person.updated` - Identity verification updates
- `account.external_account.updated` - Bank account changes

**Related Documentation**:
- [Stripe Webhooks](/docs/webhooks/stripe.md)

---

#### 3. Legacy Stripe Webhook
**Endpoint**: `/api/webhooks/stripe`
**Service**: Stripe (legacy)
**Purpose**: Legacy endpoint, may be deprecated
**Status**: ⚠️ Review for deprecation - use `/api/payment-webhook` instead

---

#### 4. Legacy Payment Webhook
**Endpoint**: `/api/payment/webhook`
**Service**: Unknown payment provider
**Purpose**: Legacy payment webhook
**Status**: ⚠️ Review for deprecation

---

### Identity Verification Webhooks

#### 5. Medallion Identity Verification
**Endpoint**: `/api/medallion/webhook`
**Service**: Medallion (authenticate.com)
**Purpose**: Identity verification results
**Documentation**: _TODO: Create `/docs/webhooks/medallion.md`_

**Events Handled**:
- Identity verification complete
- Verification failed
- Document review updates

**Related Files**:
- `/src/app/api/medallion/webhook/route.ts`

---

### Background Check Webhooks

#### 6. Background Check Results
**Endpoint**: `/api/background-check-webhook`
**Service**: Background check provider (TBD)
**Purpose**: Receive background check results
**Documentation**: _TODO: Create `/docs/webhooks/background-checks.md`_

**Related Files**:
- `/src/app/api/background-check-webhook/route.ts`

---

### Document Signing Webhooks

#### 7. BoldSign Document Webhooks
**Endpoint**: `/api/boldsign/webhook`
**Service**: BoldSign
**Purpose**: Document signing status updates
**Status**: ⚠️ **DEPRECATED** - See `/boldsign-deprecate.md`
**Documentation**: _No longer maintained_

**Related Files**:
- `/src/app/api/boldsign/webhook/route.ts`
- `/boldsign-deprecate.md`

---

#### 8. Lease Template Webhooks
**Endpoint**: `/api/leases/template/webhook`
**Service**: Document signing service
**Purpose**: Lease template signing events
**Documentation**: _TODO: Document lease signing flow_

**Related Files**:
- `/src/app/api/leases/template/webhook/route.ts`

---

### User Management Webhooks

#### 9. Clerk User Webhooks
**Endpoint**: `/api/webhooks/clerk`
**Service**: Clerk (authentication provider)
**Purpose**: User creation, updates, deletions
**Documentation**: _TODO: Create `/docs/webhooks/clerk.md`_

**Events Handled**:
- `user.created` - New user registration
- `user.updated` - User profile changes
- `user.deleted` - User account deletion

**Related Files**:
- `/src/app/api/webhooks/clerk/route.ts`

---

### Property Management Webhooks

#### 10. Hospitable Integration
**Endpoint**: `/api/webhooks/hospitable`
**Service**: Hospitable (property management)
**Purpose**: Property management system integration
**Documentation**: _TODO: Document Hospitable integration_

**Related Files**:
- `/src/app/api/webhooks/hospitable/route.ts`

---

### Deprecated/Legacy Endpoints

#### 11. Airslate Webhook
**Endpoint**: `/api/airslate`
**Service**: Airslate
**Purpose**: Unknown - appears to be legacy
**Status**: ⚠️ Review for removal

---

## Webhook Security

All webhook endpoints MUST implement the following security measures:

### 1. Signature Verification
Each service provides signature verification:
- **Stripe**: Verify `stripe-signature` header with webhook secret
- **Clerk**: Verify Svix signature headers
- **Other services**: Follow provider-specific verification

### 2. Idempotency
All webhook handlers MUST be idempotent (safe to process multiple times):
- Track processed event IDs
- Use database transactions
- Handle duplicate deliveries gracefully

### 3. Error Handling
- Return 200 OK even if business logic fails (after validation)
- Log all errors for debugging
- Implement retry logic where appropriate

### 4. Response Times
- Respond quickly (< 5 seconds)
- Move heavy processing to background jobs if needed
- Stripe will retry failed webhooks

---

## Configuration

### Environment Variables

Each webhook requires specific environment variables:

```env
# Stripe Webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxx          # Payment webhooks
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_yyy  # Connect webhooks

# Clerk
CLERK_WEBHOOK_SECRET=whsec_zzz

# Medallion
MEDALLION_WEBHOOK_SECRET=xxx

# Add others as needed...
```

### Stripe Dashboard Setup

1. **Payment Webhook**:
   - URL: `https://yourdomain.com/api/payment-webhook`
   - Events: `payment_intent.processing`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Connect Webhook**:
   - URL: `https://yourdomain.com/api/connect-webhook`
   - Type: **Connect** webhook
   - Events: `account.updated`, `account.application.deauthorized`, `person.updated`, `account.external_account.updated`

---

## Testing Webhooks

### Stripe CLI

```bash
# Listen for payment webhooks
stripe listen --forward-to localhost:3000/api/payment-webhook

# Listen for Connect webhooks
stripe listen --forward-connect-to localhost:3000/api/connect-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger account.updated
```

### Manual Testing

Use the webhook tester in the admin panel:
- Navigate to `/admin/test/webhook-tester`
- Send test payloads to webhook endpoints

---

## Monitoring

### Webhook Failures

Monitor webhook endpoints for:
- Failed deliveries (check service dashboards)
- Response times > 5 seconds
- Error rates
- Signature verification failures

### Logging

All webhook handlers should log:
- Event type received
- Event ID
- Processing status
- Any errors encountered
- Timestamp

Example log format:
```
[Webhook] payment_intent.succeeded - pi_xxx - SUCCESS - 234ms
[Webhook] account.updated - acct_yyy - ERROR: Database timeout - 5012ms
```

---

## Documentation Status

### ✅ Complete
- Stripe payment webhooks
- Stripe Connect webhooks

### 🚧 TODO
- [ ] Medallion identity verification webhooks
- [ ] Background check webhooks
- [ ] Clerk user management webhooks
- [ ] Lease signing webhooks
- [ ] Hospitable integration webhooks

### ⚠️ Needs Review
- Legacy Stripe webhook (`/api/webhooks/stripe`)
- Legacy payment webhook (`/api/payment/webhook`)
- Airslate webhook (purpose unclear)

---

## Adding New Webhooks

When adding a new webhook endpoint:

1. **Create the route file**: `/src/app/api/[service]-webhook/route.ts`
2. **Implement signature verification**: Use service-specific method
3. **Add error handling**: Try-catch with proper logging
4. **Make it idempotent**: Track processed events
5. **Document it**: Create `/docs/webhooks/[service].md`
6. **Update this file**: Add entry to master webhook list
7. **Add environment variables**: Document required secrets
8. **Configure service dashboard**: Set up webhook URL
9. **Test it**: Use service CLI or manual testing
10. **Monitor it**: Add logging and alerts

---

## Related Documentation

- [Stripe Webhooks](/docs/webhooks/stripe.md)
- [Payment Specification](/docs/payment-spec.md)
- [ACH Flow Summary](/docs/ach-flow-summary.md)
- [ACH Payment Failure Pages](/docs/ach-payment-failure-pages.md)

---

## Webhook Endpoints Summary

| Endpoint | Service | Status | Documentation |
|----------|---------|--------|---------------|
| `/api/payment-webhook` | Stripe | ✅ Active | [Stripe Webhooks](./stripe.md) |
| `/api/connect-webhook` | Stripe Connect | ✅ Active | [Stripe Webhooks](./stripe.md) |
| `/api/medallion/webhook` | Medallion | ✅ Active | _TODO_ |
| `/api/background-check-webhook` | BGS | ✅ Active | _TODO_ |
| `/api/webhooks/clerk` | Clerk | ✅ Active | _TODO_ |
| `/api/leases/template/webhook` | Lease Signing | ✅ Active | _TODO_ |
| `/api/webhooks/hospitable` | Hospitable | ✅ Active | _TODO_ |
| `/api/boldsign/webhook` | BoldSign | ⚠️ Deprecated | See `/boldsign-deprecate.md` |
| `/api/webhooks/stripe` | Stripe | ⚠️ Legacy | Review for removal |
| `/api/payment/webhook` | Unknown | ⚠️ Legacy | Review for removal |
| `/api/airslate` | Airslate | ⚠️ Legacy | Review for removal |

**Total Active Webhooks**: 7
**Deprecated/Legacy**: 4
**Needs Documentation**: 5
