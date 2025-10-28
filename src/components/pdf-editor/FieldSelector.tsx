'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { 
  PenTool, 
  Type, 
  Mail, 
  User, 
  CalendarDays, 
  Clock,
  Disc,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  DollarSign
} from 'lucide-react';

import { Recipient } from './RecipientManager';

interface FieldSelectorProps {
  selectedField: FieldType | null;
  onSelectedFieldChange: (fieldType: FieldType | null) => void;
  onStartDrag?: (fieldType: FieldType, mouseEvent: MouseEvent, label?: string) => void;
  disabled?: boolean;
  accordionState?: boolean;
  onToggleAccordion?: () => void;
  selectedRecipient?: string | null;
  recipients?: Recipient[];
}

// Helper function to get dynamic field label based on selected recipient
const getFieldLabel = (fieldType: FieldType, recipients?: Recipient[], selectedRecipientId?: string | null): string => {
  if (!recipients || !selectedRecipientId) {
    // Default labels when no recipient is selected
    const defaultLabels: Record<string, string> = {
      [FieldType.SIGNATURE]: 'Signature',
      [FieldType.INITIALS]: 'Initials',
      [FieldType.NAME]: 'Name',
    };
    return defaultLabels[fieldType] || 'Field';
  }

  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);
  const recipientIndex = recipients.findIndex(r => r.id === selectedRecipientId);

  // Determine if this is Host (index 0), Primary Renter (index 1), or use recipient name for 2+
  const recipientLabel = recipientIndex === 0 ? 'Host' : recipientIndex === 1 ? 'Primary Renter' : selectedRecipient?.name || 'Signer';
  
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
  { type: FieldType.SIGNATURE, icon: PenTool },
  { type: FieldType.INITIALS, icon: User },
  { type: FieldType.NAME, icon: User },
];

const LEASE_SPECIFIC_FIELDS = [
  { type: FieldType.DATE, label: 'Move In Date', icon: CalendarDays, fieldLabel: 'Move In Date', hostOnly: false },
  { type: FieldType.DATE, label: 'Move Out Date', icon: CalendarDays, fieldLabel: 'Move Out Date', hostOnly: false },
  { type: FieldType.NUMBER, label: 'Rent Amount', icon: DollarSign, fieldLabel: 'Rent Amount', hostOnly: true },
];

const OTHER_FIELD_TYPES = [
  { type: FieldType.EMAIL, label: 'Email', icon: Mail },
  { type: FieldType.TEXT, label: 'Text', icon: Type },
  // { type: FieldType.RADIO, label: 'Radio', icon: Disc },
  // { type: FieldType.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
  // { type: FieldType.DROPDOWN, label: 'Dropdown', icon: ChevronDown },
];

