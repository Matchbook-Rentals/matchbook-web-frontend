'use client';

import StripeCheckoutForm from '@/components/stripe/stripe-checkout-form';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const { userId } = useAuth();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, userId }), // $10.00
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [userId]);

  return (
    <div>
      <h1>Checkout</h1>
      {clientSecret && <StripeCheckoutForm clientSecret={clientSecret} />}
    </div>
  );
}