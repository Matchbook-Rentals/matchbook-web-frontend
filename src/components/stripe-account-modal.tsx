"use client";

import React, { useState } from "react";
import BrandModal from "./BrandModal";
import { BrandButton } from "./ui/brandButton";
import { AlertTriangle } from "lucide-react";

interface StripeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StripeAccountModal: React.FC<StripeAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleFixAccount = async () => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/stripe/create-and-onboard', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Error getting Stripe URL:', data.error);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Error getting Stripe account link:', error);
      setIsRedirecting(false);
    }
  };

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <div className="flex flex-col gap-6 w-full items-center">
        <AlertTriangle className="h-10 w-10 text-yellow-600" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 font-['Poppins',Helvetica]">
            Stripe Requires More Info
          </h2>
          <p className="text-gray-600 font-['Poppins',Helvetica]">
            Your Stripe account has outstanding requirements. Please resolve them before viewing application details.
          </p>
        </div>

        <div className="flex gap-3">
          <BrandButton variant="outline" onClick={onClose} disabled={isRedirecting}>
            Close
          </BrandButton>
          <BrandButton onClick={handleFixAccount} disabled={isRedirecting} isLoading={isRedirecting}>
            {isRedirecting ? 'Redirecting...' : 'Go to Stripe'}
          </BrandButton>
        </div>
      </div>
    </BrandModal>
  );
};
