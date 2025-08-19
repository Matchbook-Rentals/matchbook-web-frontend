"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFEditor } from "@/components/pdf-editor/PDFEditor";

interface TemplateCreationStepProps {
  onTemplateCreated?: (template: any) => void;
  onCancel?: () => void;
}

export function TemplateCreationStep({ onTemplateCreated, onCancel }: TemplateCreationStepProps) {
  const [step, setStep] = useState<"upload" | "edit">("upload");
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState<"lease" | "addendum" | "">("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setStep("edit");
    }
  };


  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-[#020202]">Create New Template</h2>
          <p className="text-[#777b8b]">Upload a PDF document to create a reusable lease or addendum template</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., Standard Lease Agreement"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateType">Document Type</Label>
              <Select value={templateType} onValueChange={(value: "lease" | "addendum") => setTemplateType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="addendum">Addendum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload PDF Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Drag and drop your PDF here, or{" "}
                    <label className="text-[#3c8787] hover:underline cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#3c8787] hover:bg-[#2d6666]"
                disabled={!templateName || !templateType || !uploadedFile}
                onClick={() => setStep("edit")}
              >
                Continue to Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
          </div>
        </div>

        <PDFEditor 
          initialPdfFile={uploadedFile || undefined}
          initialWorkflowState="template"
          onSave={(templateData) => {
            // Combine the metadata from step 1 with the field data from editor
            const template = {
              name: templateName,
              type: templateType,
              file: templateData.pdfFile,
              fields: templateData.fields,
              recipients: templateData.recipients,
            };
            onTemplateCreated?.(template);
          }}
          onCancel={() => setStep("upload")}
        />
      </div>
    );
  }


  return null;
}
