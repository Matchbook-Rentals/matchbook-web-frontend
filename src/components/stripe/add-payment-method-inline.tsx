'use client';

import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodInlineProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Inner form component that uses Stripe hooks
function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('🚀 [AddPaymentMethod] Form submission started');

    if (!stripe || !elements) {
      console.error('❌ [AddPaymentMethod] Stripe or Elements not initialized', { 
        stripe: !!stripe, 
        elements: !!elements 
      });
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const confirmParams = {
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required' as const,
      };
      
      console.log('📤 [AddPaymentMethod] Calling stripe.confirmSetup with params:', {
        return_url: confirmParams.confirmParams.return_url,
        redirect: confirmParams.redirect,
      });

      const result = await stripe.confirmSetup(confirmParams);
      
      console.log('📊 [AddPaymentMethod] confirmSetup result:', {
        hasError: !!result.error,
        error: result.error ? {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message,
        } : null,
      });

      if (result.error) {
        console.error('❌ [AddPaymentMethod] confirmSetup failed:', {
          type: result.error.type,
          code: result.error.code,
          message: result.error.message,
          decline_code: result.error.decline_code,
          payment_method: result.error.payment_method,
        });
        
        if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
          setErrorMessage(result.error.message || 'An error occurred');
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
      } else {
        console.log('✅ [AddPaymentMethod] Payment method setup successful');
        
        // Add a small delay to ensure the payment method is fully processed
        setTimeout(() => {
          console.log('🔄 [AddPaymentMethod] Triggering success callbacks');
          toast({
            title: "Success!",
            description: "Payment method added successfully",
          });
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      console.error('💥 [AddPaymentMethod] Unexpected error during submission:', err);
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
      console.log('🏁 [AddPaymentMethod] Form submission completed');
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
          },
          // Don't auto-select any payment method but keep Link authentication
          defaultPaymentMethod: undefined,
          // Allow saved payment methods but don't auto-expand
          savedPaymentMethods: {
            allow_redisplay_filters: ['always', 'limited', 'unspecified']
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
          className="bg-[#0a6060] hover:bg-[#063a3a] text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function AddPaymentMethodInline({ 
  onSuccess, 
  onCancel 
}: AddPaymentMethodInlineProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [componentKey, setComponentKey] = useState(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    // Create a SetupIntent when component mounts
    const createSetupIntent = async () => {
      setIsLoading(true);
      console.log('🎯 [AddPaymentMethod] Creating SetupIntent...');
      
      try {
        const response = await fetch('/api/user/setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📥 [AddPaymentMethod] SetupIntent response status:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ [AddPaymentMethod] SetupIntent creation failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(`Failed to initialize payment method setup: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [AddPaymentMethod] SetupIntent created:', {
          hasClientSecret: !!data.clientSecret,
          setupIntentId: data.setupIntentId,
        });
        
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('💥 [AddPaymentMethod] Error creating setup intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment method setup. Please try again.",
          variant: "destructive",
        });
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    createSetupIntent();
  }, [onCancel, toast]);

  return (
    <Card className="w-full mt-4 border-2 border-[#0a6060] bg-[#f8fafa]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">
            Add Payment Method
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
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#0a6060] mb-3" />
            <p className="text-gray-600">Initializing secure payment form...</p>
          </div>
        ) : clientSecret ? (
          <Elements 
            key={`payment-form-${componentKey}`} // Force fresh payment selection
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0a6060',
                },
              },
              loader: 'auto' // Keep Link authentication
            }}
          >
            <AddPaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        ) : null}
      </CardContent>
    </Card>
  );
}