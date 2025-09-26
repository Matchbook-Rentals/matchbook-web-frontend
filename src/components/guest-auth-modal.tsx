'use client';

import React from 'react';
import BrandModal from '@/components/BrandModal';
import { BrandButton } from '@/components/ui/brandButton';

interface GuestAuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GuestAuthModal: React.FC<GuestAuthModalProps> = ({
  isOpen,
  onOpenChange
}) => {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSignIn = () => {
    const currentPath = window.location.pathname;
    const redirectUrl = encodeURIComponent(currentPath);
    window.location.href = `/sign-in?redirect_url=${redirectUrl}`;
  };

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      heightStyle="!top-[30vh]"
      className="max-w-md"
    >
      <div className="px-6">
        <h3 className="text-lg font-semibold mb-4">Sign in required</h3>
        <p className="text-gray-600 mb-6">
          In order to apply to a listing you must be signed in and create an application. Please sign in to continue.
        </p>
        <div className="flex gap-3">
          <BrandButton
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </BrandButton>
          <BrandButton
            variant="default"
            onClick={handleSignIn}
            className="flex-1"
          >
            Sign In
          </BrandButton>
        </div>
      </div>
    </BrandModal>
  );
};

export default GuestAuthModal;
