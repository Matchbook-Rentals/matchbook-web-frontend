'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType } from './types';

interface PDFEditorSignerProps {
  initialPdfFile?: File;
  signerStep?: 'signer1' | 'signer2';
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
}

export const PDFEditorSigner: React.FC<PDFEditorSignerProps> = ({ 
  initialPdfFile, 
  signerStep = 'signer1',
  onSave, 
  onCancel,
  onFinish 
}) => {
  return (
    <PDFEditor
      initialWorkflowState={signerStep}
      initialPdfFile={initialPdfFile}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
    />
  );
};