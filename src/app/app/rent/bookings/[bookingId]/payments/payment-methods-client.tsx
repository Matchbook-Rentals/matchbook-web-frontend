"use client";

import React, { useState } from "react";
import { ArrowLeft, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentMethodsSection } from "@/components/payment-review/sections/PaymentMethodsSection";
import { AddPaymentMethodInline } from "@/components/stripe/add-payment-method-inline";

interface PaymentMethodsClientProps {
  bookingId: string;
  initialPaymentMethods?: Array<{
    id: string;
    type: 'card' | 'bank';
    brand?: string;
    lastFour: string;
    expiry?: string;
    bankName?: string;
  }>;
}

export default function PaymentMethodsClient({
  bookingId,
  initialPaymentMethods
}: PaymentMethodsClientProps) {
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  const handleSelectPaymentMethod = (methodId: string, methodType: 'card' | 'bank') => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProceedToPayment = (includeCardFee: boolean) => {
    // This is just for managing payment methods, so we don't need to proceed to payment
    console.log('Payment method selected:', selectedPaymentMethod);
  };

  const handleBackToBooking = () => {
    router.push(`/app/rent/bookings/${bookingId}`);
  };

  return (
    <div className="flex flex-col w-full rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={handleBackToBooking}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Button>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Manage Payment Methods
        </h2>

        <PaymentMethodsSection
          selectedMethod={selectedPaymentMethod}
          onSelectMethod={handleSelectPaymentMethod}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={false}
          hidePaymentMethods={false}
          initialPaymentMethods={initialPaymentMethods}
          onPaymentMethodsRefresh={() => {
            // This callback enables the window.refreshPaymentMethods function
          }}
        />

        {!showAddPaymentForm && (
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal mt-4"
            onClick={() => {
              setShowAddPaymentForm(true);
              // Scroll to bottom after a brief delay to allow form to render
              setTimeout(() => {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });
              }, 100);
            }}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-teal-600 flex items-center justify-center">
              <PlusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            Add New Payment Method
          </Button>
        )}

        {showAddPaymentForm && (
          <div className="mt-4 min-h-[600px]">
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
          </div>
        )}
      </div>
    </div>
  );
}
