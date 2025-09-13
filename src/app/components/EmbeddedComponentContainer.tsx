'use client';

import React, { useState, useEffect } from 'react';
import { ConnectComponentsProvider } from '@stripe/react-connect-js';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUser } from '@clerk/nextjs';

interface EmbeddedComponentContainerProps {
  componentName: string;
  children: React.ReactNode;
  onAccountCreated?: (accountId: string) => void;
}

export default function EmbeddedComponentContainer({ 
  componentName, 
  children, 
  onAccountCreated 
}: EmbeddedComponentContainerProps) {
  const { user } = useUser();
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState('');
  const [accountType, setAccountType] = useState('individual');
  
  const { stripeConnectInstance, hasError, isLoading } = useStripeConnect(connectedAccountId, {
    theme: 'light',
    overlay: 'dialog',
    locale: 'en-US'
  });

  useEffect(() => {
    // Check if user already has a Stripe account
    const checkUserStripeAccount = async () => {
      if (user?.id) {
        try {
          const response = await fetch('/api/user/stripe-account');
          const data = await response.json();
          if (data.stripeAccountId) {
            setConnectedAccountId(data.stripeAccountId);
          }
        } catch (error) {
          console.error('Error checking user Stripe account:', error);
        }
      }
    };

    checkUserStripeAccount();
  }, [user?.id]);

  const createStripeAccount = async () => {
    setAccountCreatePending(true);
    setError(false);

    try {
      const response = await fetch('/api/payment/account-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountType }),
      });

      const json = await response.json();
      
      if (json.account) {
        setConnectedAccountId(json.account);
        onAccountCreated?.(json.account);
      } else if (json.error) {
        setError(true);
        console.error('Account creation error:', json.error);
      }
    } catch (err) {
      console.error('Account creation request failed:', err);
      setError(true);
    } finally {
      setAccountCreatePending(false);
    }
  };

  // Show account setup form if no connected account
  if (!connectedAccountId) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Set up your payment account</h2>
            <p className="text-gray-600 mb-6">
              Set up your account to receive payments from tenants securely.
            </p>

            {!accountCreatePending && (
              <>
                <RadioGroup
                  value={accountType}
                  onValueChange={setAccountType}
                  className="mb-6 flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value="individual" 
                      id="individual"
                      className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                    />
                    <Label 
                      htmlFor="individual"
                      className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                    >
                      Individual
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem 
                      value="company" 
                      id="business"
                      className="flex w-4 h-4 items-center justify-center relative border-secondaryBrand data-[state=checked]:border-secondaryBrand data-[state=checked]:text-secondaryBrand focus:ring-0 focus:ring-offset-0"
                    />
                    <Label 
                      htmlFor="business"
                      className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm tracking-[0] leading-5 whitespace-nowrap cursor-pointer"
                    >
                      Business
                    </Label>
                  </div>
                </RadioGroup>

                <BrandButton onClick={createStripeAccount} className="w-full">
                  Create Payment Account
                </BrandButton>
              </>
            )}

            {accountCreatePending && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Creating your account...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Something went wrong. Please try again.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">Unable to load your payment setup. Please try again.</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while Stripe Connect initializes
  if (isLoading || !stripeConnectInstance) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading payment setup...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the embedded component
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            {children}
          </ConnectComponentsProvider>
        </CardContent>
      </Card>
    </div>
  );
}