'use client';

import React, { useState, useEffect } from 'react';
import BrandModal from '@/components/BrandModal';
import { BrandButton } from '@/components/ui/brandButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldType, FieldFormType, FieldMeta } from './types';

interface TextFieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldFormType | null;
  onSave: (fieldId: string, fieldMeta: FieldMeta) => void;
}

export const TextFieldConfigModal: React.FC<TextFieldConfigModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave
}) => {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  // Reset form when field changes or modal opens
  useEffect(() => {
    if (field && isOpen) {
      setLabel(field.fieldMeta?.label || '');
      setValue(field.fieldMeta?.defaultValue || field.fieldMeta?.placeholder || '');
    }
  }, [field, isOpen]);

  const handleSave = () => {
    if (!field) return;

    const fieldMeta: FieldMeta = {
      ...field.fieldMeta,
      label: label.trim() || undefined,
      defaultValue: value.trim() || undefined,
      placeholder: value.trim() || undefined,
    };

    onSave(field.formId, fieldMeta);
    handleClose();
  };

  const handleClose = () => {
    setLabel('');
    setValue('');
    onClose();
  };

  const getFieldTypeName = () => {
    if (!field) return 'Field';
    
    switch (field.type) {
      case FieldType.TEXT:
        return 'Text Field';
      case FieldType.NUMBER:
        return 'Number Field';
      case FieldType.EMAIL:
        return 'Email Field';
      case FieldType.NAME:
        return 'Name Field';
      case FieldType.DATE:
        return 'Date Field';
      default:
        return 'Field';
    }
  };

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      className="max-w-md"
      triggerButton={null}
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Configure {getFieldTypeName()}
        </h2>
        
        <div className="space-y-4">
          {/* Field Label */}
          <div>
            <Label htmlFor="field-label" className="text-sm font-medium text-gray-700">
              Field Label (Optional)
            </Label>
            <Input
              id="field-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Phone Number, Address, etc."
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This label will appear on the field in the document
            </p>
          </div>

          {/* Default Value */}
          <div>
            <Label htmlFor="field-value" className="text-sm font-medium text-gray-700">
              Default Value (Optional)
            </Label>
            <Input
              id="field-value"
              type={field?.type === FieldType.NUMBER ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                field?.type === FieldType.EMAIL ? 'email@example.com' :
                field?.type === FieldType.NUMBER ? '0' :
                'Enter default value'
              }
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-fill this field with a default value
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <BrandButton
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </BrandButton>
          <BrandButton
            onClick={handleSave}
          >
            Save Configuration
          </BrandButton>
        </div>
      </div>
    </BrandModal>
  );
};