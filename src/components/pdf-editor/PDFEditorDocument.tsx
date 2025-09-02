'use client';

import React from 'react';
import { PDFEditor } from './PDFEditor';
import type { Recipient } from './RecipientManager';
import type { FieldFormType, MatchDetails } from './types';

type WorkflowState = 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed';

interface PDFEditorDocumentProps {
  initialPdfFile?: File;
  initialFields?: FieldFormType[];
  initialRecipients?: Recipient[];
  isMergedDocument?: boolean;
  mergedTemplateIds?: string[];
  matchDetails?: MatchDetails;
  housingRequestId?: string;
  onSave?: (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => void;
  onCancel?: () => void;
  onFinish?: (stepName: string) => void;
  onDocumentCreated?: (documentId: string) => void;
  onCompleteStepReady?: (completeStepFn: () => Promise<void>) => void;
  contentHeight?: string;
  signerRole?: 'host' | 'renter';
  customSidebarContent?: (workflowState: WorkflowState, defaultContent: JSX.Element) => JSX.Element;
  onWorkflowStateChange?: (newState: WorkflowState) => void;
  onSigningActionReady?: (signingActionFn: () => Promise<void>) => void;
  onFieldSign?: (fieldId: string, value: any) => void;
  currentUserInitials?: string; // User's saved initials
  currentUserName?: string; // User's name for generating initials
  // signedFields are now provided by context
}

export const PDFEditorDocument: React.FC<PDFEditorDocumentProps> = ({ 
  initialPdfFile, 
  initialFields,
  initialRecipients,
  isMergedDocument,
  mergedTemplateIds,
  matchDetails,
  housingRequestId,
  onSave, 
  onCancel,
  onFinish,
  onDocumentCreated,
  onCompleteStepReady,
  contentHeight,
  signerRole,
  customSidebarContent,
  onWorkflowStateChange,
  onSigningActionReady,
  onFieldSign,
  currentUserInitials,
  currentUserName
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
      housingRequestId={housingRequestId}
      onSave={onSave}
      onCancel={onCancel}
      onFinish={onFinish}
      onDocumentCreated={onDocumentCreated}
      showFooter={false}
      onCompleteStepReady={onCompleteStepReady}
      contentHeight={contentHeight}
      signerRole={signerRole}
      customSidebarContent={customSidebarContent}
      onWorkflowStateChange={onWorkflowStateChange}
      onSigningActionReady={onSigningActionReady}
      onFieldSign={onFieldSign}
      currentUserInitials={currentUserInitials}
      currentUserName={currentUserName}
    />
  );
};