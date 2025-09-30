/**
 * TypeScript interfaces for Stripe webhook events
 *
 * These interfaces provide type safety for webhook event handlers.
 * Based on Stripe API documentation: https://docs.stripe.com/api/events/types
 */

// ===== BASE INTERFACES =====

export interface StripeWebhookEvent<T = any> {
  id: string;
  object: 'event';
  api_version: string | null;
  created: number;
  data: {
    object: T;
    previous_attributes?: Partial<T>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  } | null;
  type: string;
}

// ===== PAYMENT INTENT EVENTS =====

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amount_capturable?: number;
  amount_received?: number;
  application: string | null;
  application_fee_amount: number | null;
  automatic_payment_methods: any | null;
  canceled_at: number | null;
  cancellation_reason: string | null;
  capture_method: 'automatic' | 'manual';
  client_secret: string;
  confirmation_method: 'automatic' | 'manual';
  created: number;
  currency: string;
  customer: string | null;
  description: string | null;
  invoice: string | null;
  last_payment_error: {
    charge?: string;
    code?: string;
    decline_code?: string;
    doc_url?: string;
    message?: string;
    param?: string;
    payment_method?: any;
    type: string;
  } | null;
  latest_charge: string | null;
  livemode: boolean;
  metadata: {
    [key: string]: string;
    userId?: string;
    matchId?: string;
    hostUserId?: string;
    type?: string;
    sessionId?: string;
  };
  next_action: any | null;
  on_behalf_of: string | null;
  payment_method: string | null;
  payment_method_types: string[];
  processing: any | null;
  receipt_email: string | null;
  setup_future_usage: string | null;
  shipping: any | null;
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' |
          'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  transfer_data?: {
    amount?: number;
    destination: string;
  };
  transfer_group: string | null;
}

export type PaymentIntentCreatedEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.created';
};

export type PaymentIntentProcessingEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.processing';
};

export type PaymentIntentSucceededEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.succeeded';
};

export type PaymentIntentFailedEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.payment_failed';
};

export type PaymentIntentCanceledEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.canceled';
};

export type PaymentIntentAmountCapturableUpdatedEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.amount_capturable_updated';
};

export type PaymentIntentRequiresActionEvent = StripeWebhookEvent<StripePaymentIntent> & {
  type: 'payment_intent.requires_action';
};

// ===== CHARGE EVENTS =====

export interface StripeCharge {
  id: string;
  object: 'charge';
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  application: string | null;
  application_fee: string | null;
  application_fee_amount: number | null;
  balance_transaction: string | null;
  billing_details: any;
  calculated_statement_descriptor: string | null;
  captured: boolean;
  created: number;
  currency: string;
  customer: string | null;
  description: string | null;
  destination: string | null;
  dispute: string | null;
  disputed: boolean;
  failure_balance_transaction: string | null;
  failure_code: string | null;
  failure_message: string | null;
  fraud_details: any;
  invoice: string | null;
  livemode: boolean;
  metadata: {
    [key: string]: string;
  };
  on_behalf_of: string | null;
  outcome: any | null;
  paid: boolean;
  payment_intent: string | null;
  payment_method: string | null;
  payment_method_details: any | null;
  receipt_email: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  refunded: boolean;
  refunds: any;
  review: string | null;
  shipping: any | null;
  source: any | null;
  source_transfer: string | null;
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  status: 'succeeded' | 'pending' | 'failed';
  transfer_data: {
    amount: number | null;
    destination: string;
  } | null;
  transfer_group: string | null;
}

export type ChargeRefundedEvent = StripeWebhookEvent<StripeCharge> & {
  type: 'charge.refunded';
};

export interface StripeDispute {
  id: string;
  object: 'dispute';
  amount: number;
  balance_transactions: any[];
  charge: string;
  created: number;
  currency: string;
  evidence: any;
  evidence_details: any;
  is_charge_refundable: boolean;
  livemode: boolean;
  metadata: {
    [key: string]: string;
  };
  payment_intent: string | null;
  reason: string;
  status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' |
          'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost';
}

export type ChargeDisputeCreatedEvent = StripeWebhookEvent<StripeDispute> & {
  type: 'charge.dispute.created';
};

export type ChargeDisputeUpdatedEvent = StripeWebhookEvent<StripeDispute> & {
  type: 'charge.dispute.updated';
};

export type ChargeDisputeClosedEvent = StripeWebhookEvent<StripeDispute> & {
  type: 'charge.dispute.closed';
};

// ===== CONNECT ACCOUNT EVENTS =====

