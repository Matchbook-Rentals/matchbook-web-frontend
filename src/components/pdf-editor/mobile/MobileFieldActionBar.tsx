'use client';

import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType } from '../types';

interface MobileFieldActionBarProps {
  activeField: FieldFormType | null;
  onDelete: () => void;
  onAddSignDate?: () => void;
  onAddInitialDate?: () => void;
  showFooter?: boolean;
}

export const MobileFieldActionBar: React.FC<MobileFieldActionBarProps> = ({
  activeField,
  onDelete,
  onAddSignDate,
  onAddInitialDate,
  showFooter = true,
}) => {
  if (!activeField) return null;

  const showCalendarButton =
    (activeField.type === FieldType.SIGNATURE && onAddSignDate) ||
    (activeField.type === FieldType.INITIALS && onAddInitialDate);

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

      {/* Add date button - next to FAB (left of it) */}
      {showCalendarButton && (
        <button
          onClick={handleCalendarClick}
          aria-label={activeField.type === FieldType.SIGNATURE ? 'Add sign date' : 'Add date'}
          className={cn(
            'fixed z-50 flex items-center justify-center',
            'w-14 h-14 rounded-full shadow-lg',
            'transition-all duration-200 ease-in-out',
            'active:scale-95',
            'bg-blue-500 hover:bg-blue-600',
          )}
          style={{
            right: 'calc(16px + 56px + 12px)', // FAB width + gap
            bottom: baseBottom,
          }}
        >
          <Calendar className="w-6 h-6 text-white" />
        </button>
      )}
    </>
  );
};
