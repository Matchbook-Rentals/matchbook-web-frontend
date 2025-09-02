'use client';

import React from 'react';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { cn } from '@/lib/utils';
import type { Recipient } from './RecipientManager';

interface FieldContentProps {
  field: FieldFormType;
  recipient?: Recipient;
  signedValue?: any; // Add support for showing actual values
  showValues?: boolean; // Flag to control whether to show values or labels
}

export const FieldContent: React.FC<FieldContentProps> = ({ field, recipient, signedValue, showValues = false }) => {
  const isSignatureField = field.type === FieldType.SIGNATURE || field.type === FieldType.INITIALS;

  // Check if this is a template-enforced field and get its specific label
  const getTemplateEnforcedLabel = (field: FieldFormType) => {
    const requiredFieldMap = {
      'host-signature': { type: FieldType.SIGNATURE, recipientIndex: 0, label: 'Host Signature' },
      'host-name': { type: FieldType.NAME, recipientIndex: 0, label: 'Host Name' },
      'renter-signature': { type: FieldType.SIGNATURE, recipientIndex: 1, label: 'Primary Renter Signature' },
      'renter-name': { type: FieldType.NAME, recipientIndex: 1, label: 'Primary Renter Name' },
      'rent-amount': { type: FieldType.NUMBER, label: 'Rent Amount' },
      'move-in-date': { type: FieldType.DATE, label: 'Move In Date' },
      'move-out-date': { type: FieldType.DATE, label: 'Move Out Date' }
    };

    for (const [, config] of Object.entries(requiredFieldMap)) {
      // Check by type, recipient index, and label (for fields with specific labels)
      if (config.recipientIndex !== undefined) {
        if (field.type === config.type && field.recipientIndex === config.recipientIndex) {
          return config.label;
        }
      } else if (config.label) {
        if (field.type === config.type && field.fieldMeta?.label === config.label) {
          return config.label;
        }
      }
    }
    
    return null;
  };

  // Checkbox fields with custom layout
  if (field.type === FieldType.CHECKBOX && field.fieldMeta?.values) {
    return (
      <div
        className={cn(
          'flex gap-1 py-0.5',
          field.fieldMeta.direction === 'horizontal' ? 'flex-row' : 'flex-col',
        )}
      >
        {field.fieldMeta.values.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="h-3 w-3 border border-gray-400 rounded-sm mr-1.5" />
            <span className="text-xs">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  // Radio fields with custom layout
  if (field.type === FieldType.RADIO && field.fieldMeta?.values) {
    return (
      <div
        className={cn(
          'flex gap-1 py-0.5',
          field.fieldMeta.direction === 'horizontal' ? 'flex-row' : 'flex-col',
        )}
      >
        {field.fieldMeta.values.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="h-3 w-3 border border-gray-400 rounded-full mr-1.5" />
            <span className="text-xs">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  // Dropdown fields
  if (field.type === FieldType.DROPDOWN && field.fieldMeta?.values) {
    return (
      <div className="flex items-center justify-between w-full">
        <span className="text-xs truncate">
          {field.fieldMeta.label || 'Select option...'}
        </span>
        <svg className="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }

  // Default text display for other field types
  let textToDisplay = field.fieldMeta?.label || FRIENDLY_FIELD_TYPE[field.type] || '';
  
  // Check if this is a template-enforced field and use its specific label
  const templateEnforcedLabel = getTemplateEnforcedLabel(field);
  
  if (templateEnforcedLabel) {
    textToDisplay = templateEnforcedLabel;
  }
  
  // If we have a signed value and should show values, use that instead (but only if there's actually a value)
  if (showValues && signedValue !== undefined && signedValue !== null && signedValue !== '') {
    // Handle signature objects properly - extract the actual text value
    if (typeof signedValue === 'object' && signedValue !== null) {
      if (signedValue.type === 'typed' && signedValue.value) {
        textToDisplay = signedValue.value;
      } else if (signedValue.type === 'drawn') {
        textToDisplay = '[Signature Image]'; // Placeholder for drawn signatures
      } else {
        textToDisplay = signedValue.value || signedValue.toString?.() || '[Signed]';
      }
    } else {
      textToDisplay = signedValue;
    }
  }

  // For signature, name, initials, and sign date fields, show recipient-specific labels
  // BUT only when we're NOT showing actual values AND not template-enforced (to avoid double labeling)
  if ((field.type === FieldType.SIGNATURE || field.type === FieldType.NAME || field.type === FieldType.INITIALS || field.type === FieldType.SIGN_DATE || field.type === FieldType.INITIAL_DATE) && recipient && !showValues && !templateEnforcedLabel) {
    const getFieldTypeLabel = (type: FieldType) => {
      switch (type) {
        case FieldType.SIGNATURE: return 'Signature';
        case FieldType.NAME: return 'Name';
        case FieldType.INITIALS: return 'Initials';
        case FieldType.SIGN_DATE: return 'Sign Date';
        case FieldType.INITIAL_DATE: return 'Initial Date';
        default: return '';
      }
    };

    const getRecipientLabel = (title?: string, recipientIndex?: number) => {
      // Handle Host and Primary Renter
      if (title === 'Host') return 'Host';
      if (title === 'Primary Renter') return 'Primary Renter';
      
      // Handle additional recipients by position (3rd, 4th, etc.)
      if (typeof recipientIndex === 'number' && recipientIndex >= 2) {
        const position = recipientIndex + 1;
        const suffix = position === 3 ? 'rd' : position === 4 ? 'th' : position === 5 ? 'th' : 
                     position === 6 ? 'th' : position === 7 ? 'th' : position === 8 ? 'th' : 
                     position === 9 ? 'th' : position === 10 ? 'th' : 'th';
        return `${position}${suffix} Rec.`;
      }
      
      return title || 'Recipient';
    };

    const recipientLabel = getRecipientLabel(recipient.title, field.recipientIndex);
    const fieldLabel = getFieldTypeLabel(field.type);
    
    textToDisplay = `${recipientLabel} ${fieldLabel}`;
  }

  // Show placeholder for text-based fields
  if (!textToDisplay && field.fieldMeta?.placeholder) {
    textToDisplay = field.fieldMeta.placeholder;
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center text-center',
        'text-[clamp(0.07rem,25cqw,0.825rem)]',
        { 'font-signature': isSignatureField && showValues && signedValue },
        field.fieldMeta?.textAlign === 'left' && 'justify-start text-left',
        field.fieldMeta?.textAlign === 'right' && 'justify-end text-right',
      )}
    >
      {textToDisplay}
    </div>
  );
};