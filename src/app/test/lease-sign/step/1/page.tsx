"use client";

import { useState } from "react";
import { TemplateCreationStep } from "@/features/lease-signing/steps/TemplateCreationStep";
import { StepWrapper } from "@/features/lease-signing/components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function TestTemplateCreationStep() {
  const [createdTemplate, setCreatedTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateCreated = (templateData: any) => {
    console.log("Template created:", templateData);
    setCreatedTemplate(templateData);
    setError(null);
  };

  const handleCancel = () => {
    console.log("Template creation cancelled");
    setError("Template creation was cancelled");
  };

  const resetTest = () => {
    setCreatedTemplate(null);
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
                  Test: Template Creation Step
                  <Badge variant="outline">Step 1</Badge>
                </CardTitle>
                <CardDescription>
                  Test the standalone template creation component for lease signing workflow
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
                <p className="font-medium">TemplateCreationStep</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Import Path</p>
                <p className="font-medium text-xs">@/features/lease-signing/steps</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center justify-center gap-1">
                  {createdTemplate ? (
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

        {/* Result Display */}
        {createdTemplate && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Template Created Successfully!</strong>
              <div className="mt-2 text-sm">
                <p>Name: {createdTemplate.name}</p>
                <p>Type: {createdTemplate.type}</p>
                <p>File: {createdTemplate.file?.name}</p>
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
          title="Template Creation Component Test"
          description="Create a new lease template by uploading a PDF and adding signature fields"
          noPadding
        >
          <TemplateCreationStep
            onTemplateCreated={handleTemplateCreated}
            onCancel={handleCancel}
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
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onTemplateCreated?</code>
                  <span>Callback fired when template is successfully created</span>
                </div>
                <div className="flex">
                  <code className="bg-gray-100 px-2 py-1 rounded mr-2 min-w-0">onCancel?</code>
                  <span>Callback fired when user cancels template creation</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Features Tested</h4>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>PDF upload and validation</li>
                <li>Template metadata entry (name, type)</li>
                <li>PDF editor integration for field placement</li>
                <li>Template saving workflow</li>
                <li>Error handling and validation</li>
                <li>Multi-step wizard navigation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Expected Workflow</h4>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                <li>Enter template name and select document type</li>
                <li>Upload a PDF document</li>
                <li>Use PDF editor to place signature and form fields</li>
                <li>Review template summary</li>
                <li>Save template and trigger onTemplateCreated callback</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}