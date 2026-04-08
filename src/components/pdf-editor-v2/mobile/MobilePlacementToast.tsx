'use client';

import React from 'react';
import { X } from 'lucide-react';
import { FieldType, FRIENDLY_FIELD_TYPE } from '../types';

interface MobilePlacementToastProps {
  fieldType: FieldType;
  recipientName: string;
  onCancel: () => void;
}

export const MobilePlacementToast: React.FC<MobilePlacementToastProps> = ({
  fieldType,
  recipientName,
  onCancel,
}) => {
  const fieldName = FRIENDLY_FIELD_TYPE[fieldType] || 'Field';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-[#3c8787] text-white shadow-lg"
      style={{
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
      }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">
          Tap to place {recipientName} {fieldName}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors ml-3"
        aria-label="Cancel placement"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
