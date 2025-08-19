'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType, MatchDetails } from './types';

interface PDFEditorDocumentProps {
  initialPdfFile?: File;
  matchDetails?: MatchDetails;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
}

export const PDFEditorDocument: React.FC<PDFEditorDocumentProps> = ({ 
  initialPdfFile, 
  matchDetails,
  onSave, 
  onCancel,
  onFinish 
}) => {
  return (
    <PDFEditor
      initialWorkflowState="document"
      initialPdfFile={initialPdfFile}
      matchDetails={matchDetails}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
    />
  );
};