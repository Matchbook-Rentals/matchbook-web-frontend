'use client';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutButtonProps {
  endpointUrl: string;
}

export default function StripeCheckoutButton({ endpointUrl }: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const handleCheckout = async () => {
    setIsLoading(true);
    console.log('USER', user);

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      console.log('stripe', stripe);
      console.log('sessionId', sessionId);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe checkout error:', error);
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      variant="default"
    >
      {isLoading ? 'Processing...' : 'Pay for Background Screening'}
    </Button>
  );
}