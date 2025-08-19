'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType } from './types';

interface PDFEditorFinishedProps {
  initialPdfFile?: File;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
}

export const PDFEditorFinished: React.FC<PDFEditorFinishedProps> = ({ 
  initialPdfFile, 
  onSave, 
  onCancel,
  onFinish 
}) => {
  return (
    <PDFEditor
      initialWorkflowState="completed"
      initialPdfFile={initialPdfFile}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
    />
  );
};