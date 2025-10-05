'use server'

import prisma from '@/lib/prismadb';
import {
  PaymentIntentProcessingEvent,
  PaymentIntentSucceededEvent,
  PaymentIntentFailedEvent,
  StripePaymentIntent
} from '@/lib/webhooks/stripe-event-types';

export interface TestableBooking {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  paymentStatus: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  listing: {
    title: string | null;
  };
  match: {
    id: string;
    stripePaymentIntentId: string | null;
    stripePaymentMethodId: string | null;
    paymentAmount: number | null;
    paymentStatus: string | null;
  } | null;
}

export async function getTestableBookings(): Promise<TestableBooking[]> {
  const bookings = await prisma.booking.findMany({
    include: {
      match: {
        select: {
          id: true,
          stripePaymentIntentId: true,
          stripePaymentMethodId: true,
          paymentAmount: true,
          paymentStatus: true
        }
      },
      listing: {
        select: {
          title: true
        }
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    where: {
      match: {
        stripePaymentIntentId: { not: null }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return bookings as TestableBooking[];
}

interface SendWebhookParams {
  matchId: string;
  eventType: 'payment_intent.processing' | 'payment_intent.succeeded' | 'payment_intent.payment_failed';
  failureCode?: string;
  failureMessage?: string;
}

export async function sendStripeWebhookEvent(params: SendWebhookParams) {
  try {
    // Get match data with all necessary relations
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        trip: {
          include: {
            user: true
          }
        },
        listing: {
          include: {
            user: true
          }
        },
        booking: true
      }
    });

    if (!match || !match.stripePaymentIntentId) {
      return {
        success: false,
        error: 'Match or payment intent not found'
      };
    }

    // Construct Stripe event
    const event = constructStripeEvent(match, params);

    // Send to webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/payment/webhook`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': process.env.STRIPE_WEBHOOK_SECRET || 'test_signature'
      },
      body: JSON.stringify(event)
    });

    const responseText = await response.text();

    return {
      success: response.ok,
      status: response.status,
      response: responseText,
      event
    };
  } catch (error) {
    console.error('Error sending webhook event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function constructStripeEvent(
  match: any,
  params: SendWebhookParams
): PaymentIntentProcessingEvent | PaymentIntentSucceededEvent | PaymentIntentFailedEvent {
  const basePaymentIntent: StripePaymentIntent = {
    id: match.stripePaymentIntentId!,
    object: 'payment_intent',
    amount: (match.paymentAmount || 0) * 100, // Convert to cents
    amount_capturable: 0,
    amount_received: params.eventType === 'payment_intent.succeeded' ? (match.paymentAmount || 0) * 100 : 0,
    application: null,
    application_fee_amount: null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: 'automatic',
    client_secret: `${match.stripePaymentIntentId}_secret_test`,
    confirmation_method: 'automatic',
    created: Math.floor(Date.now() / 1000),
    currency: 'usd',
    customer: match.trip.user.stripeCustomerId || null,
    description: 'Security deposit payment',
    invoice: null,
    last_payment_error: null,
    latest_charge: null,
    livemode: false,
    metadata: {
      userId: match.trip.userId,
      matchId: match.id,
      hostUserId: match.listing.userId,
      type: 'security_deposit_direct'
    },
    next_action: null,
    on_behalf_of: null,
    payment_method: match.stripePaymentMethodId,
    payment_method_types: ['us_bank_account'],
    processing: null,
    receipt_email: match.trip.user.email || null,
    setup_future_usage: null,
    shipping: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: 'processing',
    transfer_data: {
      destination: match.listing.user.stripeAccountId || '',
      amount: ((match.paymentAmount || 0) * 100) - 700 // Minus $7 transfer fee
    },
    transfer_group: null
  };

  const eventId = `evt_test_${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  if (params.eventType === 'payment_intent.payment_failed') {
    return {
      id: eventId,
      object: 'event',
      api_version: '2024-06-20',
      created: timestamp,
      data: {
        object: {
          ...basePaymentIntent,
          status: 'requires_payment_method',
          last_payment_error: {
            code: params.failureCode || 'payment_intent_authentication_failure',
            message: params.failureMessage || 'Payment failed',
            type: 'card_error'
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      },
      type: 'payment_intent.payment_failed'
    };
  } else if (params.eventType === 'payment_intent.succeeded') {
    return {
      id: eventId,
      object: 'event',
      api_version: '2024-06-20',
      created: timestamp,
      data: {
        object: {
          ...basePaymentIntent,
          status: 'succeeded',
          amount_received: (match.paymentAmount || 0) * 100
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };
  } else {
    // payment_intent.processing
    return {
      id: eventId,
      object: 'event',
      api_version: '2024-06-20',
      created: timestamp,
      data: {
        object: {
          ...basePaymentIntent,
          status: 'processing'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null
      },
      type: 'payment_intent.processing'
    };
  }
}
