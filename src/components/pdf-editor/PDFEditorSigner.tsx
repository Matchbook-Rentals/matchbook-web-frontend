'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType } from './types';

interface PDFEditorSignerProps {
  initialPdfFile?: File;
  initialFields?: FieldFormType[];
  initialRecipients?: Recipient[];
  signerStep?: 'signer1' | 'signer2';
  currentUserEmail?: string;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  isMobile?: boolean;
  hideDefaultSidebar?: boolean;
  showFooter?: boolean;
}

export const PDFEditorSigner: React.FC<PDFEditorSignerProps> = ({
  initialPdfFile,
  initialFields,
  initialRecipients,
  signerStep = 'signer1',
  currentUserEmail,
  onSave,
  onCancel,
  onFinish,
  isMobile = false,
  hideDefaultSidebar = false,
  showFooter = true
}) => {
  return (
    <PDFEditor
      initialWorkflowState={signerStep}
      initialPdfFile={initialPdfFile}
      initialFields={initialFields}
      initialRecipients={initialRecipients}
      currentUserEmail={currentUserEmail}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
      isMobile={isMobile}
      hideDefaultSidebar={hideDefaultSidebar}
      showFooter={showFooter}
    />
  );
};