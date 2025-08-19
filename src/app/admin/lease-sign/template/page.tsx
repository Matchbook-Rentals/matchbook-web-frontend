'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft } from 'lucide-react';
import { PDFEditorTemplate } from '@/components/pdf-editor/PDFEditorTemplate';
import { PDFUpload } from '@/components/pdf-editor/PDFUpload';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';
import type { FieldFormType } from '@/components/pdf-editor/types';

export default function TemplateEditorTestPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);
  const [finishedStepName, setFinishedStepName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [templateMetadata, setTemplateMetadata] = useState<{
    templateName?: string;
    templateType?: 'lease' | 'addendum';
  } | null>(null);
  const [savedData, setSavedData] = useState<{
    fields: FieldFormType[];
    recipients: Recipient[];
    pdfFile: File;
  } | null>(null);

  const handleSave = (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => {
    setSavedData(data);
    console.log('Template saved:', data);
    alert(`Template saved with ${data.fields.length} fields and ${data.recipients.length} recipients`);
  };

  const handleFinish = (stepName: string) => {
    setFinishedStepName(stepName);
    setStepFinished(true);
    setShowEditor(false);
  };

  const handleFileUploaded = (data: {
    file: File;
    templateName?: string;
    templateType?: 'lease' | 'addendum';
  }) => {
    setUploadedFile(data.file);
    setTemplateMetadata({
      templateName: data.templateName,
      templateType: data.templateType,
    });
    setShowUpload(false);
    setShowEditor(true);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setShowUpload(false);
  };

  const handleUploadCancel = () => {
    setShowUpload(false);
  };

  if (showUpload) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={handleUploadCancel}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <PDFUpload
            title="Create New Template"
            description="Upload a PDF document to create a reusable lease or addendum template"
            showTemplateFields={true}
            onFileUploaded={handleFileUploaded}
            onCancel={handleUploadCancel}
          />
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="min-h-screen">
        <PDFEditorTemplate
          initialPdfFile={uploadedFile || undefined}
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
            <Button onClick={() => { 
              setStepFinished(false); 
              setShowEditor(false); 
              setShowUpload(false);
              setUploadedFile(null);
              setTemplateMetadata(null);
            }}>
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
        
        <h1 className="text-3xl font-bold mb-2">Template Editor Test</h1>
        <p className="text-muted-foreground">
          Test the PDF Editor in template creation mode
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Creation Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Workflow State: template
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This mode allows users to upload a PDF document and add signable fields to create reusable templates.
                  Templates can then be used to generate specific lease documents with pre-configured field layouts.
                </p>
              </div>
              
              <Button onClick={() => setShowUpload(true)}>
                Upload PDF & Create Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {savedData && (
          <Card>
            <CardHeader>
              <CardTitle>Last Saved Template Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>File:</strong> {savedData.pdfFile.name}</p>
                {templateMetadata?.templateName && (
                  <p><strong>Template Name:</strong> {templateMetadata.templateName}</p>
                )}
                {templateMetadata?.templateType && (
                  <p><strong>Template Type:</strong> {templateMetadata.templateType}</p>
                )}
                <p><strong>Fields:</strong> {savedData.fields.length}</p>
                <p><strong>Recipients:</strong> {savedData.recipients.length}</p>
                
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
                    <strong>Field Types:</strong>
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