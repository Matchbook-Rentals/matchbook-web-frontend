'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import { HomeIcon, AlertCircle } from 'lucide-react';
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const VerificationCheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Get the payment intent's client secret from the URL query parameters
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    // Check the status of the payment
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          onSuccess();
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Please provide payment details.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe, onSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);

    // Get the stored session ID
    const sessionId = localStorage.getItem('verificationSessionId') || '';

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/app/verification/success?session_id=${sessionId}`,
        receipt_email: email,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error) {
      setMessage(error.message ?? "An unexpected error occurred.");
    } else {
      setMessage("Payment processing. Please wait...");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <LinkAuthenticationElement
          onChange={(e) => {
            setEmail(e.value.email);
          }}
        />
        <PaymentElement id="payment-element" />
      </div>

      <BrandButton
        size="lg"
        disabled={isLoading || !stripe || !elements}
        type="submit"
      >
        {isLoading ? "Processing..." : "Pay $25.00"}
      </BrandButton>

      {/* Show any error or success messages */}
      {message && (
        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm text-center">
          {message}
        </div>
      )}
    </form>
  );
};

interface StripeVerificationPaymentProps {
  formData: any;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function StripeVerificationPayment({
  formData,
  onPaymentSuccess,
  onCancel
}: StripeVerificationPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a payment intent when the component mounts
    const createPaymentIntent = async () => {
      try {
        // Save form data to local storage for retrieval after redirect
        localStorage.setItem('verificationFormData', JSON.stringify(formData));
        console.log('Form data saved to localStorage:', formData);

        const returnUrl = `${window.location.origin}/app/verification/review`;

        const response = await fetch('/api/create-payment-intent/background-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ returnUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        // Store the session ID in localStorage for verification after redirect
        if (data.sessionId) {
          localStorage.setItem('verificationSessionId', data.sessionId);
        }

        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Payment intent creation error:', err);
        setError(err.message || 'Failed to set up payment');
      }
    };

    createPaymentIntent();
  }, [formData]);

  return (
    <div className="flex flex-col w-full items-start justify-center gap-6">
      {/* Payment Form */}
      {error ? (
        <Card className="w-full rounded-xl border border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="[font-family:'Poppins',Helvetica] font-semibold text-red-900 text-sm">
                  Error
                </p>
                <p className="[font-family:'Poppins',Helvetica] font-normal text-red-700 text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !clientSecret ? (
        <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
          <CardContent className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787]"></div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
          <CardContent className="p-8">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <VerificationCheckoutForm onSuccess={onPaymentSuccess} />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="w-full flex justify-start">
        <BrandButton
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
        >
          Back
        </BrandButton>
      </div>
    </div>
  );
}
