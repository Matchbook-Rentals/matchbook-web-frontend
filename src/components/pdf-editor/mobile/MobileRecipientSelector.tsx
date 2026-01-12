'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { Recipient } from '../RecipientManager';
import { getRecipientColor } from '../recipient-colors';

interface MobileRecipientSelectorProps {
  recipients: Recipient[];
  selectedRecipient: string | null;
  onSelect: (recipientId: string) => void;
  onAddRecipient?: () => void;
}

export const MobileRecipientSelector: React.FC<MobileRecipientSelectorProps> = ({
  recipients,
  selectedRecipient,
  onSelect,
  onAddRecipient,
}) => {
  const selectedRecipientData = recipients.find((r) => r.id === selectedRecipient);

  const handleValueChange = (value: string) => {
    if (value === '__add_recipient__') {
      onAddRecipient?.();
    } else {
      onSelect(value);
    }
  };

  return (
    <Select value={selectedRecipient || undefined} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full min-h-[44px]">
        <SelectValue placeholder="Select recipient">
          {selectedRecipientData && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: selectedRecipientData.color || getRecipientColor(
                    recipients.findIndex((r) => r.id === selectedRecipientData.id)
                  ),
                }}
              />
              <span>{selectedRecipientData.title || selectedRecipientData.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {recipients.map((recipient, index) => (
          <SelectItem key={recipient.id} value={recipient.id} className="min-h-[44px]">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: recipient.color || getRecipientColor(index),
                }}
              />
              <span>{recipient.title || recipient.name}</span>
            </div>
          </SelectItem>
        ))}
        {onAddRecipient && (
          <>
            <SelectSeparator />
            <SelectItem value="__add_recipient__" className="min-h-[44px]">
              <div className="flex items-center gap-2 text-[#3c8787]">
                <Plus className="w-4 h-4" />
                <span>Add Recipient</span>
              </div>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
};
