'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Shield, CheckCircle, Plus, Trash2, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log('🔑 Stripe publishable key available:', !!stripePublishableKey);
console.log('🔑 Stripe key starts with:', stripePublishableKey?.substring(0, 15));

// Only load Stripe if we have a valid key
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey).then(stripe => {
      console.log('🔗 Stripe loaded:', !!stripe);
      if (!stripe) {
        console.error('❌ Failed to load Stripe with key:', stripePublishableKey?.substring(0, 15));
      }
      return stripe;
    }).catch(error => {
      console.error('❌ Error loading Stripe:', error);
      return null;
    })
  : null;

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

interface PaymentMethodSelectorProps {
  matchId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentMethodFormProps extends PaymentMethodSelectorProps {
  clientSecret: string | null;
}

function PaymentMethodForm({ matchId, amount, onSuccess, onCancel, clientSecret }: PaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('🚀 Form submitted');
    console.log('Stripe available:', !!stripe);
    console.log('Elements available:', !!elements);

    if (!stripe) {
      console.error('❌ Stripe not loaded');
      toast({
        title: "Error",
        description: "Stripe not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!elements) {
      console.error('❌ Stripe Elements not loaded');
      toast({
        title: "Error", 
        description: "Payment form not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    console.log('🔄 Starting payment method setup...');

    try {
      // First validate the payment element
      const { error: validateError } = await elements.submit();
      if (validateError) {
        console.error('❌ Payment element validation failed:', validateError);
        toast({
          title: "Validation Error",
          description: `Please check your payment details: ${validateError.message}`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log('✅ Payment element validated');

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/platform/match/${matchId}/payment-success`,
        },
        redirect: 'if_required',
      });

      console.log('Setup result:', { error, setupIntent });

      if (error) {
        console.error('❌ Setup error:', error);
        toast({
          title: "Setup Failed",
          description: `Payment method setup failed: ${error.message}`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        console.log('✅ Setup intent succeeded:', setupIntent.id);
        
        // For now, we'll use a simple payment method object since we can't get details client-side
        // The actual details will be retrieved when needed for pre-authorization
        setPaymentMethod({
          id: setupIntent.payment_method,
          type: 'unknown', // Will be determined server-side
          display: { 
            type: 'Payment Method', 
            last4: '****' // We'll get real details from server during pre-auth
          }
        });

        setShowConfirmation(true);
        setIsProcessing(false);
        toast({
          title: "Success",
          description: "Payment method added successfully!",
        });
      } else {
        console.error('❌ Unexpected setup intent status:', setupIntent?.status);
        toast({
          title: "Setup Failed",
          description: "Payment setup failed with unexpected status",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('❌ Payment setup error:', err);
      toast({
        title: "Error",
        description: `Failed to set up payment method: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleConfirmPreauthorization = async () => {
    if (!paymentMethod) return;

    setIsProcessing(true);

    try {
      await savePaymentMethodToMatch(paymentMethod.id, matchId, amount);
      toast({
        title: "Success",
        description: "Payment method pre-authorized successfully!",
      });
      onSuccess();
    } catch (err) {
      console.error('Pre-authorization error:', err);
      toast({
        title: "Error",
        description: "Failed to pre-authorize payment method",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleEditPaymentMethod = () => {
    setShowConfirmation(false);
    setPaymentMethod(null);
  };

  const savePaymentMethodToMatch = async (paymentMethodId: string, matchId: string, amount: number) => {
    console.log('💾 Saving payment method:', { paymentMethodId, matchId, amount });
    
    const response = await fetch(`/api/matches/${matchId}/payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
        amount,
      }),
    });

    console.log('💾 Save response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('💾 Save failed:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to save payment method');
    }

    const result = await response.json();
    console.log('💾 Save successful:', result);
    return result;
  };

  // Show confirmation screen after payment method is added
  if (showConfirmation && paymentMethod) {
    const display = paymentMethod.display || { type: 'Payment Method', last4: '****' };
    
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Payment Method Added Successfully</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method Details</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
              {display.type.substring(0, 4).toUpperCase()}
            </div>
            <span className="text-gray-700">•••• •••• •••• {display.last4}</span>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">⚠️ Confirm Pre-Authorization</h3>
          <p className="text-orange-800 text-sm mb-3">
            Are you sure you want to pre-authorize charges of <strong>${amount.toLocaleString()}</strong> on 
            your {display.type} ending in {display.last4}?
          </p>
          <p className="text-orange-700 text-xs">
            This amount will be processed once the host signs the lease agreement. 
            No charges will be made until then.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleEditPaymentMethod}
            disabled={isProcessing}
            className="flex-1"
          >
            Use Different Method
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPreauthorization}
            disabled={isProcessing}
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            {isProcessing ? 'Authorizing...' : 'Confirm Pre-Authorization'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Secure Payment Setup</span>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          Add a credit card or bank account that will be securely saved and pre-authorized for ${amount.toLocaleString()}.
          No charges will be made until the landlord signs the lease.
        </p>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-xs">
            🐛 Debug: Stripe={!!stripe} Elements={!!elements} ClientSecret={!!clientSecret} ClientSecretValue={clientSecret?.substring(0, 20)}...
          </p>
        </div>
      )}

      <div className="payment-element-container">
        <PaymentElement 
          options={{ 
            layout: 'tabs',
            paymentMethodOrder: ['us_bank_account', 'card'],
          }}
          onReady={() => {
            console.log('✅ PaymentElement ready');
            toast({
              title: "Ready",
              description: "Payment form loaded successfully",
            });
          }}
          onChange={(event) => console.log('PaymentElement changed:', event)}
          onLoadError={(error) => {
            console.error('❌ PaymentElement load error:', error);
            toast({
              title: "Payment Form Error",
              description: `Failed to load payment form: ${error.message}`,
              variant: "destructive",
            });
          }}
        />
        
        {/* Fallback if PaymentElement doesn't render */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-700">If you don&apos;t see a payment form above, check:</p>
            <ul className="text-red-600 mt-1 ml-4 list-disc">
              <li>Client secret is valid: {clientSecret ? '✅' : '❌'}</li>
              <li>Stripe keys match environment</li>
              <li>Network connectivity to Stripe</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Add Payment Method'}
        </Button>
      </div>
    </form>
  );
}

export function PaymentMethodSelector({ matchId, amount, onSuccess, onCancel }: PaymentMethodSelectorProps) {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showNewMethodForm, setShowNewMethodForm] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingPaymentMethodId, setDeletingPaymentMethodId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch saved payment methods on component mount
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
        setSavedPaymentMethods(data.paymentMethods || []);
        
        // If no saved methods, show the form immediately
        if (!data.paymentMethods || data.paymentMethods.length === 0) {
          setShowNewMethodForm(true);
        }
      } catch (error) {
        console.error('❌ Error fetching payment methods:', error);
        // If we can't fetch, show the new method form
        setShowNewMethodForm(true);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Create setup intent when showing new method form
  useEffect(() => {
    if (!showNewMethodForm) return;

    const createSetupIntent = async () => {
      console.log('🔧 Creating setup intent for new method');
      
      try {
        const response = await fetch(`/api/matches/${matchId}/setup-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create setup intent: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        console.log('✅ Setup intent created for new method');
      } catch (error) {
        console.error('❌ Error creating setup intent:', error);
        toast({
          title: "Error",
          description: "Failed to initialize new payment method setup",
          variant: "destructive",
        });
      }
    };

    createSetupIntent();
  }, [showNewMethodForm, matchId, amount]);

  const handleUseExistingMethod = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Selection Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('💳 Using existing payment method:', selectedPaymentMethod);
      
      const response = await fetch(`/api/matches/${matchId}/payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: selectedPaymentMethod,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to authorize payment method');
      }

      const result = await response.json();
      
      toast({
        title: "Payment Authorized Successfully!",
        description: "Your payment method has been pre-authorized. Check your email for a receipt from Stripe.",
      });
      
      onSuccess();
    } catch (error) {
      console.error('❌ Error using existing payment method:', error);
      toast({
        title: "Error",
        description: `Failed to authorize payment method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const handleStripeCheckout = async (includeCardFee: boolean = true) => {
    setIsProcessing(true);
    try {
      console.log('🔗 Creating Stripe Checkout session with card fee:', includeCardFee);
      
      const response = await fetch(`/api/matches/${matchId}/create-payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, includeCardFee }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to create payment session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('❌ Error creating Stripe session:', error);
      toast({
        title: "Error",
        description: `Failed to open Stripe checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setDeletingPaymentMethodId(paymentMethodId);
    
    try {
      console.log('🗑️ Deleting payment method:', paymentMethodId);
      
      const response = await fetch(`/api/user/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to delete payment method');
      }

      // Remove from local state
      setSavedPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));
      
      // Clear selection if the deleted method was selected
      if (selectedPaymentMethod === paymentMethodId) {
        setSelectedPaymentMethod('');
      }

      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error('❌ Error deleting payment method:', error);
      toast({
        title: "Error",
        description: `Failed to delete payment method: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDeletingPaymentMethodId(null);
    }
  };

  if (isLoadingMethods) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading payment methods...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Method Setup
        </CardTitle>
        <p className="text-sm text-gray-600">
          To complete your lease, please select or add a payment method (credit card or bank account) for security deposit and rent charges.
        </p>
      </CardHeader>
      <CardContent>
        {!showNewMethodForm ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Secure Payment Setup</span>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                Select a saved payment method to pre-authorize for ${amount.toLocaleString()}, or complete payment via Stripe Checkout.
                Stripe will send you a receipt via email for any payment transaction.
              </p>
            </div>

            {/* Temporary Stripe Checkout Options */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">🧪 Temporary: Complete Payment via Stripe Checkout</h3>
              <p className="text-yellow-800 text-sm mb-4">
                Complete full payment immediately with dynamic fee calculation based on payment method.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleStripeCheckout(true)}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
                >
                  {isProcessing ? 'Opening Stripe...' : '💳 Pay with Card (includes 2.9% + 30¢ fee)'}
                </Button>
                <Button 
                  onClick={() => handleStripeCheckout(false)}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 bg-blue-100 border-blue-300 hover:bg-blue-200"
                >
                  {isProcessing ? 'Opening Stripe...' : '🏦 Pay with Bank (no extra fees)'}
                </Button>
              </div>
            </div>

            {savedPaymentMethods.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Or select a saved payment method:</h3>
                
                <div className="space-y-3">
                  {savedPaymentMethods.map((method) => {
                    const isCard = method.type === 'card';
                    const isBankAccount = method.type === 'us_bank_account';
                    
                    return (
                      <div 
                        key={method.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isCard ? (
                              <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                                {formatCardBrand(method.card?.brand || 'card')}
                              </div>
                            ) : isBankAccount ? (
                              <div className="w-8 h-6 bg-blue-100 rounded flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                                PM
                              </div>
                            )}
                            <div className="flex flex-col">
                              {isCard && method.card ? (
                                <>
                                  <span className="font-medium">•••• •••• •••• {method.card.last4}</span>
                                  <span className="text-gray-500 text-sm">
                                    Expires {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear.toString().slice(-2)}
                                  </span>
                                </>
                              ) : isBankAccount && method.us_bank_account ? (
                                <>
                                  <span className="font-medium">{method.us_bank_account.bank_name} •••• {method.us_bank_account.last4}</span>
                                  <span className="text-gray-500 text-sm capitalize">
                                    {method.us_bank_account.account_type} account
                                  </span>
                                </>
                              ) : (
                                <span className="font-medium">Payment Method</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePaymentMethod(method.id);
                            }}
                            disabled={deletingPaymentMethodId === method.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingPaymentMethodId === method.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowNewMethodForm(true)}
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Plus className="w-4 h-4" />
                      <span>Add Credit Card or Bank Account</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {savedPaymentMethods.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">No saved payment methods found.</p>
                <Button 
                  onClick={() => setShowNewMethodForm(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Credit Card or Bank Account
                </Button>
              </div>
            )}

            {savedPaymentMethods.length > 0 && (
              <div className="space-y-3">
                {/* Show action buttons based on selection */}
                {selectedPaymentMethod && selectedPaymentMethod !== 'add-new' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Ready to Process Payment</h4>
                    <p className="text-blue-800 text-sm mb-3">
                      Click "Authorize Payment" to pre-authorize your selected payment method, or add a new payment method.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleUseExistingMethod}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Authorizing...' : 'Authorize Selected Payment'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewMethodForm(true)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Payment Method
                      </Button>
                    </div>
                  </div>
                )}

                {(!selectedPaymentMethod || selectedPaymentMethod === 'add-new') && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm mb-3">
                      Select a saved payment method above, or add a new payment method.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowNewMethodForm(true)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Payment Method
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Show new payment method form
          <div className="space-y-4">
            {savedPaymentMethods.length > 0 && (
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Add Credit Card or Bank Account</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewMethodForm(false);
                    setClientSecret(null);
                  }}
                >
                  ← Back to Saved Methods
                </Button>
              </div>
            )}
            
            {stripePromise && clientSecret ? (
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe' as const },
                }}
                key={clientSecret}
              >
                <PaymentMethodForm
                  matchId={matchId}
                  amount={amount}
                  onSuccess={onSuccess}
                  onCancel={onCancel}
                  clientSecret={clientSecret}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing payment form...</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
