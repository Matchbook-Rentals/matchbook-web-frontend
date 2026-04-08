'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { useRecipientColors } from './recipient-colors';
import BrandModal from '@/components/BrandModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface FieldEditorProps {
  field: FieldFormType;
  value?: any;
  onValueChange: (fieldId: string, value: any) => void;
  pageElement: HTMLElement;
  recipientName?: string;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  value,
  onValueChange,
  pageElement,
  recipientName
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  
  const recipientIndex = field.recipientIndex ?? 0;
  const signerStyles = useRecipientColors(recipientIndex);

  if (!pageElement) {
    return null;
  }

  // Calculate pixel positions from percentages
  const pageRect = pageElement.getBoundingClientRect();
  const x = (field.pageX / 100) * pageRect.width;
  const y = (field.pageY / 100) * pageRect.height;
  const width = (field.pageWidth / 100) * pageRect.width;
  const height = (field.pageHeight / 100) * pageRect.height;

  const handleSave = () => {
    onValueChange(field.formId, tempValue);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    setTempValue('');
    onValueChange(field.formId, '');
    setIsModalOpen(false);
  };

  const getDisplayValue = () => {
    if (value) {
      if (field.type === FieldType.CHECKBOX) {
        return value ? '☑' : '☐';
      }
      if (field.type === FieldType.DATE && value) {
        try {
          return format(new Date(value), 'MM/dd/yyyy');
        } catch {
          return value;
        }
      }
      return value;
    }
    
    // Show field label or type if no value
    const label = field.fieldMeta?.label || FRIENDLY_FIELD_TYPE[field.type];
    if (recipientName && (field.type === FieldType.SIGNATURE || field.type === FieldType.NAME)) {
      return `${recipientName} ${label}`;
    }
    return label;
  };

  const renderFieldInput = () => {
    switch (field.type) {
      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="field-checkbox"
              checked={tempValue || false}
              onChange={(e) => setTempValue(e.target.checked)}
              className="w-5 h-5"
            />
            <Label htmlFor="field-checkbox">
              {field.fieldMeta?.label || 'Check to confirm'}
            </Label>
          </div>
        );

      case FieldType.DATE:
      case FieldType.SIGN_DATE:
      case FieldType.INITIAL_DATE:
        return (
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Input
              type="date"
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full"
            />
          </div>
        );

      case FieldType.NUMBER:
        return (
          <div className="space-y-2">
            <Label>{field.fieldMeta?.label || 'Enter Number'}</Label>
            <Input
              type="number"
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter number'}
              className="w-full"
            />
          </div>
        );

      case FieldType.EMAIL:
        return (
          <div className="space-y-2">
            <Label>{field.fieldMeta?.label || 'Email Address'}</Label>
            <Input
              type="email"
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter email address'}
              className="w-full"
            />
          </div>
        );

      case FieldType.SIGNATURE:
      case FieldType.INITIALS:
        return (
          <div className="space-y-2">
            <Label>{field.fieldMeta?.label || FRIENDLY_FIELD_TYPE[field.type]}</Label>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-2">
                This field will be filled during the signing process
              </p>
              <Input
                type="text"
                value={tempValue || ''}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder={`Pre-fill ${field.type.toLowerCase()} (optional)`}
                className="w-full"
              />
            </div>
          </div>
        );

      case FieldType.NAME:
      case FieldType.TEXT:
      default:
        return (
          <div className="space-y-2">
            <Label>{field.fieldMeta?.label || 'Enter Text'}</Label>
            <Input
              type="text"
              value={tempValue || ''}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter text'}
              className="w-full"
            />
          </div>
        );
    }
  };

  return (
    <>
      <div
        data-field-id={field.formId}
        className={cn(
          'absolute transition-all cursor-pointer',
          'border-2 rounded flex items-center justify-center text-center text-sm',
          'hover:scale-105 hover:shadow-lg',
          value ? 'bg-blue-50 border-blue-400' : 'bg-white/90 border-gray-300',
          signerStyles.base
        )}
        style={{
          left: x,
          top: y,
          width: width,
          height: height,
          zIndex: 30,
        }}
        onClick={() => {
          setTempValue(value || '');
          setIsModalOpen(true);
        }}
      >
        <div className={cn(
          'px-2 text-xs font-medium truncate',
          value ? 'text-blue-800' : 'text-gray-600'
        )}>
          {getDisplayValue()}
        </div>
        
        {value && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>

      <BrandModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        heightStyle="!top-[20vh]"
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Edit {FRIENDLY_FIELD_TYPE[field.type]} Field
          </h3>
          
          <div className="mb-6">
            {renderFieldInput()}
          </div>

          {field.fieldMeta?.required && (
            <p className="text-sm text-amber-600 mb-4">
              * This field is required
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            {value && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="bg-[#3c8787] hover:bg-[#2d6666]"
            >
              Save
            </Button>
          </div>
        </div>
      </BrandModal>
    </>
  );
};