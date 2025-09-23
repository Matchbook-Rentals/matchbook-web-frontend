'use client';

import { CheckIcon, PlusIcon, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import BrandModal from '@/components/BrandModal';

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
  onSelectMethod: (methodId: string, methodType: 'card' | 'bank') => void;
  onProceedToPayment: (includeCardFee: boolean) => void;
  isProcessing: boolean;
  hidePaymentMethods?: boolean;
  onPaymentMethodsRefresh?: () => void;
  initialPaymentMethods?: PaymentMethod[];
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  selectedMethod,
  onSelectMethod,
  onProceedToPayment,
  isProcessing,
  hidePaymentMethods = false,
  onPaymentMethodsRefresh,
  initialPaymentMethods = [],
}) => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
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
    }, []); // Empty dependency array since the function doesn't use any external values
    
  useEffect(() => {
    // Only fetch if we don't have initial payment methods
    if (initialPaymentMethods.length === 0) {
      setIsLoading(true);
      fetchPaymentMethods();
    }
  }, [initialPaymentMethods.length, fetchPaymentMethods]);

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
  }, [onPaymentMethodsRefresh, fetchPaymentMethods]);

  // Apply hidePaymentMethods override if needed
  const displayedPaymentMethods = hidePaymentMethods ? [] : paymentMethods;

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('🗑️ [PaymentMethods] Deleting payment method:', methodToDelete.id);
      
      const response = await fetch(`/api/user/payment-methods/${methodToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [PaymentMethods] Failed to delete:', error);
        
        // Show user-friendly error message
        toast({
          title: "Error",
          description: error.details || 'Failed to delete payment method. Please try again.',
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ [PaymentMethods] Payment method deleted successfully');
      
      // Remove from local state
      setPaymentMethods(prev => prev.filter(m => m.id !== methodToDelete.id));
      
      // Clear selection if deleted method was selected
      if (selectedMethod === methodToDelete.id) {
        onSelectMethod('', 'card');
      }
      
      // Refresh payment methods
      fetchPaymentMethods();

      // Show success toast
      toast({
        title: "Success",
        description: 'Payment method deleted successfully.',
        variant: "default",
      });
      
    } catch (error) {
      console.error('💥 [PaymentMethods] Error deleting payment method:', error);
      toast({
        title: "Error",
        description: 'An error occurred while deleting the payment method. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setMethodToDelete(null);
    }
  };

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
    <>
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
        null
      ) : (
        displayedPaymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id;
        const isCard = method.type === 'card';
        const isBankAccount = method.type === 'bank';

        return (
          <Card
            key={method.id}
            className={`group w-full h-[100px] rounded-xl cursor-pointer transition-colors relative ${
              isSelected 
                ? 'bg-[#e7f0f0] border-2 border-[#0a6060]' 
                : 'bg-background border-2 border-gray-300 hover:border-[#0a6060]'
            }`}
            onClick={() => onSelectMethod(method.id, method.type)}
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

              <div className="flex items-center gap-2">
                {/* Delete button - only visible on hover, same size as checkbox */}
                <button
                  className="hidden group-hover:flex items-center justify-center w-4 h-4  bg-red-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMethodToDelete(method);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600 hover:text-black transition-all" />
                </button>
                
                {isSelected ? (
                  <div className="relative w-4 h-4 bg-[#0a6060] rounded-lg overflow-hidden border border-solid flex items-center justify-center">
                    <CheckIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : (
                  <div className="relative w-4 h-4 bg-white rounded-lg border border-solid border-[#cfd4dc]" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      }))}

      </section>

      {/* Delete Confirmation Modal */}
      <BrandModal
        isOpen={!!methodToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setMethodToDelete(null);
          }
        }}
        heightStyle="!top-[30vh]"
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Delete Payment Method
          </h2>
          
          {methodToDelete && (
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete this payment method?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-900">
                  {methodToDelete.type === 'card' 
                    ? `${capitalizeBrand(methodToDelete.brand)} ending in ${methodToDelete.lastFour}`
                    : `${methodToDelete.bankName || 'Bank'} ending in ${methodToDelete.lastFour}`
                  }
                </p>
                {methodToDelete.type === 'card' && methodToDelete.expiry && (
                  <p className="text-sm text-gray-600">Expires {methodToDelete.expiry}</p>
                )}
              </div>
              
              <p className="text-sm text-red-600">
                This action cannot be undone. You will need to add the payment method again if you want to use it in the future.
              </p>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setMethodToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeletePaymentMethod}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Payment Method'}
            </Button>
          </div>
        </div>
      </BrandModal>
    </>
  );
};
