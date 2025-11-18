'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, Building2, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { BrandButton } from '@/components/ui/brandButton';
import { Card, CardContent } from '@/components/ui/card';
import { AddPaymentMethodCardOnly } from '@/components/stripe/add-payment-method-card-only';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'us_bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  us_bank_account?: {
    bank_name: string;
    last4: string;
    account_type: string;
  };
  created: number;
}

interface VerificationPaymentSelectorProps {
  formData: any;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  onPaymentMethodReady?: (canPay: boolean, payFn: () => void) => void;
}

export const VerificationPaymentSelector = ({
  formData,
  onPaymentSuccess,
  onCancel,
  onPaymentMethodReady,
}: VerificationPaymentSelectorProps) => {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingPaymentMethodId, setDeletingPaymentMethodId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = useState(false);

  // Fetch saved payment methods on mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        console.log('💳 Fetching saved payment methods...');
        const response = await fetch('/api/user/payment-methods');

        if (!response.ok) {
          throw new Error('Failed to fetch payment methods');
        }

        const data = await response.json();
        console.log('💳 Fetched payment methods:', data.paymentMethods);

        // Filter to card payment methods only (exclude ACH/bank accounts)
        const cardOnlyMethods = (data.paymentMethods || []).filter(pm => pm.type === 'card');
        setSavedPaymentMethods(cardOnlyMethods);

        // If no saved card methods, show the form immediately
        if (!cardOnlyMethods || cardOnlyMethods.length === 0) {
          setShowAddNewForm(true);
        }
      } catch (error) {
        console.error('❌ Error fetching payment methods:', error);
        // If we can't fetch, show the new method form
        setShowAddNewForm(true);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Notify parent when payment method selection changes
  useEffect(() => {
    if (onPaymentMethodReady) {
      const canPay = !showAddNewForm && !!selectedPaymentMethod && !isProcessing;
      onPaymentMethodReady(canPay, handleUseExistingMethod);
    }
  }, [selectedPaymentMethod, showAddNewForm, isProcessing, onPaymentMethodReady]);

  // Handle clicking "Add New Payment Method" - creates setup intent on-demand
  const handleAddNewPaymentMethod = async () => {
    setIsCreatingSetupIntent(true);
    setErrorMessage(null);

    try {
      console.log('🔧 Creating setup intent for new payment method');

      // Save form data to localStorage for later retrieval
      localStorage.setItem('verificationFormData', JSON.stringify(formData));

      const response = await fetch('/api/create-payment-intent/background-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create setup intent' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setShowAddNewForm(true);
      console.log('✅ Setup intent created');
    } catch (error) {
      console.error('❌ Error creating setup intent:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize payment form';
      setErrorMessage(errorMsg);
      // Don't show the form if setup intent creation failed
      setShowAddNewForm(false);
    } finally {
      setIsCreatingSetupIntent(false);
    }
  };

  // Poll for payment status
  const pollPaymentStatus = async (paymentIntentId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let pollCount = 0;
      const maxPolls = 40; // 40 polls * 3 seconds = 2 minutes max

      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          console.log(`🔍 Polling payment status (${pollCount}/${maxPolls})...`);

          const response = await fetch(`/api/verification/payment-status?paymentIntentId=${paymentIntentId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to check payment status');
          }

          console.log('📊 Payment status:', data.status);

          // For ACH/bank transfers, 'processing' means the payment was initiated successfully
          // It will eventually settle, but we can proceed with the flow
          if (data.status === 'succeeded' || data.status === 'processing') {
            clearInterval(pollInterval);
            console.log('✅ Payment succeeded or processing (ACH)');
            resolve(true);
          } else if (data.status === 'canceled' || data.status === 'failed' || data.status === 'requires_payment_method') {
            clearInterval(pollInterval);
            console.error('❌ Payment failed, canceled, or requires new payment method');
            setErrorMessage(data.error || 'Payment failed. Please try a different payment method.');
            resolve(false);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.error('❌ Payment polling timeout');
            setErrorMessage('Payment is taking longer than expected. Please check back later.');
            resolve(false);
          }
          // Continue polling for requires_action and other intermediate states
        } catch (error) {
          console.error('❌ Error polling payment status:', error);
          clearInterval(pollInterval);
          setErrorMessage('Failed to check payment status');
          resolve(false);
        }
      }, 3000); // Poll every 3 seconds
    });
  };

  // Handle using an existing saved payment method
  const handleUseExistingMethod = async () => {
    if (!selectedPaymentMethod) {
      setErrorMessage('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      console.log('💳 Creating payment intent with saved method:', selectedPaymentMethod);

      // Step 1: Create payment intent
      const response = await fetch('/api/verification/charge-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: selectedPaymentMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = data;

      if (!clientSecret) {
        throw new Error('No client secret returned from server');
      }

      console.log('✅ Payment intent created, confirming with Stripe...');

      // Step 2: Confirm payment with Stripe (handles 3D Secure if needed)
      if (!stripePromise) {
        throw new Error('Stripe not loaded');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/app/rent/verification`,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      console.log('✅ Payment confirmed, starting polling...');

      // Step 3: Poll for payment status
      const success = await pollPaymentStatus(paymentIntentId);

      if (success) {
        console.log('✅ Payment successful');
        onPaymentSuccess();
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  // Handle new payment method added - just save it, don't charge yet
  const handleNewPaymentMethodAdded = async (paymentMethodId: string) => {
    console.log('✅ New payment method saved:', paymentMethodId);

    try {
      // Refresh the payment methods list to include the newly saved method
      const response = await fetch('/api/user/payment-methods');

      if (!response.ok) {
        throw new Error('Failed to refresh payment methods');
      }

      const data = await response.json();
      const cardOnlyMethods = (data.paymentMethods || []).filter(pm => pm.type === 'card');
      setSavedPaymentMethods(cardOnlyMethods);

      // Auto-select the newly added payment method
      setSelectedPaymentMethod(paymentMethodId);

      // Hide the add new form
      setShowAddNewForm(false);
      setClientSecret(null);

      console.log('✅ Payment method ready to use. User can now click "Pay $25.00" to charge.');
    } catch (error) {
      console.error('❌ Error refreshing payment methods:', error);
      // Even if refresh fails, try to proceed
      setShowAddNewForm(false);
      setSelectedPaymentMethod(paymentMethodId);
    }
  };

  // Handle deleting a payment method
  const handleDeletePaymentMethod = async (paymentMethodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPaymentMethodId(paymentMethodId);

    try {
      console.log('🗑️ Deleting payment method:', paymentMethodId);

      const response = await fetch(`/api/user/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      // Remove from local state
      setSavedPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));

      // Clear selection if the deleted method was selected
      if (selectedPaymentMethod === paymentMethodId) {
        setSelectedPaymentMethod('');
      }

      console.log('✅ Payment method deleted');
    } catch (error) {
      console.error('❌ Error deleting payment method:', error);
      setErrorMessage('Failed to delete payment method');
    } finally {
      setDeletingPaymentMethodId(null);
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  // Loading state
  if (isLoadingMethods) {
    return (
      <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
        <CardContent className="flex justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#3c8787]" />
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm">
              Loading payment methods...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show add new payment method form
  if (showAddNewForm) {
    return (
      <div className="flex flex-col w-full gap-6">
        {errorMessage && (
          <div className="[font-family:'Poppins',Helvetica] font-normal text-red-600 text-sm">
            {errorMessage}
          </div>
        )}

        {!clientSecret ? (
          <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
            <CardContent className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787]"></div>
            </CardContent>
          </Card>
        ) : (
          <AddPaymentMethodCardOnly
            clientSecret={clientSecret}
            onSuccess={handleNewPaymentMethodAdded}
            onCancel={() => {
              if (savedPaymentMethods.length > 0) {
                setShowAddNewForm(false);
                setClientSecret(null);
              } else {
                onCancel();
              }
            }}
          />
        )}
      </div>
    );
  }

  // Show saved payment methods selection
  return (
    <div className="flex flex-col w-full gap-6">
      {errorMessage && (
        <div className="[font-family:'Poppins',Helvetica] font-normal text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <Card className="w-full rounded-2xl border border-solid border-[#cfd4dc]">
        <CardContent className="p-8">
          <div className="flex flex-col gap-4">
            <h3 className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base">
              Select a saved payment method
            </h3>

            <div className="space-y-3">
              {savedPaymentMethods.map((method) => {
                const isCard = method.type === 'card';
                const isBankAccount = method.type === 'us_bank_account';
                const isSelected = selectedPaymentMethod === method.id;

                return (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#3c8787] bg-[#e7f0f0]'
                        : 'border-[#cfd4dc] hover:border-[#3c8787]'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCard ? (
                          <CreditCard className="w-5 h-5 text-[#5d606d]" />
                        ) : isBankAccount ? (
                          <Building2 className="w-5 h-5 text-[#5d606d]" />
                        ) : null}
                        <div className="flex flex-col">
                          {isCard && method.card ? (
                            <>
                              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-sm">
                                {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                              </span>
                              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-xs">
                                Expires {method.card.expMonth.toString().padStart(2, '0')}/
                                {method.card.expYear.toString().slice(-2)}
                              </span>
                            </>
                          ) : isBankAccount && method.us_bank_account ? (
                            <>
                              <span className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-sm">
                                {method.us_bank_account.bank_name} •••• {method.us_bank_account.last4}
                              </span>
                              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-xs capitalize">
                                {method.us_bank_account.account_type} account
                              </span>
                            </>
                          ) : (
                            <span className="[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-sm">
                              Payment Method
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeletePaymentMethod(method.id, e)}
                        disabled={deletingPaymentMethodId === method.id}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        {deletingPaymentMethodId === method.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add new payment method button */}
              <div
                className={`border-2 border-dashed border-[#cfd4dc] rounded-lg p-4 cursor-pointer hover:border-[#3c8787] transition-colors ${
                  isCreatingSetupIntent ? 'opacity-50 cursor-wait' : ''
                }`}
                onClick={isCreatingSetupIntent ? undefined : handleAddNewPaymentMethod}
              >
                <div className="flex items-center justify-center gap-2 text-[#5d606d]">
                  {isCreatingSetupIntent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-sm">
                    {isCreatingSetupIntent ? 'Loading...' : 'Add New Payment Method'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
