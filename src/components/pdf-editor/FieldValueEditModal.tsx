'use client';

import React, { useState, useEffect } from 'react';
import BrandModal from '@/components/BrandModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';

interface FieldValueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldFormType | null;
  onSave: (fieldId: string, value: any) => void;
}

export const FieldValueEditModal: React.FC<FieldValueEditModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave
}) => {
  const { signedFields } = useSignedFieldsStore();
  const [value, setValue] = useState<any>('');

  useEffect(() => {
    if (field) {
      // Get current value from store
      const currentValue = signedFields[field.formId] || '';
      setValue(currentValue);
    }
  }, [field, signedFields]);

  const handleSave = () => {
    if (field) {
      onSave(field.formId, value);
    }
  };

  const handleClear = () => {
    setValue('');
    if (field) {
      onSave(field.formId, '');
    }
  };

  if (!field) return null;

  const renderFieldInput = () => {
    switch (field.type) {
      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="field-checkbox"
              checked={value || false}
              onChange={(e) => setValue(e.target.checked)}
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
            <Label>{field.fieldMeta?.label || 'Select Date'}</Label>
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
            />
          </div>
        );

      case FieldType.NUMBER:
        return (
          <div className="space-y-2">
            <Label>{field.fieldMeta?.label || 'Enter Number'}</Label>
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter value'}
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
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter email address'}
              className="w-full"
            />
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
              value={value || ''}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.fieldMeta?.placeholder || 'Enter text'}
              className="w-full"
            />
          </div>
        );
    }
  };

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onClose}
      heightStyle="!top-[20vh]"
      className="max-w-md"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Edit {field.fieldMeta?.label || FRIENDLY_FIELD_TYPE[field.type]} Field
        </h3>
        
        <div className="mb-6">
          {renderFieldInput()}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#3c8787] hover:bg-[#2d6666]"
          >
            Save
          </Button>
        </div>
      </div>
    </BrandModal>
  );
};