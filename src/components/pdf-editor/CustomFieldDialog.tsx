'use client';

import React, { useState } from 'react';
import { BrandCheckbox } from '@/app/brandCheckbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FieldType, FieldMeta } from './types';

interface CustomFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fieldMeta: FieldMeta) => void;
  fieldType: FieldType;
}

export const CustomFieldDialog: React.FC<CustomFieldDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  fieldType,
}) => {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [required, setRequired] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [placeholder, setPlaceholder] = useState('');

  const handleSave = () => {
    const fieldMeta: FieldMeta = {
      label: label.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      required,
      readOnly,
    };

    // Add default value for certain field types
    if (value.trim() && (fieldType === FieldType.TEXT || fieldType === FieldType.NUMBER)) {
      // Store default value in a way that can be used for pre-population
      fieldMeta.placeholder = value.trim();
    }

    onSave(fieldMeta);
    handleCancel();
  };

  const handleCancel = () => {
    // Reset form
    setLabel('');
    setValue('');
    setRequired(false);
    setReadOnly(false);
    setPlaceholder('');
    onClose();
  };

  const getFieldTypeName = () => {
    switch (fieldType) {
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
      case FieldType.CHECKBOX:
        return 'Checkbox Field';
      case FieldType.DROPDOWN:
        return 'Dropdown Field';
      default:
        return 'Custom Field';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Configure {getFieldTypeName()}</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="field-label" className="block text-sm font-medium text-gray-700 mb-2">
              Field Label
            </label>
            <Input
              id="field-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label for this field"
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              This label will help identify the field&apos;s purpose
            </p>
          </div>

          {(fieldType === FieldType.TEXT || fieldType === FieldType.NUMBER) && (
            <div>
              <label htmlFor="field-value" className="block text-sm font-medium text-gray-700 mb-2">
                Default Value
              </label>
              <Input
                id="field-value"
                type={fieldType === FieldType.NUMBER ? 'number' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter default ${fieldType === FieldType.NUMBER ? 'number' : 'text'}`}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                This value will be pre-filled in the field
              </p>
            </div>
          )}

          <div>
            <label htmlFor="field-placeholder" className="block text-sm font-medium text-gray-700 mb-2">
              Placeholder Text
            </label>
            <Input
              id="field-placeholder"
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Enter placeholder text"
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Hint text shown when the field is empty
            </p>
          </div>

          <div className="space-y-3">
            <BrandCheckbox
              name="required-checkbox"
              label="Required Field"
              description="Users must fill this field before completing the document"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              readOnly={false}
            />

            <BrandCheckbox
              name="readonly-checkbox"
              label="Read-Only Field"
              description="Field cannot be edited by users (display only)"
              checked={readOnly}
              onChange={(e) => setReadOnly(e.target.checked)}
              readOnly={false}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 bg-[#3c8787] hover:bg-[#2d6565] text-white"
          >
            Save Field
          </Button>
        </div>
      </div>
    </div>
  );
};