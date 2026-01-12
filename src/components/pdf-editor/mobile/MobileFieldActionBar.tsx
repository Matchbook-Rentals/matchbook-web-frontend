'use client';

import React from 'react';
import { Trash2, Calendar, Type, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType } from '../types';

// Field types that can be configured with label/default value
const CONFIGURABLE_TYPES = [
  FieldType.TEXT,
  FieldType.NUMBER,
  FieldType.EMAIL,
  FieldType.NAME,
  FieldType.DATE,
];

interface MobileFieldActionBarProps {
  activeField: FieldFormType | null;
  onDelete: () => void;
  onAddSignDate?: () => void;
  onAddInitialDate?: () => void;
  onConfigure?: () => void;
  isResizing?: boolean;
  onToggleResize?: () => void;
  showFooter?: boolean;
}

export const MobileFieldActionBar: React.FC<MobileFieldActionBarProps> = ({
  activeField,
  onDelete,
  onAddSignDate,
  onAddInitialDate,
  onConfigure,
  isResizing = false,
  onToggleResize,
  showFooter = true,
}) => {
  if (!activeField) return null;

  const showCalendarButton =
    (activeField.type === FieldType.SIGNATURE && onAddSignDate) ||
    (activeField.type === FieldType.INITIALS && onAddInitialDate);

  const showConfigButton =
    CONFIGURABLE_TYPES.includes(activeField.type) && onConfigure;

  const handleCalendarClick = () => {
    if (activeField.type === FieldType.SIGNATURE) {
      onAddSignDate?.();
    } else if (activeField.type === FieldType.INITIALS) {
      onAddInitialDate?.();
    }
  };

  const baseBottom = showFooter
    ? 'calc(80px + 16px + env(safe-area-inset-bottom))'
    : 'calc(16px + env(safe-area-inset-bottom))';

  return (
    <>
      {/* Delete button - left side */}
      <button
        onClick={onDelete}
        aria-label="Delete field"
        className={cn(
          'fixed z-50 flex items-center justify-center',
          'w-14 h-14 rounded-full shadow-lg',
          'transition-all duration-200 ease-in-out',
          'active:scale-95',
          'bg-red-500 hover:bg-red-600',
        )}
        style={{
          left: '16px',
          bottom: baseBottom,
        }}
      >
        <Trash2 className="w-6 h-6 text-white" />
      </button>

      {/* Add date button - for signature/initials */}
      {showCalendarButton && (
        <button
          onClick={handleCalendarClick}
          aria-label={activeField.type === FieldType.SIGNATURE ? 'Add sign date' : 'Add date'}
          className={cn(
            'fixed z-50 flex items-center justify-center',
            'w-14 h-14 rounded-full shadow-lg',
            'transition-all duration-200 ease-in-out',
            'active:scale-95',
            'bg-white border-2 border-[#3c8787] hover:bg-[#3c8787]/10',
          )}
          style={{
            right: 'calc(16px + 56px + 12px + 56px + 12px)', // Second slot from FAB
            bottom: baseBottom,
          }}
        >
          <Calendar className="w-6 h-6 text-[#3c8787]" />
        </button>
      )}

      {/* Configure button - for text/number/email/name/date fields */}
      {showConfigButton && (
        <button
          onClick={onConfigure}
          aria-label="Configure field"
          className={cn(
            'fixed z-50 flex items-center justify-center',
            'w-14 h-14 rounded-full shadow-lg',
            'transition-all duration-200 ease-in-out',
            'active:scale-95',
            'bg-white border-2 border-[#3c8787] hover:bg-[#3c8787]/10',
          )}
          style={{
            right: 'calc(16px + 56px + 12px + 56px + 12px)', // Second slot from FAB
            bottom: baseBottom,
          }}
        >
          <Type className="w-6 h-6 text-[#3c8787]" />
        </button>
      )}

      {/* Resize button - always available, closest to FAB */}
      {onToggleResize && (
        <button
          onClick={onToggleResize}
          aria-label={isResizing ? 'Exit resize mode' : 'Resize field'}
          className={cn(
            'fixed z-50 flex items-center justify-center',
            'w-14 h-14 rounded-full shadow-lg',
            'transition-all duration-200 ease-in-out',
            'active:scale-95',
            isResizing
              ? 'bg-[#3c8787] hover:bg-[#2d6666]' // Filled when active
              : 'bg-white border-2 border-[#3c8787] hover:bg-[#3c8787]/10', // Outline when inactive
          )}
          style={{
            right: 'calc(16px + 56px + 12px)', // First slot from FAB
            bottom: baseBottom,
          }}
        >
          <Maximize2 className={cn('w-6 h-6', isResizing ? 'text-white' : 'text-[#3c8787]')} />
        </button>
      )}
    </>
  );
};
