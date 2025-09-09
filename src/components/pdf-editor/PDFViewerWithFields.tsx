'use client';

import React, { useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/lib/pdfWorker';
import './pdf-editor.css';
import { cn } from '@/lib/utils';
import { FieldFormType, FieldType, FRIENDLY_FIELD_TYPE } from './types';
import { useRecipientColors } from './recipient-colors';
import type { Recipient } from './RecipientManager';

interface PDFViewerWithFieldsProps {
  file: string | File | ArrayBuffer;
  fields: FieldFormType[];
  recipients?: Recipient[];
  pageWidth?: number;
  className?: string;
}

export const PDFViewerWithFields: React.FC<PDFViewerWithFieldsProps> = ({
  file,
  fields,
  recipients = [],
  pageWidth = 800,
  className
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const renderFieldValue = (field: FieldFormType) => {
    const value = field.value || field.signedValue;
    
    if (!value) {
      return (
        <span className="text-gray-400 italic">
          {FRIENDLY_FIELD_TYPE[field.type] || 'Field'} not filled
        </span>
      );
    }

    switch (field.type) {
      case FieldType.SIGNATURE:
        if (typeof value === 'object' && value.type) {
          if (value.type === 'drawn' && value.value) {
            return (
              <img 
                src={value.value} 
                alt="Signature" 
                className="w-full h-full object-contain"
              />
            );
          } else if (value.type === 'typed') {
            return (
              <div 
                className="flex items-center justify-center h-full"
                style={{ 
                  fontFamily: value.fontFamily || 'Brush Script MT, cursive',
                  fontSize: '20px'
                }}
              >
                {value.value}
              </div>
            );
          }
        }
        return (
          <div className="flex items-center justify-center h-full font-semibold">
            {value}
          </div>
        );

      case FieldType.INITIALS:
        if (typeof value === 'object' && value.value) {
          if (value.type === 'drawn' && value.value.startsWith('data:')) {
            return (
              <img 
                src={value.value} 
                alt="Initials" 
                className="w-full h-full object-contain"
              />
            );
          }
          return (
            <div 
              className="flex items-center justify-center h-full"
              style={{ 
                fontFamily: value.fontFamily || 'Brush Script MT, cursive',
                fontSize: '16px'
              }}
            >
              {value.value}
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center h-full font-semibold">
            {value}
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <div className="flex items-center justify-center h-full">
            {value === true || value === 'true' || value === 'on' ? '✓' : ''}
          </div>
        );

      case FieldType.DATE:
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return value;

      case FieldType.NAME:
      case FieldType.EMAIL:
      case FieldType.TEXT:
      case FieldType.NUMBER:
      default:
        return (
          <div className="px-2 py-1 text-sm">
            {value}
          </div>
        );
    }
  };

  const renderField = (field: FieldFormType, pageElement: HTMLElement | null) => {
    if (!pageElement) return null;

    const pageRect = pageElement.getBoundingClientRect();
    const x = (field.pageX / 100) * pageRect.width;
    const y = (field.pageY / 100) * pageRect.height;
    const width = (field.pageWidth / 100) * pageRect.width;
    const height = (field.pageHeight / 100) * pageRect.height;

    const recipientIndex = field.recipientIndex ?? 0;
    const signerStyles = useRecipientColors(recipientIndex);
    const recipient = recipients[recipientIndex];

    const getFieldLabel = () => {
      let signerName = '';
      if (recipient?.role === 'HOST' || recipient?.role === 'landlord') {
        signerName = 'Landlord';
      } else if (recipient?.role === 'RENTER' || recipient?.role === 'tenant') {
        signerName = 'Tenant';
      } else {
        signerName = recipient?.name || `Signer ${recipientIndex + 1}`;
      }
      
      // Add field type to the label
      const fieldTypeName = FRIENDLY_FIELD_TYPE[field.type] || 'Field';
      return `${signerName} - ${fieldTypeName}`;
    };

    const isSigned = !!field.value || !!field.signedValue;

    return (
      <div
        key={field.formId}
        className={cn(
          "absolute border-2 rounded overflow-hidden transition-all",
          isSigned ? "bg-white/95" : "bg-gray-100/50"
        )}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
          borderColor: signerStyles.borderColor,
          minHeight: '30px',
          minWidth: '60px'
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {renderFieldValue(field)}
        </div>
        
        {/* Field label badge */}
        <div
          className="absolute -top-6 left-0 text-xs px-1 py-0.5 rounded-t text-white whitespace-nowrap"
          style={{ backgroundColor: signerStyles.borderColor }}
        >
          {getFieldLabel()}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn("pdf-viewer-container relative", className)}>
      <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from({ length: numPages }, (_, index) => {
          const pageNumber = index + 1;
          const pageFields = fields.filter(f => f.pageNumber === pageNumber);
          
          return (
            <div key={pageNumber} className="relative mb-4">
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              >
                <div
                  ref={(el) => {
                    if (el) pageRefs.current.set(pageNumber, el);
                  }}
                  data-pdf-viewer-page
                  className="absolute inset-0"
                  style={{ pointerEvents: 'none' }}
                >
                  {pageFields.map(field => 
                    renderField(field, pageRefs.current.get(pageNumber) || null)
                  )}
                </div>
              </Page>
            </div>
          );
        })}
      </Document>
    </div>
  );
};