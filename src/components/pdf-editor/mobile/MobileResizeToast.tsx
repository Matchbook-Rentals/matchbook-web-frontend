'use client';

import React from 'react';
import { X } from 'lucide-react';

interface MobileResizeToastProps {
  onCancel: () => void;
}

export const MobileResizeToast: React.FC<MobileResizeToastProps> = ({
  onCancel,
}) => {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#3c8787] text-white shadow-lg"
      style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
      }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">
          Drag corners to resize field
        </p>
      </div>
      <button
        onClick={onCancel}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors ml-3"
        aria-label="Exit resize mode"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
