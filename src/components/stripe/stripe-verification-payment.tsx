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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
        return_url: `${window.location.origin}/platform/verification/review?session_id=${sessionId}`,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <LinkAuthenticationElement 
          onChange={(e) => {
            setEmail(e.value.email);
          }}
        />
        <PaymentElement id="payment-element" />
      </div>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        disabled={isLoading || !stripe || !elements}
        type="submit"
      >
        {isLoading ? "Processing..." : "Pay $25.00"}
      </Button>
      {/* Show any error or success messages */}
      {message && <div className="mt-4 text-sm text-center text-gray-700">{message}</div>}
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
        
        const returnUrl = `${window.location.origin}/platform/verification/review`;
        
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
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="text-blue-600"
        >
          ← Back
        </Button>
      </div>

      <h2 className="text-xl font-bold mb-4 text-center">Background Verification Payment</h2>
      <p className="text-center mb-6 text-gray-600">
        One-time fee of $25.00 for complete background screening
      </p>

      <Card className="p-6">
        {error ? (
          <div className="text-center text-red-600 p-4">
            <p>{error}</p>
            <Button 
              onClick={onCancel} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        ) : !clientSecret ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <VerificationCheckoutForm onSuccess={onPaymentSuccess} />
          </Elements>
        )}
      </Card>
    </div>
  );
}