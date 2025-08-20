'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType } from './types';

interface PDFEditorTemplateProps {
  initialPdfFile?: File;
  templateType?: 'lease' | 'addendum' | 'disclosure' | 'other';
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
}

export const PDFEditorTemplate: React.FC<PDFEditorTemplateProps> = ({ 
  initialPdfFile, 
  templateType = 'lease',
  onSave, 
  onCancel,
  onFinish 
}) => {
  return (
    <PDFEditor
      initialWorkflowState="template"
      initialPdfFile={initialPdfFile}
      templateType={templateType}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
    />
  );
};