"use client";

import { useState } from "react";
import { DocumentCreationStep } from "@/features/lease-signing/steps/DocumentCreationStep";
import { StepWrapper } from "@/features/lease-signing/components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { Template, DocumentCreateInput } from "@/features/lease-signing/types";

// Mock template for testing
const mockTemplate: Template = {
  id: 'template-test-1',
  name: 'Standard Residential Lease Agreement',
  description: 'A comprehensive lease agreement for residential properties',
  type: 'lease',
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
      placeholder: 'Enter tenant full name',
    },
    {
      id: 'field-2',
      type: 'text',
      label: 'Property Address',
      required: true,
      recipientId: 'renter',
      page: 1,
      x: 100,
      y: 250,
      width: 300,
      height: 30,
      placeholder: 'Enter property address',
    },
    {
      id: 'field-3',
      type: 'date',
      label: 'Lease Start Date',
      required: true,
      recipientId: 'renter',
      page: 1,
      x: 100,
      y: 300,
      width: 150,
      height: 30,
    },
    {
      id: 'field-4',
      type: 'text',
      label: 'Monthly Rent Amount',
      required: true,
      recipientId: 'renter',
      page: 1,
      x: 100,
      y: 350,
      width: 150,
      height: 30,
      placeholder: 'Enter rent amount',
    },
    {
      id: 'field-5',
      type: 'signature',
      label: 'Tenant Signature',
      required: true,
      recipientId: 'renter',
      page: 1,
      x: 100,
      y: 500,
      width: 200,
      height: 60,
    },
    {
      id: 'field-6',
      type: 'signature',
      label: 'Landlord Signature',
      required: true,
      recipientId: 'host',
      page: 1,
      x: 350,
      y: 500,
      width: 200,
      height: 60,
    },
  ],
  recipients: [
    {
      id: 'host',
      name: '[Host Name]',
      role: 'HOST',
      title: 'Host/Landlord',
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
  metadata: {
    propertyType: 'apartment',
    duration: '12-months',
    state: 'CA',
    tags: ['standard', 'residential'],
  },
};

// Mock property data
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

// Mock tenant data
const mockTenantData = {
  id: 'tenant-456',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
};

export default function TestDocumentCreationStep() {
  const [createdDocument, setCreatedDocument] = useState<DocumentCreateInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useTemplate, setUseTemplate] = useState(true);
  const [usePropertyData, setUsePropertyData] = useState(true);
  const [useTenantData, setUseTenantData] = useState(true);

  const handleDocumentCreated = (documentData: DocumentCreateInput) => {
    console.log("Document created:", documentData);
    setCreatedDocument(documentData);
    setError(null);
  };

  const handleCancel = () => {
    console.log("Document creation cancelled");
    setError("Document creation was cancelled");
  };

  const handleBack = () => {
    console.log("Back to template selection");
    setError("User navigated back to template selection");
  };

  const resetTest = () => {
    setCreatedDocument(null);
    setError(null);
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
                  Test: Document Creation Step
                  <Badge variant="outline">Step 2</Badge>
                </CardTitle>
                <CardDescription>
                  Test the standalone document creation component for lease signing workflow
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
                <p className="font-medium">DocumentCreationStep</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Import Path</p>
                <p className="font-medium text-xs">@/features/lease-signing/steps</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center justify-center gap-1">
                  {createdDocument ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">Success</span>
                    </>
                  ) : error ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">Error</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Ready</span>
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
            <CardDescription>Configure the test scenario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include Template</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={usePropertyData}
                  onChange={(e) => setUsePropertyData(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include Property Data</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useTenantData}
                  onChange={(e) => setUseTenantData(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include Tenant Data</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {createdDocument && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Document Created Successfully!</strong>
              <div className="mt-2 text-sm space-y-1">
                <p>Template ID: {createdDocument.templateId}</p>
                <p>Document Name: {createdDocument.name}</p>
                <p>Recipients: {createdDocument.recipients.length}</p>
                <p>Fields: {createdDocument.fields?.length || 0}</p>
                <p>Auto-populate: {createdDocument.autoPopulate ? 'Yes' : 'No'}</p>
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
          title="Document Creation Component Test"
          description="Generate a document from template with auto-populated data"
          noPadding
        >
          <DocumentCreationStep
            template={useTemplate ? mockTemplate : undefined}
            propertyData={usePropertyData ? mockPropertyData : undefined}
            tenantData={useTenantData ? mockTenantData : undefined}
            onDocumentCreated={handleDocumentCreated}
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
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">template?</code>
                  <span>Template object to create document from</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">propertyData?</code>
                  <span>Property information for auto-population</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">tenantData?</code>
                  <span>Tenant information for auto-population</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onDocumentCreated?</code>
                  <span>Callback fired when document is created</span>
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
                <li>Template-based document creation</li>
                <li>Auto-population from property and tenant data</li>
                <li>Document details configuration</li>
                <li>Recipient management</li>
                <li>Field value editing</li>
                <li>Document preview</li>
                <li>Validation and error handling</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Test Scenarios</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li><strong>With all data:</strong> Template + Property + Tenant data for full auto-population</li>
                <li><strong>Template only:</strong> Manual entry of all document details</li>
                <li><strong>No template:</strong> Error state when template is not provided</li>
                <li><strong>Partial data:</strong> Mixed auto-population and manual entry</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}