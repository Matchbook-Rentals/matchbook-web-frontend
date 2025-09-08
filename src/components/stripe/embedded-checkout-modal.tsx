'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EmbeddedCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string | null;
  amount: number;
  onSuccess?: () => void;
}

export function EmbeddedCheckoutModal({ 
  isOpen, 
  onClose, 
  clientSecret,
  amount,
  onSuccess 
}: EmbeddedCheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clientSecret) {
      setIsLoading(false);
    }
  }, [clientSecret]);

  const handleComplete = () => {
    console.log('✅ Payment completed in embedded checkout');
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!clientSecret) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Complete Payment - ${amount.toFixed(2)}
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
        
        <div className="relative min-h-[600px] overflow-y-auto">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading payment form...</p>
              </div>
            </div>
          )}
          
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ 
              clientSecret,
              onComplete: handleComplete
            }}
          >
            <EmbeddedCheckout className="p-6" />
          </EmbeddedCheckoutProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}