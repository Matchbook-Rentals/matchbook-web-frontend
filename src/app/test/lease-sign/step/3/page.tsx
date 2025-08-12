"use client";

import { useState } from "react";
import { SignerXStep } from "@/features/lease-signing/steps/SignerXStep";
import { StepWrapper } from "@/features/lease-signing/components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { Document, DocumentRecipient } from "@/features/lease-signing/types";

// Mock document for testing
const mockDocument: Document = {
  id: 'document-test-1',
  templateId: 'template-1',
  name: 'Lease Agreement - 123 Main St - Doe Family',
  status: 'ready',
  fields: [
    {
      id: 'field-1',
      type: 'text',
      label: 'Tenant Name',
      required: true,
      recipientId: 'renter-1',
      page: 1,
      x: 100,
      y: 200,
      width: 200,
      height: 30,
      value: 'John Doe',
      filledAt: new Date(),
    },
    {
      id: 'field-2',
      type: 'text',
      label: 'Property Address',
      required: true,
      recipientId: 'renter-1',
      page: 1,
      x: 100,
      y: 250,
      width: 300,
      height: 30,
      value: '123 Main Street, Unit 2A',
      filledAt: new Date(),
    },
    {
      id: 'field-3',
      type: 'signature',
      label: 'Tenant Signature',
      required: true,
      recipientId: 'renter-1',
      page: 1,
      x: 100,
      y: 500,
      width: 200,
      height: 60,
    },
    {
      id: 'field-4',
      type: 'signature',
      label: 'Landlord Signature',
      required: true,
      recipientId: 'host-1',
      page: 1,
      x: 350,
      y: 500,
      width: 200,
      height: 60,
    },
  ],
  recipients: [
    {
      id: 'host-1',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'HOST',
      title: 'Host/Landlord',
      color: '#0B6E6E',
      status: 'pending',
      signingOrder: 2,
    },
    {
      id: 'renter-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'RENTER',
      title: 'Primary Renter',
      color: '#fb8c00',
      status: 'pending',
      signingOrder: 1,
    },
  ],
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  updatedAt: new Date(),
  metadata: {
    propertyId: 'property-123',
    propertyAddress: '123 Main Street, Unit 2A',
    leaseStartDate: new Date('2024-03-01'),
    leaseEndDate: new Date('2025-02-28'),
    monthlyRent: 3500,
    securityDeposit: 3500,
    tenantId: 'tenant-456',
    tenantName: 'John Doe',
    hostId: 'host-789',
    hostName: 'Jane Smith',
  },
};

// Different recipient states for testing
const signingStates = {
  ready: [
    {
      ...mockDocument.recipients[0],
      status: 'pending' as const,
    },
    {
      ...mockDocument.recipients[1],
      status: 'pending' as const,
    },
  ],
  sent: [
    {
      ...mockDocument.recipients[0],
      status: 'pending' as const,
    },
    {
      ...mockDocument.recipients[1],
      status: 'sent' as const,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  ],
  partiallyCompleted: [
    {
      ...mockDocument.recipients[0],
      status: 'pending' as const,
    },
    {
      ...mockDocument.recipients[1],
      status: 'signed' as const,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      viewedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      signedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  ],
  completed: [
    {
      ...mockDocument.recipients[0],
      status: 'signed' as const,
      sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      viewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      signedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
    {
      ...mockDocument.recipients[1],
      status: 'signed' as const,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      viewedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      signedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ],
};

export default function TestSignerXStep() {
  const [completedDocument, setCompletedDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingState, setSigningState] = useState<keyof typeof signingStates>('ready');

  const handleSigningComplete = (signedDocument: Document) => {
    console.log("Signing completed:", signedDocument);
    setCompletedDocument(signedDocument);
    setError(null);
  };

  const handleCancel = () => {
    console.log("Signing cancelled");
    setError("Signing process was cancelled");
  };

  const handleBack = () => {
    console.log("Back to document creation");
    setError("User navigated back to document creation");
  };

  const resetTest = () => {
    setCompletedDocument(null);
    setError(null);
  };

  const currentDocument = {
    ...mockDocument,
    recipients: signingStates[signingState],
    status: signingState === 'completed' ? 'completed' as const : 
            signingState === 'partiallyCompleted' ? 'partially_signed' as const :
            signingState === 'sent' ? 'sent' as const : 'ready' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Test Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Test: SignerX Integration Step
                  <Badge variant="outline">Step 3</Badge>
                </CardTitle>
                <CardDescription>
                  Test the standalone signing workflow component for lease documents
                </CardDescription>
              </div>
              <button
                onClick={resetTest}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Test
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Component</p>
                <p className="font-medium">SignerXStep</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Import Path</p>
                <p className="font-medium text-xs">@/features/lease-signing/steps</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center justify-center gap-1">
                  {completedDocument ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">Completed</span>
                    </>
                  ) : error ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">Error</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600 font-medium">In Progress</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Choose different signing states to test</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(signingStates).map(([state, recipients]) => {
                const signedCount = recipients.filter(r => r.status === 'signed').length;
                const isActive = signingState === state;
                
                return (
                  <button
                    key={state}
                    onClick={() => setSigningState(state as keyof typeof signingStates)}
                    className={`p-3 rounded-lg border-2 transition-colors text-left ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize mb-1">{state.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-gray-600">
                      {signedCount}/{recipients.length} signed
                    </div>
                    <div className="flex gap-1 mt-2">
                      {recipients.map((recipient, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            recipient.status === 'signed' ? 'bg-green-500' :
                            recipient.status === 'sent' ? 'bg-blue-500' :
                            recipient.status === 'viewed' ? 'bg-yellow-500' :
                            'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {completedDocument && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Signing Process Completed!</strong>
              <div className="mt-2 text-sm space-y-1">
                <p>Document: {completedDocument.name}</p>
                <p>Status: {completedDocument.status}</p>
                <p>Completion Date: {completedDocument.completedAt?.toLocaleString()}</p>
                <p>Signed PDF: {completedDocument.signedPdfUrl ? 'Available' : 'Not available'}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Component Test */}
        <StepWrapper 
          title="SignerX Integration Component Test"
          description="Manage the signing workflow and track recipient progress"
          noPadding
        >
          <SignerXStep
            document={currentDocument}
            signers={currentDocument.recipients}
            onSigningComplete={handleSigningComplete}
            onCancel={handleCancel}
            onBack={handleBack}
          />
        </StepWrapper>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Component Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Props</h4>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">document</code>
                  <span>Document object with recipient information</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">signers?</code>
                  <span>Optional custom signers array (defaults to document.recipients)</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onSigningComplete?</code>
                  <span>Callback fired when all signatures are collected</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onCancel?</code>
                  <span>Callback fired when user cancels</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onBack?</code>
                  <span>Callback fired when user goes back</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Features Tested</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Signing progress visualization</li>
                <li>Recipient status tracking</li>
                <li>Send for signature workflow</li>
                <li>Reminder management</li>
                <li>Activity log and timeline</li>
                <li>Document download</li>
                <li>Real-time status updates</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Test Scenarios</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>Ready:</strong> Document ready to send for signatures</li>
                <li><strong>Sent:</strong> Document sent to first recipient</li>
                <li><strong>Partially Completed:</strong> One recipient has signed</li>
                <li><strong>Completed:</strong> All recipients have signed</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Interactive Features</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Progress indicators with real percentages</li>
                <li>Simulated signing progression (recipients will auto-progress)</li>
                <li>Resend functionality for each recipient</li>
                <li>Activity timeline with timestamps</li>
                <li>Status badges with appropriate colors</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}