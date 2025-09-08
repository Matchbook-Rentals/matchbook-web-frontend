'use client';

import { CheckIcon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  selectedMethod,
  onSelectMethod,
  onProceedToPayment,
  isProcessing,
}) => {
  // Mock payment methods for now - these would come from Stripe
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card_1',
      type: 'card',
      brand: 'Visa',
      lastFour: '1234',
      expiry: '06/2024',
    },
    {
      id: 'bank_1',
      type: 'bank',
      bankName: 'Chase Bank',
      lastFour: '5678',
    },
  ];

  const getCardLogo = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return (
          <div className="w-8 h-2.5 bg-blue-600 rounded-sm flex items-center justify-center text-white text-[8px] font-bold">
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-[30px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-[22px] h-[22px] bg-yellow-400 rounded-full -ml-2"></div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-5 bg-gray-400 rounded-sm flex items-center justify-center text-white text-[8px] font-bold">
            CARD
          </div>
        );
    }
  };

  return (
    <section className="flex-col items-start gap-5 self-stretch w-full flex-[0_0_auto] flex relative">
      <div className="flex flex-col w-full items-start gap-2 relative">
        <h2 className="relative self-stretch mt-[-1.00px] font-poppins font-semibold text-[#1a1a1a] text-xl tracking-[0] leading-[24.0px]">
          Payment Methods
        </h2>
        <p className="relative self-stretch font-poppins font-normal text-[#333333] text-base tracking-[0] leading-[19.2px]">
          Select bank transfer at no cost or pay by card for a 3% processing fee
        </p>
      </div>

      {paymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id;
        const isCard = method.type === 'card';
        const isBankAccount = method.type === 'bank';

        return (
          <Card
            key={method.id}
            className={`flex h-[100px] items-start gap-1 p-4 relative self-stretch w-full rounded-xl cursor-pointer transition-all ${
              isSelected 
                ? 'bg-[#e7f0f0] border-2 border-[#0a6060]' 
                : 'bg-white border border-[#d9dadf] hover:border-[#0a6060]'
            }`}
            onClick={() => onSelectMethod(method.id)}
          >
            <CardContent className="flex items-start gap-3 relative flex-1 grow p-0">
              <div className="relative w-[46px] h-8 bg-white rounded-md border border-solid border-[#f2f3f6] flex items-center justify-center">
                {isCard ? (
                  getCardLogo(method.brand)
                ) : (
                  <div className="text-[10px] font-bold text-gray-600">BANK</div>
                )}
              </div>

              <div className="flex-col items-start gap-2 flex relative flex-1 grow">
                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                  <div className={`self-stretch font-medium relative mt-[-1.00px] font-poppins text-sm tracking-[0] leading-5 ${
                    isSelected ? 'text-[#063a3a]' : 'text-gray-700'
                  }`}>
                    {isCard 
                      ? `${method.brand} ending in ${method.lastFour}`
                      : `${method.bankName} ending in ${method.lastFour}`
                    }
                  </div>

                  <div className={`relative self-stretch font-poppins font-normal text-sm tracking-[0] leading-5 ${
                    isSelected ? 'text-[#0a6060]' : 'text-gray-600'
                  }`}>
                    {isCard && method.expiry
                      ? `Expiry ${method.expiry}`
                      : 'Bank Account'
                    }
                  </div>
                </div>

                <div className="inline-flex items-start gap-3 relative flex-[0_0_auto]">
                  <Button
                    variant="ghost"
                    className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] h-auto p-0 hover:bg-transparent"
                  >
                    <span className={`relative w-fit mt-[-1.00px] font-poppins font-semibold text-sm tracking-[0] leading-5 whitespace-nowrap ${
                      isSelected ? 'text-[#0a6060]' : 'text-gray-600'
                    }`}>
                      Set as default
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] h-auto p-0 hover:bg-transparent"
                  >
                    <span className="relative w-fit mt-[-1.00px] font-poppins font-semibold text-sm tracking-[0] leading-5 whitespace-nowrap text-[#0a6060]">
                      Edit
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>

            {isSelected ? (
              <div className="relative w-4 h-4 bg-[#0a6060] rounded-lg overflow-hidden border border-solid flex items-center justify-center">
                <CheckIcon className="w-2.5 h-2.5 text-white" />
              </div>
            ) : (
              <div className="relative w-4 h-4 bg-white rounded-lg border border-solid border-[#cfd4dc]" />
            )}
          </Card>
        );
      })}

      {selectedMethod && (
        <div className="flex gap-3 mt-4 w-full">
          <Button
            onClick={() => {
              const method = paymentMethods.find(m => m.id === selectedMethod);
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