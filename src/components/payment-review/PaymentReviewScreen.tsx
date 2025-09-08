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
}

export const PaymentReviewScreen: React.FC<PaymentReviewScreenProps> = ({
  matchId,
  amount,
  paymentBreakdown,
  onSuccess,
  onAddPaymentMethod,
  tripStartDate,
  tripEndDate,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      <div className="flex flex-col w-full max-w-[777px] items-start gap-8 relative">
        <header className="relative self-stretch mt-[-1.00px] font-poppins font-bold text-[#1a1a1a] text-[28px] tracking-[0] leading-[33.6px]">
          REVIEW PAYMENTS
        </header>

        <PaymentMethodsSection
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={handlePaymentMethodSelect}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={isProcessing}
        />

        <Button
          variant="ghost"
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal"
          onClick={onAddPaymentMethod}
        >
          <div className="w-6 h-6 rounded-full border-2 border-teal-600 flex items-center justify-center">
            <PlusIcon className="w-4 h-4" />
          </div>
          Add New Payment Method
        </Button>

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