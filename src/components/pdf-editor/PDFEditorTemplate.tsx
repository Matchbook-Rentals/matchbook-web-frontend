'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType } from './types';

interface PDFEditorTemplateProps {
  initialPdfFile?: File;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
}

export const PDFEditorTemplate: React.FC<PDFEditorTemplateProps> = ({ 
  initialPdfFile, 
  onSave, 
  onCancel,
  onFinish 
}) => {
  return (
    <PDFEditor
      initialWorkflowState="template"
      initialPdfFile={initialPdfFile}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
    />
  );
};