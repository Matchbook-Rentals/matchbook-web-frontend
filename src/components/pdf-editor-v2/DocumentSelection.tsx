'use client';

import React from 'react';
import { DocumentTemplateSelector } from './DocumentTemplateSelector';

interface DocumentSelectionProps {
  onLoadTemplate: (template: any) => void;
  setWorkflowState: (state: 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed') => void;
}

export const DocumentSelection: React.FC<DocumentSelectionProps> = ({ onLoadTemplate, setWorkflowState }) => {
  return (
    <>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Document</h3>
        <p className="text-sm text-gray-600">Choose a template to create a new document from</p>
      </div>

      <DocumentTemplateSelector
        onLoadTemplate={onLoadTemplate}
        onClose={() => setWorkflowState('selection')}
      />
    </>
  );
};
