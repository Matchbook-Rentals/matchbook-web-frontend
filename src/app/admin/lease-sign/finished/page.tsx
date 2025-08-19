'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Download } from 'lucide-react';
import { PDFEditorFinished } from '@/components/pdf-editor/PDFEditorFinished';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';
import type { FieldFormType } from '@/components/pdf-editor/types';

export default function FinishedEditorTestPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);
  const [finishedStepName, setFinishedStepName] = useState('');
  const [savedData, setSavedData] = useState<{
    fields: FieldFormType[];
    recipients: Recipient[];
    pdfFile: File;
  } | null>(null);

  const handleSave = (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => {
    setSavedData(data);
    console.log('Finished document data:', data);
    alert('Document viewing session completed');
  };

  const handleFinish = (stepName: string) => {
    setFinishedStepName(stepName);
    setStepFinished(true);
    setShowEditor(false);
  };

  const handleCancel = () => {
    setShowEditor(false);
  };

  if (showEditor) {
    return (
      <div className="min-h-screen">
        <PDFEditorFinished
          onSave={handleSave}
          onCancel={handleCancel}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  if (stepFinished) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{finishedStepName} Finished</h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
              ✓ Success
            </div>
            <Button onClick={() => { setStepFinished(false); setShowEditor(false); }}>
              Test Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Finished Document Viewer Test</h1>
        <p className="text-muted-foreground">
          Test the PDF Editor in completed document viewing mode
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Document Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Workflow State: completed
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This mode displays fully signed and completed documents. All signatures and field values are locked
                  and the document is in read-only mode. Users can view the final document and download copies.
                </p>
              </div>
              
              <Button onClick={() => setShowEditor(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                View Completed Document
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features in Completed Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">All fields are locked and non-editable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Signatures are verified and displayed</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Document can be downloaded as final PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Audit trail shows completion timestamps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {savedData && (
          <Card>
            <CardHeader>
              <CardTitle>Last Viewed Document Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>File:</strong> {savedData.pdfFile.name}</p>
                <p><strong>Fields:</strong> {savedData.fields.length}</p>
                <p><strong>Recipients:</strong> {savedData.recipients.length}</p>
                <p><strong>Status:</strong> <Badge variant="default">Completed</Badge></p>
                
                {savedData.recipients.length > 0 && (
                  <div>
                    <strong>Signers:</strong>
                    <ul className="ml-4 mt-1">
                      {savedData.recipients.map((recipient, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {recipient.name} ({recipient.role}) - Signed
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {savedData.fields.length > 0 && (
                  <div>
                    <strong>Completed Field Types:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(new Set(savedData.fields.map(f => f.type))).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}