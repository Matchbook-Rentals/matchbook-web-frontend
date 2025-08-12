"use client";

import { useState } from "react";
import { TemplateCreationStep } from "@/features/lease-signing/steps/TemplateCreationStep";
import { DocumentCreationStep } from "@/features/lease-signing/steps/DocumentCreationStep";
import { SignerXStep } from "@/features/lease-signing/steps/SignerXStep";
import { ProgressIndicator, StepWrapper } from "@/features/lease-signing/components";
import { useLeaseWorkflow } from "@/features/lease-signing/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import type { Template, DocumentCreateInput, Document } from "@/features/lease-signing/types";

// Mock data for the full workflow test
const mockPropertyData = {
  id: 'property-123',
  address: '123 Main Street, Unit 2A',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94105',
  monthlyRent: 3500,
  securityDeposit: 3500,
  bedrooms: 2,
  bathrooms: 1,
};

const mockTenantData = {
  id: 'tenant-456',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
};

export default function TestFullWorkflow() {
  const workflow = useLeaseWorkflow();
  const [error, setError] = useState<string | null>(null);
  const [completedDocument, setCompletedDocument] = useState<Document | null>(null);

  // Progress steps for the indicator
  const progressSteps = [
    {
      id: 'template',
      title: 'Template',
      description: 'Create or select template',
      status: workflow.state.currentStep === 'template' ? 'current' as const :
              workflow.state.template ? 'completed' as const : 'pending' as const,
    },
    {
      id: 'document',
      title: 'Document',
      description: 'Generate document',
      status: workflow.state.currentStep === 'document' ? 'current' as const :
              workflow.state.document ? 'completed' as const : 'pending' as const,
    },
    {
      id: 'signing',
      title: 'Signing',
      description: 'Collect signatures',
      status: workflow.state.currentStep === 'signing' ? 'current' as const :
              workflow.state.currentStep === 'completed' ? 'completed' as const : 'pending' as const,
    },
    {
      id: 'completed',
      title: 'Complete',
      description: 'Workflow finished',
      status: workflow.state.currentStep === 'completed' ? 'completed' as const : 'pending' as const,
    },
  ];

  const handleTemplateCreated = (templateData: any) => {
    console.log("Template created in workflow:", templateData);
    
    // Create a mock template object
    const mockTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateData.name,
      description: `Template created: ${templateData.name}`,
      type: templateData.type,
      fields: [
        {
          id: 'field-1',
          type: 'text',
          label: 'Tenant Name',
          required: true,
          recipientId: 'renter',
          page: 1,
          x: 100,
          y: 200,
          width: 200,
          height: 30,
        },
        {
          id: 'field-2',
          type: 'signature',
          label: 'Tenant Signature',
          required: true,
          recipientId: 'renter',
          page: 1,
          x: 100,
          y: 400,
          width: 200,
          height: 60,
        },
        {
          id: 'field-3',
          type: 'signature',
          label: 'Host Signature',
          required: true,
          recipientId: 'host',
          page: 1,
          x: 350,
          y: 400,
          width: 200,
          height: 60,
        },
      ],
      recipients: [
        {
          id: 'host',
          name: '[Host Name]',
          role: 'HOST',
          title: 'Host',
          color: '#0B6E6E',
          signingOrder: 2,
        },
        {
          id: 'renter',
          name: '[Renter Name]',
          role: 'RENTER',
          title: 'Primary Renter',
          color: '#fb8c00',
          signingOrder: 1,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
      isActive: true,
    };

    workflow.setTemplate(mockTemplate);
    workflow.nextStep();
    setError(null);
  };

  const handleDocumentCreated = async (documentData: DocumentCreateInput) => {
    console.log("Document created in workflow:", documentData);
    setError(null);
    
    try {
      await workflow.createDocument(documentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    }
  };

  const handleSigningComplete = (signedDocument: Document) => {
    console.log("Signing completed in workflow:", signedDocument);
    setCompletedDocument(signedDocument);
    workflow.goToStep('completed');
    setError(null);
  };

  const handleCancel = () => {
    setError("Workflow was cancelled");
  };

  const resetWorkflow = () => {
    workflow.resetWorkflow();
    setError(null);
    setCompletedDocument(null);
  };

  const renderCurrentStep = () => {
    if (workflow.state.isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        </div>
      );
    }

    switch (workflow.state.currentStep) {
      case 'template':
        return (
          <TemplateCreationStep
            onTemplateCreated={handleTemplateCreated}
            onCancel={handleCancel}
          />
        );

      case 'document':
        return (
          <DocumentCreationStep
            template={workflow.state.template}
            propertyData={mockPropertyData}
            tenantData={mockTenantData}
            onDocumentCreated={handleDocumentCreated}
            onCancel={handleCancel}
            onBack={workflow.previousStep}
          />
        );

      case 'signing':
        return (
          <SignerXStep
            document={workflow.state.document!}
            onSigningComplete={handleSigningComplete}
            onCancel={handleCancel}
            onBack={workflow.previousStep}
          />
        );

      case 'completed':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Complete!</h2>
            <p className="text-gray-600 mb-6">
              The lease signing process has been completed successfully.
            </p>
            {completedDocument && (
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                <h3 className="font-medium mb-2">Document Details</h3>
                <div className="text-sm text-left space-y-1">
                  <p>Name: {completedDocument.name}</p>
                  <p>Status: {completedDocument.status}</p>
                  <p>Recipients: {completedDocument.recipients.length}</p>
                  <p>Completed: {completedDocument.completedAt?.toLocaleString()}</p>
                </div>
              </div>
            )}
            <Button onClick={resetWorkflow} className="bg-[#3c8787] hover:bg-[#2d6666]">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Workflow
            </Button>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
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
                  Test: Full Lease Signing Workflow
                  <Badge variant="outline">End-to-End</Badge>
                </CardTitle>
                <CardDescription>
                  Test the complete lease signing workflow with all steps integrated
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={resetWorkflow}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Workflow
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Current Step</p>
                <p className="font-medium capitalize">{workflow.state.currentStep}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Template</p>
                <p className="font-medium">
                  {workflow.state.template ? '✅ Created' : '⏳ Pending'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Document</p>
                <p className="font-medium">
                  {workflow.state.document ? '✅ Created' : '⏳ Pending'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center justify-center gap-1">
                  {workflow.state.currentStep === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">Complete</span>
                    </>
                  ) : workflow.state.error ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">Error</span>
                    </>
                  ) : (
                    <span className="text-blue-600 font-medium">In Progress</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <ProgressIndicator 
              steps={progressSteps}
              currentStep={progressSteps.findIndex(step => step.status === 'current')}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {(error || workflow.state.error) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || workflow.state.error}</AlertDescription>
          </Alert>
        )}

        {/* Current Step Component */}
        <StepWrapper 
          title={`Step ${progressSteps.findIndex(step => step.status === 'current') + 1}: ${progressSteps.find(step => step.status === 'current')?.title || 'Complete'}`}
          description={progressSteps.find(step => step.status === 'current')?.description || 'Workflow completed'}
          noPadding
        >
          {renderCurrentStep()}
        </StepWrapper>

        {/* Workflow Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Full Workflow Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Workflow Steps</h4>
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li><strong>Template Creation:</strong> Create or select a lease template with signature fields</li>
                <li><strong>Document Generation:</strong> Generate document from template with property/tenant data</li>
                <li><strong>Signing Process:</strong> Send document for signatures and track progress</li>
                <li><strong>Completion:</strong> Download signed document and complete workflow</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Features Demonstrated</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>State management across multiple steps</li>
                <li>Data persistence between steps</li>
                <li>Progress tracking and visualization</li>
                <li>Error handling and recovery</li>
                <li>Step navigation (forward/backward)</li>
                <li>Workflow completion and restart</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Hook Usage</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm">
                  const workflow = useLeaseWorkflow();
                </code>
                <p className="text-sm text-gray-600 mt-2">
                  This demonstrates how to use the useLeaseWorkflow hook to manage state across the entire signing process.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Integration Points</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Components can be used individually or as part of the full workflow</li>
                <li>Each step component accepts data from previous steps</li>
                <li>Mock data simulates real property and tenant information</li>
                <li>Error boundaries and loading states are handled centrally</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}