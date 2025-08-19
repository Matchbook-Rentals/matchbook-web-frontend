'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandButton } from '@/components/ui/brandButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PDFUploadProps {
  title?: string;
  description?: string;
  showTemplateFields?: boolean;
  onFileUploaded: (data: {
    file: File;
    templateName?: string;
    templateType?: 'lease' | 'addendum';
  }) => void;
  onCancel?: () => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  title = "Upload PDF Document",
  description = "Upload a PDF document to get started",
  showTemplateFields = false,
  onFileUploaded,
  onCancel
}) => {
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState<"lease" | "addendum" | "">("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    }
  };

  const handleContinue = () => {
    if (uploadedFile) {
      onFileUploaded({
        file: uploadedFile,
        templateName: showTemplateFields ? templateName : undefined,
        templateType: showTemplateFields ? (templateType as 'lease' | 'addendum') : undefined,
      });
    }
  };

  const isValid = uploadedFile && (!showTemplateFields || (templateName && templateType));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-[#020202]">{title}</h2>
        <p className="text-[#777b8b]">{description}</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{showTemplateFields ? 'Template Information' : 'Document Upload'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTemplateFields && (
            <>
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
            </>
          )}

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
                {uploadedFile && (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <BrandButton 
              className="flex-1"
              disabled={!isValid}
              onClick={handleContinue}
            >
              {isValid ? 'Continue' : 'Upload PDF to Continue'}
            </BrandButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};