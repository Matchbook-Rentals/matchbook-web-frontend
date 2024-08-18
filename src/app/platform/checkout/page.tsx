'use client';

import StripeCheckoutForm from '@/components/stripe/stripe-checkout-form';
import { useState, useEffect } from 'react';

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }), // $10.00
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  return (
    <div>
      <h1>Checkout</h1>
      {clientSecret && <StripeCheckoutForm clientSecret={clientSecret} />}
    </div>
  );
}