'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Save, Eye } from 'lucide-react';
import { DocumentSelector } from './DocumentSelector'; // Assuming this exists

interface SelectionScreenProps {
  setWorkflowState: (state: 'selection' | 'template' | 'document' | 'signer1' | 'signer2' | 'completed') => void;
  showDocumentSelector: boolean;
  pendingSignerType: 'signer1' | 'signer2' | null;
  setShowDocumentSelector: (show: boolean) => void;
  setPendingSignerType: (type: 'signer1' | 'signer2' | null) => void;
  onLoadDocument: (document: any) => void;
}

export const SelectionScreen: React.FC<SelectionScreenProps> = ({
  setWorkflowState,
  showDocumentSelector,
  pendingSignerType,
  setShowDocumentSelector,
  setPendingSignerType,
  onLoadDocument,
}) => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF Document Workflow</h1>
            <p className="text-lg text-gray-600">Choose what you&apos;d like to do</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Create Template */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setWorkflowState('template')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Template</h3>
                <p className="text-sm text-gray-600">Upload a PDF and add form fields</p>
              </CardContent>
            </Card>

            {/* Create Document */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setWorkflowState('document')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Save className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Document</h3>
                <p className="text-sm text-gray-600">Choose a template to create a document</p>
              </CardContent>
            </Card>

            {/* Sign Document - Signer 1 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
              console.log('🖱️ Sign (Signer 1) clicked');
              setPendingSignerType('signer1');
              setShowDocumentSelector(true);
              console.log('🖱️ States set - pendingSignerType: signer1, showDocumentSelector: true');
            }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign (Signer 1)</h3>
                <p className="text-sm text-gray-600">Sign as the first signer</p>
              </CardContent>
            </Card>

            {/* Sign Document - Signer 2 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
              console.log('🖱️ Sign (Signer 2) clicked');
              setPendingSignerType('signer2');
              setShowDocumentSelector(true);
              console.log('🖱️ States set - pendingSignerType: signer2, showDocumentSelector: true');
            }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign (Signer 2)</h3>
                <p className="text-sm text-gray-600">Sign as the second signer</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Document Selector Modal for Selection Screen */}
      {showDocumentSelector && pendingSignerType && (
        <DocumentSelector
          onLoadDocument={onLoadDocument}
          onClose={() => {
            setShowDocumentSelector(false);
            setPendingSignerType(null);
          }}
          signerType={pendingSignerType}
        />
      )}
    </div>
  );
};
