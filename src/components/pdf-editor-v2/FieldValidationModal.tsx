'use client';

import React from 'react';
import BrandModal from '@/components/BrandModal';
import { BrandButton } from '@/components/ui/brandButton';
import { AlertTriangle } from 'lucide-react';

interface FieldValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onProceed: () => void;
  missingHostSignature: boolean;
  missingRenterSignature: boolean;
}

export const FieldValidationModal: React.FC<FieldValidationModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onProceed,
  missingHostSignature,
  missingRenterSignature
}) => {
  const getMissingFieldsMessage = () => {
    if (missingHostSignature && missingRenterSignature) {
      return (
        <>
          both <span className="font-semibold" style={{ color: '#0B6E6E' }}>Host Signature</span> and{' '}
          <span className="font-semibold" style={{ color: '#fb8c00' }}>Renter Signature</span> fields
        </>
      );
    } else if (missingHostSignature) {
      return (
        <>
          a <span className="font-semibold" style={{ color: '#0B6E6E' }}>Host Signature</span> field
        </>
      );
    } else if (missingRenterSignature) {
      return (
        <>
          a <span className="font-semibold" style={{ color: '#fb8c00' }}>Renter Signature</span> field
        </>
      );
    } else {
      return 'signature fields';
    }
  };

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-md"
      triggerButton={null}
    >
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Missing Signature Fields
            </h2>
            <p className="text-gray-600">
              We recommend including {getMissingFieldsMessage()} in your template to ensure proper document execution.
            </p>
            <p className="text-gray-600 mt-2">
              Would you like to add these fields now?
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <BrandButton
            variant="outline"
            onClick={onEdit}
          >
            Edit Template
          </BrandButton>
          <BrandButton
            onClick={onProceed}
          >
            Proceed Anyway
          </BrandButton>
        </div>
      </div>
    </BrandModal>
  );
};