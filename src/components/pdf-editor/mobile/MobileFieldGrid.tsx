'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FieldType, FRIENDLY_FIELD_TYPE } from '../types';
import { Recipient } from '../RecipientManager';
import {
  PenTool,
  User,
  CalendarDays,
  Type,
  DollarSign,
} from 'lucide-react';

interface MobileFieldGridProps {
  onFieldSelect: (fieldType: FieldType, label?: string) => void;
  selectedRecipient: string | null;
  recipients: Recipient[];
  disabled?: boolean;
}

// Helper function to get dynamic field label based on selected recipient
const getFieldLabel = (
  fieldType: FieldType,
  recipients: Recipient[],
  selectedRecipientId: string | null
): string => {
  if (!selectedRecipientId) {
    const defaultLabels: Record<string, string> = {
      [FieldType.SIGNATURE]: 'Signature',
      [FieldType.INITIALS]: 'Initials',
      [FieldType.NAME]: 'Name',
    };
    return defaultLabels[fieldType] || 'Field';
  }

  const recipientIndex = recipients.findIndex((r) => r.id === selectedRecipientId);
  const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId);

  const recipientLabel =
    recipientIndex === 0
      ? 'Host'
      : recipientIndex === 1
      ? 'Primary Renter'
      : selectedRecipient?.name || 'Signer';

  switch (fieldType) {
    case FieldType.SIGNATURE:
      return `${recipientLabel} Signature`;
    case FieldType.INITIALS:
      return `${recipientLabel} Initials`;
    case FieldType.NAME:
      return `${recipientLabel} Name`;
    default:
      return 'Field';
  }
};

const PRIMARY_FIELD_TYPES = [
  { type: FieldType.SIGNATURE, icon: PenTool, label: 'Signature' },
  { type: FieldType.INITIALS, icon: User, label: 'Initials' },
  { type: FieldType.NAME, icon: User, label: 'Name' },
];

const LEASE_SPECIFIC_FIELDS = [
  { type: FieldType.DATE, label: 'Move In', icon: CalendarDays, fieldLabel: 'Move In Date', hostOnly: false },
  { type: FieldType.DATE, label: 'Move Out', icon: CalendarDays, fieldLabel: 'Move Out Date', hostOnly: false },
  { type: FieldType.NUMBER, label: 'Rent $', icon: DollarSign, fieldLabel: 'Rent Amount', hostOnly: true },
];

const OTHER_FIELD_TYPES = [
  { type: FieldType.DATE, label: 'Date', icon: CalendarDays },
  { type: FieldType.TEXT, label: 'Text', icon: Type, hostOnly: true },
];

export const MobileFieldGrid: React.FC<MobileFieldGridProps> = ({
  onFieldSelect,
  selectedRecipient,
  recipients,
  disabled = false,
}) => {
  const recipientIndex = recipients.findIndex((r) => r.id === selectedRecipient);
  const isHostSelected = recipientIndex === 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Primary field types */}
      {PRIMARY_FIELD_TYPES.map((field) => {
        const IconComponent = field.icon;
        const dynamicLabel = getFieldLabel(field.type, recipients, selectedRecipient);

        return (
          <button
            key={field.type}
            onClick={() => onFieldSelect(field.type, dynamicLabel)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-3',
              'min-h-[72px] rounded-xl border-2 border-gray-200',
              'bg-white transition-all duration-200',
              'active:scale-95 active:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <IconComponent className="w-6 h-6 text-gray-700" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {field.label}
            </span>
          </button>
        );
      })}

      {/* Lease-specific fields */}
      {LEASE_SPECIFIC_FIELDS.map((field) => {
        // Don't render host-only fields when non-host is selected
        if (field.hostOnly && !isHostSelected) {
          return null;
        }

        const IconComponent = field.icon;

        return (
          <button
            key={field.fieldLabel}
            onClick={() => onFieldSelect(field.type, field.fieldLabel)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-3',
              'min-h-[72px] rounded-xl border-2 border-gray-200',
              'bg-white transition-all duration-200',
              'active:scale-95 active:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <IconComponent className="w-6 h-6 text-gray-700" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {field.label}
            </span>
          </button>
        );
      })}

      {/* Other field types */}
      {OTHER_FIELD_TYPES.map((field) => {
        // Don't render host-only fields when non-host is selected
        if (field.hostOnly && !isHostSelected) {
          return null;
        }

        const IconComponent = field.icon;

        return (
          <button
            key={field.label}
            onClick={() => onFieldSelect(field.type)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-3',
              'min-h-[72px] rounded-xl border-2 border-gray-200',
              'bg-white transition-all duration-200',
              'active:scale-95 active:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <IconComponent className="w-6 h-6 text-gray-700" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {field.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
