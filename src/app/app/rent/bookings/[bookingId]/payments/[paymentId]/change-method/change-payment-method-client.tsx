"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Building2, Check, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { calculateCreditCardFee } from "@/lib/payment-calculations";
import { AddPaymentMethodInline } from "@/components/stripe/add-payment-method-inline";

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  lastFour: string;
  expiry?: string;
  bankName?: string;
}

interface ChangePaymentMethodClientProps {
  paymentData: {
    paymentId: string;
    amount: number; // in cents
    dueDate: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage: string;
    currentPaymentMethodId: string | null;
  };
  bookingId: string;
  initialPaymentMethods?: PaymentMethod[];
}

export default function ChangePaymentMethodClient({
  paymentData,
  bookingId,
  initialPaymentMethods = []
}: ChangePaymentMethodClientProps) {
  const router = useRouter();
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentData.currentPaymentMethodId || ''
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ensure the current payment method is selected when component mounts or data changes
  useEffect(() => {
    if (paymentData.currentPaymentMethodId &&
        selectedMethodId !== paymentData.currentPaymentMethodId) {
      setSelectedMethodId(paymentData.currentPaymentMethodId);
    }
  }, [paymentData.currentPaymentMethodId]);

  // Calculate amounts based on selected payment method
  const selectedMethod = paymentMethods.find(pm => pm.id === selectedMethodId);
  const isUsingCard = selectedMethod?.type === 'card';

  // Check if payment method has changed
  const hasChanged = selectedMethodId !== paymentData.currentPaymentMethodId;

  // Convert cents to dollars for calculation
  const baseAmountDollars = paymentData.amount / 100;
  const creditCardFeeDollars = isUsingCard ? calculateCreditCardFee(baseAmountDollars) : 0;
  const totalAmountDollars = baseAmountDollars + creditCardFeeDollars;

  // Convert back to cents for display
  const baseAmountCents = paymentData.amount;
  const creditCardFeeCents = Math.round(creditCardFeeDollars * 100);
  const totalAmountCents = baseAmountCents + creditCardFeeCents;

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCancel = () => {
    router.push(`/app/rent/bookings/${bookingId}`);
  };

  const handleSavePaymentMethod = async () => {
    if (!selectedMethodId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/rent-payments/${paymentData.paymentId}/update-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: selectedMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment method');
      }

      // Redirect back to booking page
      router.push(`/app/rent/bookings/${bookingId}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Failed to update payment method. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPaymentMethodIcon = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
    return <Building2 className="w-5 h-5 text-gray-600" />;
  };

  const renderPaymentMethodDetails = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {method.brand?.charAt(0).toUpperCase()}{method.brand?.slice(1)} •••• {method.lastFour}
          </span>
          <span className="text-sm text-gray-500">Expires {method.expiry}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <span className="font-medium text-gray-800">
          {method.bankName || 'Bank Account'}
        </span>
        <span className="text-sm text-gray-500">••••{method.lastFour}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Header with Back and Save buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Booking
        </Button>

        <BrandButton
          onClick={handleSavePaymentMethod}
          disabled={!hasChanged || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Payment Method'}
        </BrandButton>
      </div>

      {/* Payment Methods Selection */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Select Payment Method
          </h3>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethodId(method.id)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethodId === method.id
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {renderPaymentMethodIcon(method)}
                  {renderPaymentMethodDetails(method)}
                </div>
                {selectedMethodId === method.id && (
                  <Check className="w-5 h-5 text-teal-600" />
                )}
              </div>
            ))}

            {!showAddPaymentForm && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal mt-2"
                onClick={() => {
                  setShowAddPaymentForm(true);
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
                  onSuccess={(newMethodId) => {
                    setShowAddPaymentForm(false);
                    setSelectedMethodId(newMethodId);
                    // Refresh payment methods list
                    if (window.refreshPaymentMethods) {
                      window.refreshPaymentMethods();
                    }
                    // Optionally refetch the payment methods here
                    window.location.reload();
                  }}
                  onCancel={() => setShowAddPaymentForm(false)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      {selectedMethodId && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Payment Summary
            </h3>

            <div className="space-y-3">
              {/* Base Amount */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Amount</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(baseAmountCents)}
                </span>
              </div>

              {/* Card Processing Fee */}
              {isUsingCard && (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-gray-600">Card Processing Fee</span>
                      <span className="text-xs text-gray-500">3% fee for card payments</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(creditCardFeeCents)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Due</span>
                      <span className="text-lg font-semibold text-teal-600">
                        {formatCurrency(totalAmountCents)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* No Fee for Bank Transfer */}
              {!isUsingCard && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">No processing fee for bank transfer</span>
                    <span className="text-sm font-medium">$0.00</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Due</span>
                      <span className="text-lg font-semibold text-teal-600">
                        {formatCurrency(baseAmountCents)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Info Banner */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {isUsingCard
                  ? "💳 Using a card? A 3% processing fee will be added to cover transaction costs."
                  : "🏦 Using a bank account? No processing fees - save 3%!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - Bottom */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <BrandButton
          onClick={handleSavePaymentMethod}
          disabled={!hasChanged || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Payment Method'}
        </BrandButton>
      </div>
    </div>
  );
}