export const FieldSelector: React.FC<FieldSelectorProps> = ({ 
  selectedField, 
  onSelectedFieldChange, 
  onStartDrag,
  disabled = false,
  accordionState = true,
  onToggleAccordion,
  selectedRecipient,
  recipients
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-3">
        <div 
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={onToggleAccordion}
        >
          <h3 className="font-medium">Field Types</h3>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              accordionState ? 'rotate-180' : ''
            }`}
          />
        </div>
        {accordionState && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {selectedField ? 'Click on the PDF to place the field' : onStartDrag ? 'Click for click-to-place or drag to drop on PDF' : 'Select a field type to add'}
            </p>
            
            {/* All field types displayed at once */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Primary field types */}
              {PRIMARY_FIELD_TYPES.map((field) => {
                const IconComponent = field.icon;
                const isSelected = selectedField === field.type;
                const label = getFieldLabel(field.type, recipients, selectedRecipient);
                
                return (
                  <button
                    key={field.type}
                    onPointerDown={(e) => {
                      if (onStartDrag) {
                        onStartDrag(field.type, e.nativeEvent as MouseEvent, label);
                      } else {
                        onSelectedFieldChange(isSelected ? null : field.type);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                      'hover:bg-gray-50 active:scale-95',
                      disabled && 'opacity-50 cursor-not-allowed',
                      // Only show selected state when not using drag system
                      !onStartDrag && isSelected && 'border-blue-500 bg-blue-50 shadow-sm',
                      (!isSelected || onStartDrag) && 'border-gray-200'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {label}
                    </span>
                  </button>
                );
              })}
              
              {/* Lease-specific fields */}
              {LEASE_SPECIFIC_FIELDS.map((field) => {
                const IconComponent = field.icon;
                const isSelected = selectedField === field.type;

                // Check if this is a host-only field and if a non-host recipient is selected
                const recipientIndex = recipients?.findIndex(r => r.id === selectedRecipient);
                const isHostSelected = recipientIndex === 0; // Host is always index 0

                // Don't render host-only fields when non-host is selected
                if (field.hostOnly && !isHostSelected) {
                  return null;
                }

                return (
                  <button
                    key={field.fieldLabel}
                    onPointerDown={(e) => {
                      if (onStartDrag) {
                        onStartDrag(field.type, e.nativeEvent as MouseEvent, field.fieldLabel);
                      } else {
                        onSelectedFieldChange(isSelected ? null : field.type);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                      'hover:bg-gray-50 active:scale-95',
                      disabled && 'opacity-50 cursor-not-allowed',
                      // Only show selected state when not using drag system
                      !onStartDrag && isSelected && 'border-blue-500 bg-blue-50 shadow-sm',
                      (!isSelected || onStartDrag) && 'border-gray-200'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {field.label}
                    </span>
                  </button>
                );
              })}
              
              {/* Regular Date field */}
              <button
                onPointerDown={(e) => {
                  if (onStartDrag) {
                    onStartDrag(FieldType.DATE, e.nativeEvent as MouseEvent);
                  } else {
                    const isSelected = selectedField === FieldType.DATE;
                    onSelectedFieldChange(isSelected ? null : FieldType.DATE);
                  }
                }}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                  'hover:bg-gray-50 active:scale-95',
                  disabled && 'opacity-50 cursor-not-allowed',
                  // Only show selected state when not using drag system
                  !onStartDrag && selectedField === FieldType.DATE && 'border-blue-500 bg-blue-50 shadow-sm',
                  (selectedField !== FieldType.DATE || onStartDrag) && 'border-gray-200'
                )}
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-xs font-medium text-center leading-tight">
                  Date
                </span>
              </button>
              
              {/* Generic field types */}
              {OTHER_FIELD_TYPES.map((field) => {
                const IconComponent = field.icon;
                const isSelected = selectedField === field.type;

                // Check if this is a host-only field and if a non-host recipient is selected
                const isHostOnlyField = field.type === FieldType.TEXT || field.type === FieldType.NUMBER;
                const recipientIndex = recipients?.findIndex(r => r.id === selectedRecipient);
                const isHostSelected = recipientIndex === 0; // Host is always index 0

                // Don't render host-only fields when non-host is selected
                if (isHostOnlyField && !isHostSelected) {
                  return null;
                }

                return (
                  <button
                    key={field.type}
                    onPointerDown={(e) => {
                      if (onStartDrag) {
                        onStartDrag(field.type, e.nativeEvent as MouseEvent);
                      } else {
                        onSelectedFieldChange(isSelected ? null : field.type);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200',
                      'hover:bg-gray-50 active:scale-95',
                      disabled && 'opacity-50 cursor-not-allowed',
                      // Only show selected state when not using drag system
                      !onStartDrag && isSelected && 'border-blue-500 bg-blue-50 shadow-sm',
                      (!isSelected || onStartDrag) && 'border-gray-200'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {field.label}
                    </span>
                  </button>
                );
              })}
            </div>
        
        {selectedField && !onStartDrag && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Selected: {FRIENDLY_FIELD_TYPE[selectedField]}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Click anywhere on the PDF to place this field
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectedFieldChange(null)}
              className="mt-2 h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        )}
        
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-800 mb-2">Instructions:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Click field button then click PDF to place</li>
                <li>• Or hold and drag field button to PDF</li>
                <li>• Click text box to add label or value</li>
                <li>• Drag existing fields to reposition</li>
                <li>• Resize fields by dragging the corners</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};