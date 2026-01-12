'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandButton } from '@/components/ui/brandButton';
import { FieldType, FieldFormType, FieldMeta } from '../types';

interface MobileTextFieldConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldFormType | null;
  onSave: (fieldId: string, fieldMeta: FieldMeta) => void;
}

const getFieldTypeName = (field: FieldFormType | null): string => {
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

export const MobileTextFieldConfigDrawer: React.FC<MobileTextFieldConfigDrawerProps> = ({
  isOpen,
  onClose,
  field,
  onSave,
}) => {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  // Reset form when field changes or drawer opens
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

  const getValuePlaceholder = (): string => {
    if (!field) return 'Enter default value';

    switch (field.type) {
      case FieldType.EMAIL:
        return 'email@example.com';
      case FieldType.NUMBER:
        return '0';
      default:
        return 'Enter default value';
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent
        style={{
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">
            Configure {getFieldTypeName(field)}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Field Label */}
          <div>
            <Label htmlFor="mobile-field-label" className="text-sm font-medium text-gray-700">
              Field Label (Optional)
            </Label>
            <Input
              id="mobile-field-label"
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
            <Label htmlFor="mobile-field-value" className="text-sm font-medium text-gray-700">
              Default Value (Optional)
            </Label>
            <Input
              id="mobile-field-value"
              type={field?.type === FieldType.NUMBER ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={getValuePlaceholder()}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-fill this field with a default value
            </p>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3">
          <BrandButton
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </BrandButton>
          <BrandButton
            onClick={handleSave}
            className="flex-1"
          >
            Save
          </BrandButton>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
