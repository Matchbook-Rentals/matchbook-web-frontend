import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormField {
  id: string;
  name: string;
  fieldType: string;
  pageNumber: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isRequired: boolean;
  backgroundHexColor?: string;
}

interface Role {
  name: string;
  index: number;
  defaultSignerName?: string;
  defaultSignerEmail?: string;
  signerOrder?: number;
  signerType: string;
  locale: string;
  imposeAuthentication: string;
  deliveryMode: string;
  formFields: FormField[];
  allowRoleEdit: boolean;
  allowRoleDelete: boolean;
}

interface TemplatePayload {
  BrandId: string;
  EnableReassign: boolean;
  AllowNewRoles: boolean;
  EnablePrintAndSign: boolean;
  DocumentMessage: string;
  EnableSigningOrder: boolean;
  UseTextTags: boolean;
  Files: string[];
  Title: string;
  AllowMessageEditing: boolean;
  Description: string;
  DocumentTitle: string;
  Roles: Role[];
}

export default function OverviewTab() {
  const [templateTitle, setTemplateTitle] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateTitle.trim() || !documentTitle.trim()) {
      setError("Template Title and Document Title are required");
      return;
    }
    if (!file) {
      setError("Please upload a file");
      return;
    }
    setError("");

    try {
      const formData = new FormData();
      formData.append("RedirectUrl", "https://boldsign.com/esignature-api/");
      formData.append("ShowToolbar", "true");
      formData.append("ViewOption", "PreparePage");
      formData.append("ShowSaveButton", "true");
      formData.append("ShowSendButton", "true");
      formData.append("ShowPreviewButton", "true");
      formData.append("ShowNavigationButtons", "true");
      formData.append("Title", templateTitle);
      formData.append("Description", description);
      formData.append("DocumentMessage", "document message for signers");
      formData.append("Roles[0][Name]", "HR");
      formData.append("Roles[0][Index]", "1");
      formData.append("Roles[0][DefaultSignerName]", "Alex Gayle");
      formData.append("Roles[0][DefaultSignerEmail]", "alexgayle@cubeflakes.com");
      formData.append("Roles[0][SignerOrder]", "1");
      formData.append("Roles[0][SignerType]", "Signer");
      formData.append("Roles[0][Locale]", "EN");
      formData.append("Roles[0][ImposeAuthentication]", "EmailOTP");
      formData.append("Roles[0][DeliveryMode]", "Email");
      formData.append("AllowNewRoles", "true");
      formData.append("AllowMessageEditing", "true");
      formData.append("EnableSigningOrder", "true");
      formData.append("DocumentInfo[0][Title]", documentTitle);
      formData.append("DocumentInfo[0][Locale]", "EN");
      formData.append("DocumentInfo[0][Description]", description);
      formData.append("EnableReassign", "true");
      formData.append("Files", file);
      formData.append("DocumentDownloadOption", "Combined");

      const response = await fetch('/api/leases/template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
        alert('failed')
      }

      const data = await response.json();
      console.log(data)
      setEmbedUrl(data.createUrl);
    } catch (err) {
      setError('Error creating template: ' + (err as Error).message);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result); // Return the full data URL
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="file" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="templateTitle">Template Title</Label>
            <Input
              id="templateTitle"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="Enter template title"
            />
            <Label htmlFor="documentTitle">Document Title</Label>
            <Input
              id="documentTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
            />
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCreateTemplate}>Create Template</Button>
      {embedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {embedUrl && (
              <iframe
                src={embedUrl}
                width="100%"
                height="600px"
                frameBorder="0"
                title="Template Preview"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}