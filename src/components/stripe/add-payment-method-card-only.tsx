'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X, CreditCard } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodCardOnlyProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

// Inner form component that uses Stripe hooks
function AddPaymentMethodForm({
  onSuccess,
  onCancel
}: {
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('🚀 [AddPaymentMethodCardOnly] Form submission started');

    if (!stripe || !elements) {
      console.error('❌ [AddPaymentMethodCardOnly] Stripe or Elements not initialized');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the setup intent to save the payment method
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      console.log('📊 [AddPaymentMethodCardOnly] confirmSetup result:', {
        hasError: !!result.error,
        setupIntent: result.setupIntent,
      });

      if (result.error) {
        console.error('❌ [AddPaymentMethodCardOnly] confirmSetup failed:', result.error);
        setErrorMessage(result.error.message || 'An error occurred');
      } else if (result.setupIntent && result.setupIntent.payment_method) {
        const paymentMethodId = typeof result.setupIntent.payment_method === 'string'
          ? result.setupIntent.payment_method
          : result.setupIntent.payment_method.id;

        console.log('✅ [AddPaymentMethodCardOnly] Payment method saved:', paymentMethodId);

        // Add a small delay to ensure the payment method is fully processed
        setTimeout(() => {
          console.log('🔄 [AddPaymentMethodCardOnly] Triggering success callback');
          onSuccess(paymentMethodId);
        }, 500);
      } else {
        console.error('❌ [AddPaymentMethodCardOnly] No payment method in result');
        setErrorMessage('Failed to save payment method');
      }
    } catch (err) {
      console.error('💥 [AddPaymentMethodCardOnly] Unexpected error:', err);
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              // Keep empty to not pre-fill
            }
          },
          fields: {
            billingDetails: {
              address: 'auto'
            }
          },
          wallets: {
            applePay: 'never',
            googlePay: 'never'
          }
        }}
      />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="bg-[#3c8787] hover:bg-[#2c6767] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function AddPaymentMethodCardOnly({
  clientSecret,
  onSuccess,
  onCancel
}: AddPaymentMethodCardOnlyProps) {
  const [componentKey] = useState(Date.now());

  console.log('🎯 [AddPaymentMethodCardOnly] Component mounted with clientSecret');

  return (
    <Card className="w-full border-2 border-[#3c8787] bg-[#f8fafa]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">
            Add Card for Verification
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Add a credit or debit card to pay for your background check. You won't be charged until you click "Pay $25.00" below.
        </p>

        <Elements
          key={`payment-form-${componentKey}`}
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#3c8787',
              },
            },
            loader: 'auto'
          }}
        >
          <AddPaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </CardContent>
    </Card>
  );
}