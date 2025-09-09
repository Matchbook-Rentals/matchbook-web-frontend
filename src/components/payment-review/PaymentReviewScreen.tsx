'use client';

import { PlusIcon, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaymentMethodsSection } from './sections/PaymentMethodsSection';
import { TotalDueSection } from './sections/TotalDueSection';
import { UpcomingPaymentsSection } from './sections/UpcomingPaymentsSection';
import { SecurityDepositPolicySection } from './sections/SecurityDepositPolicySection';
import { CancellationPolicySection } from './sections/CancellationPolicySection';
import { EmbeddedCheckoutModal } from '@/components/stripe/embedded-checkout-modal';
import { AddPaymentMethodInline } from '@/components/stripe/add-payment-method-inline';
import { processDirectPayment } from '@/app/actions/process-payment';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  lastFour: string;
  expiry?: string;
  bankName?: string;
}

interface PaymentReviewScreenProps {
  matchId: string;
  amount: number;
  paymentBreakdown: {
    monthlyRent: number;
    securityDeposit: number;
    petDeposit?: number;
    transferFee?: number;
    serviceFee?: number; // Backward compatibility
    processingFee?: number;
    total: number;
  };
  onSuccess: () => void;
  onAddPaymentMethod?: () => void;
  onPaymentMethodChange?: (methodType: 'card' | 'bank' | null) => void;
  onBack?: () => void;
  tripStartDate: Date;
  tripEndDate: Date;
  hidePaymentMethods?: boolean;
  initialPaymentMethods?: PaymentMethod[];
}

