'use client';

import React from 'react';
import { RecipientManager, type Recipient } from '../RecipientManager';
import { FieldSelector } from '../FieldSelector';
import { FieldType } from '../types';

interface TemplateSidebarProps {
  recipients: Recipient[];
  setRecipients: (recipients: Recipient[]) => void;
  selectedRecipient: string;
  setSelectedRecipient: (recipientId: string) => void;
  selectedField: FieldType | null;
  setSelectedField: (field: FieldType | null) => void;
  setInteractionMode: (mode: 'click-to-place' | 'drag-to-place' | 'select') => void;
  startFieldDetection: (
    fieldType: FieldType,
    recipientId: string,
    mouseEvent: React.MouseEvent,
    fieldLabel?: string
  ) => void;
  accordionStates: {
    recipients: boolean;
    allFieldTypes: boolean;
  };
  toggleAccordion: (section: 'recipients' | 'allFieldTypes') => void;
}

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  recipients,
  setRecipients,
  selectedRecipient,
  setSelectedRecipient,
  selectedField,
  setSelectedField,
  setInteractionMode,
  startFieldDetection,
  accordionStates,
  toggleAccordion,
}) => {
  return (
    <>
      <RecipientManager
        recipients={recipients}
        onRecipientsChange={setRecipients}
        selectedRecipient={selectedRecipient}
        onSelectRecipient={setSelectedRecipient}
        accordionState={accordionStates.recipients}
        onToggleAccordion={() => toggleAccordion('recipients')}
      />

      {/* Removed RequiredLeaseFields and FrequentlyUsedFields components */}
      {/* Files: RequiredLeaseFields.tsx and FrequentlyUsedFields.tsx */}
      {/* Can be restored if needed for template-specific field sections */}

      <FieldSelector
        selectedField={selectedField}
        onSelectedFieldChange={(field) => {
          setSelectedField(field);
          setInteractionMode('click-to-place');
        }}
        selectedRecipient={selectedRecipient}
        recipients={recipients}
        onStartDrag={(fieldType, mouseEvent, fieldLabel) => {
          // For FieldSelector, we'll use the selected recipient or default to host
          const recipientId = selectedRecipient || 'host-recipient';

          // Use the label passed from FieldSelector which now includes recipient-specific labels
          const label = fieldLabel || '';

          startFieldDetection(fieldType, recipientId, mouseEvent, label);
        }}
        accordionState={accordionStates.allFieldTypes}
        onToggleAccordion={() => toggleAccordion('allFieldTypes')}
      />
    </>
  );
};
