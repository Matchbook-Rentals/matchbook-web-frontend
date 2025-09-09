'use client';

import { CheckIcon, PlusIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Extend window interface for payment method refresh
declare global {
  interface Window {
    refreshPaymentMethods?: () => void;
  }
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  lastFour: string;
  expiry?: string;
  bankName?: string;
}

interface PaymentMethodsSectionProps {
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  onProceedToPayment: (includeCardFee: boolean) => void;
  isProcessing: boolean;
  hidePaymentMethods?: boolean;
  onPaymentMethodsRefresh?: () => void;
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  selectedMethod,
  onSelectMethod,
  onProceedToPayment,
  isProcessing,
  hidePaymentMethods = false,
  onPaymentMethodsRefresh,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentMethods = async () => {
      try {
        console.log('💳 [PaymentMethods] Fetching payment methods...');
        const response = await fetch('/api/user/payment-methods');
        
        console.log('📥 [PaymentMethods] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [PaymentMethods] Failed to fetch:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          throw new Error(`Failed to fetch payment methods: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('💳 [PaymentMethods] Fetched payment methods:', {
          count: data.paymentMethods?.length || 0,
          methods: data.paymentMethods,
        });
        
        // Transform the API response to match our interface
        const formattedMethods = data.paymentMethods?.map((pm: any) => {
          if (pm.type === 'card') {
            return {
              id: pm.id,
              type: 'card' as const,
              brand: pm.card.brand,
              lastFour: pm.card.last4,
              expiry: `${String(pm.card.expMonth).padStart(2, '0')}/${pm.card.expYear}`,
            };
          } else if (pm.type === 'us_bank_account') {
            return {
              id: pm.id,
              type: 'bank' as const,
              bankName: pm.us_bank_account.bank_name,
              lastFour: pm.us_bank_account.last4,
            };
          }
          return null;
        }).filter(Boolean) || [];
        
        console.log('✅ [PaymentMethods] Formatted methods:', formattedMethods);
        setPaymentMethods(formattedMethods);
      } catch (error) {
        console.error('💥 [PaymentMethods] Failed to fetch payment methods:', error);
        // Fallback to empty array on error
        setPaymentMethods([]);
      } finally {
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handlePaymentMethodAdded = () => {
    console.log('🆕 [PaymentMethods] Payment method added, refreshing list...');
    // Refresh the payment methods list
    fetchPaymentMethods();
    // Call parent refresh callback if provided
    if (onPaymentMethodsRefresh) {
      console.log('🔄 [PaymentMethods] Calling parent refresh callback');
      onPaymentMethodsRefresh();
    }
  };

  // Expose the refresh function via useEffect
  useEffect(() => {
    if (onPaymentMethodsRefresh) {
      // This is a bit of a hack but allows parent to trigger refresh
      window.refreshPaymentMethods = fetchPaymentMethods;
    }
    return () => {
      if (window.refreshPaymentMethods) {
        delete window.refreshPaymentMethods;
      }
    };
  }, [onPaymentMethodsRefresh]);

  // Apply hidePaymentMethods override if needed
  const displayedPaymentMethods = hidePaymentMethods ? [] : paymentMethods;

  // Helper function to capitalize brand names properly
  const capitalizeBrand = (brand?: string) => {
    if (!brand) return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  const getCardLogo = (brand?: string, type?: string) => {
    // For now, return a simple text placeholder
    // In production, you'd use actual logo images
    if (type === 'bank') {
      return (
        <div className="absolute w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-gray-600">BANK</span>
        </div>
      );
    }
    
    return (
      <div className="absolute w-8 h-2.5 top-[11px] left-1.5 bg-blue-600 rounded-sm flex items-center justify-center">
        <span className="text-white text-[8px] font-bold">
          {brand?.toUpperCase() || 'CARD'}
        </span>
      </div>
    );
  };

  return (
    <section className="flex-col items-start gap-4 md:gap-5 self-stretch w-full flex-[0_0_auto] flex relative">
      <div className="flex flex-col w-full items-start gap-2 relative">
        <h2 className="relative self-stretch mt-[-1.00px] font-poppins font-semibold text-[#1a1a1a] text-lg md:text-xl tracking-[0] leading-tight">
          Payment Methods
        </h2>
        <p className="relative self-stretch font-poppins font-normal text-[#333333] text-sm md:text-base tracking-[0] leading-relaxed">
          Select bank transfer at no cost or pay by card for a 3% processing fee
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading payment methods...</div>
        </div>
      ) : displayedPaymentMethods.length === 0 ? (
        <div className="flex items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No payment methods found</p>
            <p className="text-sm text-gray-400">Add a payment method to continue</p>
          </div>
        </div>
      ) : (
        displayedPaymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id;
        const isCard = method.type === 'card';
        const isBankAccount = method.type === 'bank';

        return (
          <Card
            key={method.id}
            className={`w-full h-[100px] rounded-xl cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-[#e7f0f0] border-2 border-[#0a6060]' 
                : 'bg-background border-2 border-gray-300 hover:border-[#0a6060]'
            }`}
            onClick={() => onSelectMethod(method.id)}
          >
            <CardContent className="flex items-start gap-1 p-4 h-full">
              <div className="flex items-start gap-3 relative flex-1 grow">
                <div className="relative w-[46px] h-8 bg-white rounded-md border border-solid border-[#f2f3f6]">
                  {getCardLogo(method.brand, method.type)}
                </div>

                <div className="flex flex-col items-start gap-2 relative flex-1 grow">
                  <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                    <div className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#063a3a] text-sm tracking-[0] leading-5">
                      {isCard 
                        ? `${capitalizeBrand(method.brand)} Ending in ${method.lastFour}`
                        : `${method.bankName || 'Bank'} Ending in ${method.lastFour}`
                      }
                    </div>

                    <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-[#0a6060] text-sm tracking-[0] leading-5">
                      {isCard && method.expiry
                        ? `Expiry ${method.expiry}`
                        : 'Bank Account'
                      }
                    </div>
                  </div>

                  <div className="inline-flex items-start gap-3 relative flex-[0_0_auto]">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]"
                    >
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#0a6060] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Set as default
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-auto p-0 inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]"
                    >
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#0a6060] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Edit
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              {isSelected ? (
                <div className="relative w-4 h-4 bg-[#0a6060] rounded-lg overflow-hidden border border-solid flex items-center justify-center">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </div>
              ) : (
                <div className="relative w-4 h-4 bg-white rounded-lg border border-solid border-[#cfd4dc]" />
              )}
            </CardContent>
          </Card>
        );
      }))}


      {selectedMethod && (
        <div className="flex gap-3 mt-4 w-full">
          <Button
            onClick={() => {
              const method = displayedPaymentMethods.find(m => m.id === selectedMethod);
              onProceedToPayment(method?.type === 'card');
            }}
            disabled={isProcessing}
            className="flex-1 bg-[#0a6060] hover:bg-[#063a3a] text-white"
          >
            {isProcessing ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      )}

    </section>
  );
};