export const PaymentReviewScreen: React.FC<PaymentReviewScreenProps> = ({
  matchId,
  amount,
  paymentBreakdown,
  onSuccess,
  onAddPaymentMethod,
  onPaymentMethodChange,
  onBack,
  tripStartDate,
  tripEndDate,
  hidePaymentMethods = false,
  initialPaymentMethods = [],
}) => {
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<'card' | 'bank' | null>(null);
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handlePaymentMethodSelect = (methodId: string, methodType: 'card' | 'bank') => {
    setSelectedPaymentMethod(methodId);
    setSelectedPaymentMethodType(methodType);
    // Notify parent component of payment method change
    if (onPaymentMethodChange) {
      onPaymentMethodChange(methodType);
    }
  };

  const handleProceedToPayment = async (includeCardFee: boolean) => {
    setIsProcessing(true);
    
    // If a payment method is selected, process directly
    if (selectedPaymentMethod) {
      try {
        setShowProcessingDialog(true);
        setProcessingStatus('processing');
        setProcessingError(null);
        
        console.log('💳 Processing direct payment with method:', selectedPaymentMethod);
        
        const result = await processDirectPayment({
          matchId,
          paymentMethodId: selectedPaymentMethod,
          amount,
          includeCardFee
        });
        
        if (result.success) {
          setProcessingStatus('success');
          // Wait a moment to show success state
          setTimeout(() => {
            setShowProcessingDialog(false);
            onSuccess();
          }, 1500);
        } else {
          setProcessingStatus('error');
          setProcessingError(result.error || 'Payment failed. Please try again.');
          console.error('Payment failed:', result.error);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setProcessingStatus('error');
        setProcessingError('An unexpected error occurred. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // No payment method selected, show Stripe checkout
      try {
        const response = await fetch(`/api/matches/${matchId}/create-payment-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount, includeCardFee }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment session');
        }

        const { clientSecret } = await response.json();
        setCheckoutClientSecret(clientSecret);
        setShowEmbeddedCheckout(true);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error creating payment session:', error);
        toast({
          title: 'Error',
          description: 'Failed to start payment process. Please try again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
      }
    }
  };

  const handleCheckoutSuccess = () => {
    setShowEmbeddedCheckout(false);
    setCheckoutClientSecret(null);
    onSuccess();
  };

  const handleCheckoutClose = () => {
    setShowEmbeddedCheckout(false);
    setCheckoutClientSecret(null);
  };

  // Get selected payment method details
  const getSelectedPaymentMethod = () => {
    // This would need to be passed from PaymentMethodsSection or fetched
    // For now, return basic info based on type
    if (!selectedPaymentMethod || !selectedPaymentMethodType) return null;
    return {
      id: selectedPaymentMethod,
      type: selectedPaymentMethodType
    };
  };

  return (
    <>
      <div className="flex flex-col w-full max-w-3xl items-start gap-6 md:gap-8 relative pb-24">
        <header className="relative self-stretch mt-[-1.00px] font-poppins font-bold text-[#1a1a1a] text-2xl md:text-3xl tracking-[0] leading-tight">
          REVIEW PAYMENTS
        </header>

        <PaymentMethodsSection
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={handlePaymentMethodSelect}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={isProcessing}
          hidePaymentMethods={hidePaymentMethods}
          initialPaymentMethods={initialPaymentMethods}
          onPaymentMethodsRefresh={() => {
            // This provides a callback for refresh
          }}
        />

        {!showAddPaymentForm && (
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal"
            onClick={() => setShowAddPaymentForm(true)}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-teal-600 flex items-center justify-center">
              <PlusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            Add New Payment Method
          </Button>
        )}

        {showAddPaymentForm && (
          <AddPaymentMethodInline
            onSuccess={() => {
              setShowAddPaymentForm(false);
              // Trigger a refresh of payment methods
              if (window.refreshPaymentMethods) {
                window.refreshPaymentMethods();
              }
            }}
            onCancel={() => setShowAddPaymentForm(false)}
          />
        )}

        <TotalDueSection 
          paymentBreakdown={paymentBreakdown} 
          isUsingCard={selectedPaymentMethodType === 'card'}
        />
        <UpcomingPaymentsSection 
          monthlyRent={paymentBreakdown.monthlyRent}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          isUsingCard={selectedPaymentMethodType === 'card'}
        />
        <SecurityDepositPolicySection />
        <CancellationPolicySection />
      </div>

      {/* Footer Controls - Fixed at bottom */}
      {selectedPaymentMethod && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
          <div className="flex items-center justify-between">
            {/* Left side - Back button and payment method info */}
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <div className="text-sm text-gray-600">
                {selectedPaymentMethodType === 'card' ? (
                  <>
                    <span className="font-medium">Credit Card Selected</span>
                    <span className="text-xs text-gray-500 ml-2">• 3% processing fee applies</span>
                  </>
                ) : selectedPaymentMethodType === 'bank' ? (
                  <>
                    <span className="font-medium">Bank Account Selected</span>
                    <span className="text-xs text-green-600 ml-2">• No additional fees</span>
                  </>
                ) : (
                  <span className="font-medium">Payment method selected</span>
                )}
              </div>
            </div>

            {/* Right side - Complete booking button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  handleProceedToPayment(selectedPaymentMethodType === 'card');
                }}
                disabled={isProcessing}
                className="bg-[#0a6060] hover:bg-[#063a3a] text-white px-6 py-2"
                size="lg"
              >
                {isProcessing ? 'Processing...' : 'Complete Booking'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <EmbeddedCheckoutModal
        isOpen={showEmbeddedCheckout}
        onClose={handleCheckoutClose}
        clientSecret={checkoutClientSecret}
        amount={amount}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Payment Processing Dialog */}
      <Dialog open={showProcessingDialog} onOpenChange={(open) => {
        // Only allow closing if there's an error
        if (!open && processingStatus === 'error') {
          setShowProcessingDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processingStatus === 'processing' && 'Processing Payment'}
              {processingStatus === 'success' && 'Payment Successful!'}
              {processingStatus === 'error' && 'Payment Failed'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            {processingStatus === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-center text-gray-600">
                  Processing your payment of ${amount.toFixed(2)}...
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Please do not close this window.
                </p>
              </>
            )}
            
            {processingStatus === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-center text-gray-600">
                  Your payment has been processed successfully!
                </p>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Redirecting to confirmation...
                </p>
              </>
            )}
            
            {processingStatus === 'error' && (
              <>
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-center text-gray-600">
                  {processingError || 'Payment could not be processed.'}
                </p>
                <Button
                  onClick={() => {
                    setShowProcessingDialog(false);
                    setProcessingStatus('processing');
                    setProcessingError(null);
                  }}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};
