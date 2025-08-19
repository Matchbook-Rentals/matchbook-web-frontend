'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, ArrowLeft, User } from 'lucide-react';
import { PDFEditorSigner } from '@/components/pdf-editor/PDFEditorSigner';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';
import type { FieldFormType } from '@/components/pdf-editor/types';

export default function SignerEditorTestPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [signerStep, setSignerStep] = useState<'signer1' | 'signer2'>('signer1');
  const [stepFinished, setStepFinished] = useState(false);
  const [finishedStepName, setFinishedStepName] = useState('');
  const [savedData, setSavedData] = useState<{
    fields: FieldFormType[];
    recipients: Recipient[];
    pdfFile: File;
  } | null>(null);

  const handleSave = (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => {
    setSavedData(data);
    console.log('Signing data saved:', data);
    alert(`Signing completed with ${data.fields.length} fields signed`);
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
        <PDFEditorSigner
          signerStep={signerStep}
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
        
        <h1 className="text-3xl font-bold mb-2">Signer Editor Test</h1>
        <p className="text-muted-foreground">
          Test the PDF Editor in signer mode
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Signer Mode Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Signer Step</label>
                <Select value={signerStep} onValueChange={(value: 'signer1' | 'signer2') => setSignerStep(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signer1">Signer 1 (First Signer)</SelectItem>
                    <SelectItem value="signer2">Signer 2 (Second Signer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Badge variant="outline" className="mb-2">
                  Workflow State: {signerStep}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This mode allows signers to view and sign documents. Each signer sees only their assigned fields
                  and can complete their portion of the signing process.
                </p>
              </div>
              
              <Button onClick={() => setShowEditor(true)}>
                Launch Signer Editor ({signerStep})
              </Button>
            </div>
          </CardContent>
        </Card>

        {savedData && (
          <Card>
            <CardHeader>
              <CardTitle>Last Signing Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>File:</strong> {savedData.pdfFile.name}</p>
                <p><strong>Fields:</strong> {savedData.fields.length}</p>
                <p><strong>Recipients:</strong> {savedData.recipients.length}</p>
                <p><strong>Signer Step:</strong> {signerStep}</p>
                
                {savedData.recipients.length > 0 && (
                  <div>
                    <strong>Recipients:</strong>
                    <ul className="ml-4 mt-1">
                      {savedData.recipients.map((recipient, index) => (
                        <li key={index} className="text-sm">
                          {recipient.name} ({recipient.role})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {savedData.fields.length > 0 && (
                  <div>
                    <strong>Signed Field Types:</strong>
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