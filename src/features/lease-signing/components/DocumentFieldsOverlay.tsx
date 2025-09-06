'use client';

import React, { useEffect, useState } from 'react';
import { FieldEditor } from '@/components/pdf-editor/FieldEditor';
import { FieldFormType, FieldType } from '@/components/pdf-editor/types';
import type { TemplateField, TemplateRecipient } from '../types/template.types';

interface DocumentFieldsOverlayProps {
  fields: TemplateField[];
  fieldValues: Record<string, any>;
  onFieldValueChange: (fieldId: string, value: any) => void;
  recipients: Array<{
    role: 'HOST' | 'RENTER';
    name: string;
    email: string;
  }>;
  pageNumber?: number;
}

// Helper function to map template field types to FieldType enum
const mapFieldType = (type: string): FieldType => {
  const typeMap: Record<string, FieldType> = {
    'text': FieldType.TEXT,
    'signature': FieldType.SIGNATURE,
    'date': FieldType.DATE,
    'checkbox': FieldType.CHECKBOX,
    'initial': FieldType.INITIALS,
    'email': FieldType.EMAIL,
    'name': FieldType.NAME,
    'number': FieldType.NUMBER,
  };
  return typeMap[type.toLowerCase()] || FieldType.TEXT;
};

// Helper function to get recipient role from field recipientId
const getRecipientRole = (recipientId: string): 'HOST' | 'RENTER' => {
  return recipientId.includes('host') ? 'HOST' : 'RENTER';
};

// Helper function to get recipient index
const getRecipientIndex = (recipientId: string): number => {
  return recipientId.includes('host') ? 0 : 1;
};

export function DocumentFieldsOverlay({
  fields,
  fieldValues,
  onFieldValueChange,
  recipients,
  pageNumber
}: DocumentFieldsOverlayProps) {
  const [pageElements, setPageElements] = useState<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    // Wait for PDF pages to be rendered
    const checkForPages = () => {
      const elements = new Map<number, HTMLElement>();
      const maxPage = Math.max(...fields.map(f => f.page));
      
      for (let i = 1; i <= maxPage; i++) {
        const pageEl = document.querySelector(`[data-page-number="${i}"]`) as HTMLElement;
        if (pageEl) {
          elements.set(i, pageEl);
        }
      }
      
      if (elements.size > 0) {
        setPageElements(elements);
      }
    };

    // Check immediately and then periodically
    checkForPages();
    const interval = setInterval(checkForPages, 500);
    
    // Also check on mutation
    const observer = new MutationObserver(checkForPages);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [fields]);

  // Filter fields by page if pageNumber is specified
  const fieldsToRender = pageNumber 
    ? fields.filter(f => f.page === pageNumber)
    : fields;

  return (
    <>
      {fieldsToRender.map((field) => {
        const pageElement = pageElements.get(field.page);
        if (!pageElement) return null;

        // Convert template field to FieldFormType
        const fieldForm: FieldFormType = {
          formId: field.id,
          pageNumber: field.page,
          type: mapFieldType(field.type),
          pageX: field.x,
          pageY: field.y,
          pageWidth: field.width,
          pageHeight: field.height,
          signerEmail: recipients.find(r => r.role === getRecipientRole(field.recipientId))?.email || '',
          fieldMeta: {
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
          },
          recipientIndex: getRecipientIndex(field.recipientId),
          value: fieldValues[field.id]
        };

        const recipientName = recipients.find(r => r.role === getRecipientRole(field.recipientId))?.name;

        return (
          <FieldEditor
            key={field.id}
            field={fieldForm}
            value={fieldValues[field.id]}
            onValueChange={onFieldValueChange}
            pageElement={pageElement}
            recipientName={recipientName}
          />
        );
      })}
    </>
  );
}