export interface StripeAccount {
  id: string;
  object: 'account';
  business_profile: any | null;
  business_type: string | null;
  capabilities: {
    [key: string]: 'active' | 'inactive' | 'pending';
  };
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email: string | null;
  external_accounts: any;
  future_requirements: {
    alternatives: any[] | null;
    current_deadline: number | null;
    currently_due: string[];
    disabled_reason: string | null;
    errors: any[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  individual: any | null;
  metadata: {
    [key: string]: string;
  };
  payouts_enabled: boolean;
  requirements: {
    alternatives: any[] | null;
    current_deadline: number | null;
    currently_due: string[];
    disabled_reason: string | null;
    errors: any[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  settings: any | null;
  tos_acceptance: any | null;
  type: 'standard' | 'express' | 'custom';
}

export type AccountUpdatedEvent = StripeWebhookEvent<StripeAccount> & {
  type: 'account.updated';
};

export interface StripeAccountApplicationDeauthorized {
  id: string;
  object: 'account';
}

export type AccountApplicationDeauthorizedEvent = StripeWebhookEvent<StripeAccountApplicationDeauthorized> & {
  type: 'account.application.deauthorized';
};

export interface StripePerson {
  id: string;
  object: 'person';
  account: string;
  address: any | null;
  created: number;
  dob: any | null;
  email: string | null;
  first_name: string | null;
  future_requirements: any | null;
  id_number_provided: boolean;
  last_name: string | null;
  metadata: {
    [key: string]: string;
  };
  nationality: string | null;
  phone: string | null;
  relationship: any | null;
  requirements: any | null;
  ssn_last_4_provided: boolean;
  verification: {
    additional_document: any | null;
    details: string | null;
    details_code: string | null;
    document: any | null;
    status: 'unverified' | 'pending' | 'verified';
  };
}

export type PersonUpdatedEvent = StripeWebhookEvent<StripePerson> & {
  type: 'person.updated';
};

export interface StripeCapability {
  id: string;
  object: 'capability';
  account: string;
  requested: boolean;
  requested_at: number | null;
  requirements: {
    alternatives: any[] | null;
    current_deadline: number | null;
    currently_due: string[];
    disabled_reason: string | null;
    errors: any[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  status: 'active' | 'inactive' | 'pending';
}

export type CapabilityUpdatedEvent = StripeWebhookEvent<StripeCapability> & {
  type: 'capability.updated';
};

// ===== EXTERNAL ACCOUNT EVENTS =====

export interface StripeBankAccount {
  id: string;
  object: 'bank_account';
  account: string;
  account_holder_name: string | null;
  account_holder_type: string | null;
  account_type: string | null;
  available_payout_methods: string[];
  bank_name: string | null;
  country: string;
  currency: string;
  customer: string | null;
  default_for_currency: boolean;
  fingerprint: string | null;
  last4: string;
  metadata: {
    [key: string]: string;
  };
  routing_number: string | null;
  status: 'new' | 'validated' | 'verified' | 'verification_failed' | 'errored';
}

export type ExternalAccountCreatedEvent = StripeWebhookEvent<StripeBankAccount> & {
  type: 'account.external_account.created';
};

export type ExternalAccountUpdatedEvent = StripeWebhookEvent<StripeBankAccount> & {
  type: 'account.external_account.updated';
};

export type ExternalAccountDeletedEvent = StripeWebhookEvent<StripeBankAccount> & {
  type: 'account.external_account.deleted';
};

// ===== TRANSFER EVENTS =====

export interface StripeTransfer {
  id: string;
  object: 'transfer';
  amount: number;
  amount_reversed: number;
  balance_transaction: string | null;
  created: number;
  currency: string;
  description: string | null;
  destination: string;
  destination_payment: string | null;
  livemode: boolean;
  metadata: {
    [key: string]: string;
  };
  reversals: any;
  reversed: boolean;
  source_transaction: string | null;
  source_type: string;
  transfer_group: string | null;
}

export type TransferCreatedEvent = StripeWebhookEvent<StripeTransfer> & {
  type: 'transfer.created';
};

export type TransferUpdatedEvent = StripeWebhookEvent<StripeTransfer> & {
  type: 'transfer.updated';
};

export type TransferPaidEvent = StripeWebhookEvent<StripeTransfer> & {
  type: 'transfer.paid';
};

export type TransferFailedEvent = StripeWebhookEvent<StripeTransfer> & {
  type: 'transfer.failed';
};

// ===== UNION TYPE FOR ALL EVENTS =====

export type StripeWebhookEventType =
  | PaymentIntentCreatedEvent
  | PaymentIntentProcessingEvent
  | PaymentIntentSucceededEvent
  | PaymentIntentFailedEvent
  | PaymentIntentCanceledEvent
  | PaymentIntentAmountCapturableUpdatedEvent
  | PaymentIntentRequiresActionEvent
  | ChargeRefundedEvent
  | ChargeDisputeCreatedEvent
  | ChargeDisputeUpdatedEvent
  | ChargeDisputeClosedEvent
  | AccountUpdatedEvent
  | AccountApplicationDeauthorizedEvent
  | PersonUpdatedEvent
  | CapabilityUpdatedEvent
  | ExternalAccountCreatedEvent
  | ExternalAccountUpdatedEvent
  | ExternalAccountDeletedEvent
  | TransferCreatedEvent
  | TransferUpdatedEvent
  | TransferPaidEvent
  | TransferFailedEvent;
