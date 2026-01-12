'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFieldFABProps {
  onClick: () => void;
  isPlacingField: boolean;
  disabled?: boolean;
  showFooter?: boolean;
}

export const MobileFieldFAB: React.FC<MobileFieldFABProps> = ({
  onClick,
  isPlacingField,
  disabled = false,
  showFooter = true,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isPlacingField ? 'Cancel field placement' : 'Add field'}
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'w-14 h-14 rounded-full shadow-lg',
        'transition-all duration-200 ease-in-out',
        'active:scale-95',
        // Brand colors
        isPlacingField
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-[#3c8787] hover:bg-[#2d6666]',
        // Pulse animation when placing
        isPlacingField && 'animate-pulse',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      style={{
        right: '16px',
        bottom: showFooter
          ? 'calc(80px + 16px + env(safe-area-inset-bottom))'
          : 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      {isPlacingField ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <Plus className="w-6 h-6 text-white" />
      )}
    </button>
  );
};
