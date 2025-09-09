'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Inner form component that uses Stripe hooks
function AddPaymentMethodForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
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
          onClose();
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
              // Pre-fill if you have user data
            }
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
          onClick={onClose}
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

export function AddPaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AddPaymentMethodModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !clientSecret) {
      // Create a SetupIntent when modal opens
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
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      createSetupIntent();
    }
  }, [isOpen, clientSecret, onClose, toast]);

  // Reset client secret when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Add Payment Method
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
              <p className="text-gray-600">Initializing secure payment form...</p>
            </div>
          ) : clientSecret ? (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0a6060',
                  },
                },
              }}
            >
              <AddPaymentMethodForm onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}