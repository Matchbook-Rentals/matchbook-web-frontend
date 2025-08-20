'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType, MatchDetails } from './types';

interface PDFEditorDocumentProps {
  initialPdfFile?: File;
  initialFields?: FieldFormType[];
  initialRecipients?: Recipient[];
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  matchDetails?: MatchDetails;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  onDocumentCreated?: (documentId: string) => void;
}

export const PDFEditorDocument: React.FC<PDFEditorDocumentProps> = ({ 
  initialPdfFile, 
  initialFields,
  initialRecipients,
  isMergedDocument,
  mergedTemplateIds,
  matchDetails,
  onSave, 
  onCancel,
  onFinish,
  onDocumentCreated
}) => {
  return (
    <PDFEditor
      initialWorkflowState="document"
      initialPdfFile={initialPdfFile}
      initialFields={initialFields}
      initialRecipients={initialRecipients}
      isMergedDocument={isMergedDocument}
      mergedTemplateIds={mergedTemplateIds}
      matchDetails={matchDetails}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
      onDocumentCreated={onDocumentCreated}
    />
  );
};