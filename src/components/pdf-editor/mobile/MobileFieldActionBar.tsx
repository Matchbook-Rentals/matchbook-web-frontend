'use client';

import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { FieldFormType, FieldType } from '../types';

interface MobileFieldActionBarProps {
  activeField: FieldFormType | null;
  onDelete: () => void;
  onAddSignDate?: () => void;
  onAddInitialDate?: () => void;
}

export const MobileFieldActionBar: React.FC<MobileFieldActionBarProps> = ({
  activeField,
  onDelete,
  onAddSignDate,
  onAddInitialDate,
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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-center gap-8 px-4 py-3">
        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:bg-gray-100 transition-colors"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-xs text-gray-600">Delete</span>
        </button>

        {/* Add date button - only for signature/initials fields */}
        {showCalendarButton && (
          <button
            onClick={handleCalendarClick}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg active:bg-gray-100 transition-colors"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-gray-600">
              {activeField.type === FieldType.SIGNATURE ? 'Sign Date' : 'Date'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
