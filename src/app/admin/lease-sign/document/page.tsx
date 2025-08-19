'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft } from 'lucide-react';
import { PDFEditorDocument } from '@/components/pdf-editor/PDFEditorDocument';
import type { Recipient } from '@/components/pdf-editor/RecipientManager';
import type { FieldFormType, MatchDetails } from '@/components/pdf-editor/types';

export default function DocumentEditorTestPage() {
  const [showEditor, setShowEditor] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);
  const [finishedStepName, setFinishedStepName] = useState('');
  const [savedData, setSavedData] = useState<{
    fields: FieldFormType[];
    recipients: Recipient[];
    pdfFile: File;
  } | null>(null);

  // Default match details for testing
  const defaultMatchDetails: MatchDetails = {
    propertyAddress: "456 Oak Avenue, Brooklyn, NY 11215",
    monthlyPrice: "3,200.00",
    hostName: "Sarah Johnson",
    hostEmail: "sarah.johnson@example.com", 
    primaryRenterName: "Michael Chen",
    primaryRenterEmail: "michael.chen@example.com",
    startDate: "2024-02-01",
    endDate: "2025-01-31"
  };

  const handleSave = (data: { fields: FieldFormType[], recipients: Recipient[], pdfFile: File }) => {
    setSavedData(data);
    console.log('Document saved:', data);
    alert(`Document saved with ${data.fields.length} fields and ${data.recipients.length} recipients`);
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
        <PDFEditorDocument
          matchDetails={defaultMatchDetails}
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
        
        <h1 className="text-3xl font-bold mb-2">Document Editor Test</h1>
        <p className="text-muted-foreground">
          Test the PDF Editor in document creation mode with trip configuration
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Creation Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  Workflow State: document
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This mode starts with trip configuration where users enter listing and trip details.
                  After configuration, users select a template and the document is pre-populated with the trip data.
                  Documents can then be prepared for the signing workflow.
                </p>
              </div>
              
              <Button onClick={() => setShowEditor(true)}>
                Launch Document Editor
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Trip Configuration Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Property Address:</strong> {defaultMatchDetails.propertyAddress}</p>
              <p><strong>Monthly Price:</strong> ${defaultMatchDetails.monthlyPrice}</p>
              <p><strong>Host Name:</strong> {defaultMatchDetails.hostName}</p>
              <p><strong>Host Email:</strong> {defaultMatchDetails.hostEmail}</p>
              <p><strong>Primary Renter:</strong> {defaultMatchDetails.primaryRenterName}</p>
              <p><strong>Renter Email:</strong> {defaultMatchDetails.primaryRenterEmail}</p>
              <p><strong>Start Date:</strong> {defaultMatchDetails.startDate}</p>
              <p><strong>End Date:</strong> {defaultMatchDetails.endDate}</p>
            </div>
          </CardContent>
        </Card>

        {savedData && (
          <Card>
            <CardHeader>
              <CardTitle>Last Saved Document Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>File:</strong> {savedData.pdfFile.name}</p>
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