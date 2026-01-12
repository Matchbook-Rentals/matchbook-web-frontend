'use client';

import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { FieldType } from '../types';
import { Recipient } from '../RecipientManager';
import { MobileRecipientSelector } from './MobileRecipientSelector';
import { MobileFieldGrid } from './MobileFieldGrid';

interface MobileFieldDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  selectedRecipient: string | null;
  onRecipientChange: (recipientId: string) => void;
  onFieldSelect: (fieldType: FieldType, label?: string) => void;
  onAddRecipient?: () => void;
  recipientError?: string | null;
}

export const MobileFieldDrawer: React.FC<MobileFieldDrawerProps> = ({
  isOpen,
  onClose,
  recipients,
  selectedRecipient,
  onRecipientChange,
  onFieldSelect,
  onAddRecipient,
  recipientError,
}) => {
  const handleFieldSelect = (fieldType: FieldType, label?: string) => {
    onFieldSelect(fieldType, label);
    // Drawer will be closed by parent after field placement starts
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        style={{
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">Add Field</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Recipient Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to
            </label>
            <MobileRecipientSelector
              recipients={recipients}
              selectedRecipient={selectedRecipient}
              onSelect={onRecipientChange}
              onAddRecipient={onAddRecipient}
            />
            {recipientError && (
              <p className="text-sm text-red-500 mt-2">{recipientError}</p>
            )}
          </div>

          {/* Field Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Type
            </label>
            <MobileFieldGrid
              onFieldSelect={handleFieldSelect}
              selectedRecipient={selectedRecipient}
              recipients={recipients}
            />
          </div>

          {/* Instructions */}
          <p className="text-xs text-gray-500 text-center pt-2">
            Select a field type, then tap on the PDF to place it
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
