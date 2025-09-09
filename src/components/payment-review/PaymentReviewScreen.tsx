'use client';

import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PaymentMethodsSection } from './sections/PaymentMethodsSection';
import { TotalDueSection } from './sections/TotalDueSection';
import { UpcomingPaymentsSection } from './sections/UpcomingPaymentsSection';
import { SecurityDepositPolicySection } from './sections/SecurityDepositPolicySection';
import { CancellationPolicySection } from './sections/CancellationPolicySection';
import { EmbeddedCheckoutModal } from '@/components/stripe/embedded-checkout-modal';
import { AddPaymentMethodInline } from '@/components/stripe/add-payment-method-inline';

interface PaymentReviewScreenProps {
  matchId: string;
  amount: number;
  paymentBreakdown: {
    monthlyRent: number;
    securityDeposit: number;
    petDeposit?: number;
    serviceFee: number;
    processingFee?: number;
    total: number;
  };
  onSuccess: () => void;
  onAddPaymentMethod?: () => void;
  tripStartDate: Date;
  tripEndDate: Date;
  hidePaymentMethods?: boolean;
}

export const PaymentReviewScreen: React.FC<PaymentReviewScreenProps> = ({
  matchId,
  amount,
  paymentBreakdown,
  onSuccess,
  onAddPaymentMethod,
  tripStartDate,
  tripEndDate,
  hidePaymentMethods = false,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProceedToPayment = async (includeCardFee: boolean) => {
    setIsProcessing(true);
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
      setIsProcessing(false);
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

  return (
    <>
      <div className="flex flex-col w-full max-w-3xl items-start gap-6 md:gap-8 relative">
        <header className="relative self-stretch mt-[-1.00px] font-poppins font-bold text-[#1a1a1a] text-2xl md:text-3xl tracking-[0] leading-tight">
          REVIEW PAYMENTS
        </header>

        <PaymentMethodsSection
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={handlePaymentMethodSelect}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={isProcessing}
          hidePaymentMethods={hidePaymentMethods}
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

        <TotalDueSection paymentBreakdown={paymentBreakdown} />
        <UpcomingPaymentsSection 
          monthlyRent={paymentBreakdown.monthlyRent}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
        />
        <SecurityDepositPolicySection />
        <CancellationPolicySection />
      </div>

      <EmbeddedCheckoutModal
        isOpen={showEmbeddedCheckout}
        onClose={handleCheckoutClose}
        clientSecret={checkoutClientSecret}
        amount={amount}
        onSuccess={handleCheckoutSuccess}
      />

    </>
  );
};