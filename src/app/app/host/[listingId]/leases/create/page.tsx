"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { TemplateCreationStep } from "@/features/lease-signing/steps";
import { PdfTemplate } from "@prisma/client";
import { toast } from "@/components/ui/use-toast";

export default function CreateLeasePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const listingId = params.listingId as string;
  const templateId = searchParams.get('templateId');
  
  const [existingTemplate, setExistingTemplate] = useState<PdfTemplate | null>(null);
  const [loading, setLoading] = useState(!!templateId);

  useEffect(() => {
    if (templateId) {
      loadExistingTemplate(templateId);
    }
  }, [templateId]);

  const loadExistingTemplate = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pdf-templates/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExistingTemplate(data.template);
      } else {
        console.error('Failed to load template');
        toast({
          title: "Load failed",
          description: "Failed to load template. Redirecting to create new template.",
          variant: "destructive",
        });
        // Remove templateId from URL and continue with creating a new template
        router.replace(`/app/host/${listingId}/leases/create`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "Error loading template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateCreated = async (templateData: any) => {
    try {
      let response;
      
      if (existingTemplate) {
        // Update existing template
        response = await fetch(`/api/pdf-templates/${existingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: templateData.name,
            type: templateData.type,
            listingId: listingId,
            fields: templateData.fields,
            recipients: templateData.recipients,
          }),
        });
      } else {
        // Create new template
        // First, upload the PDF file
        const formData = new FormData();
        formData.append('file', templateData.file);
        
        const uploadResponse = await fetch('/api/pdf-templates/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload PDF');
        }
        
        const { fileUrl, fileName, fileSize, fileKey } = await uploadResponse.json();
        
        // Then create the template with the uploaded file info
        response = await fetch('/api/pdf-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: templateData.name,
            description: `${templateData.type} template`,
            type: templateData.type,
            listingId: listingId,
            fields: templateData.fields,
            recipients: templateData.recipients,
            pdfFileUrl: fileUrl,
            pdfFileName: fileName,
            pdfFileSize: fileSize,
            pdfFileKey: fileKey,
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Template saved successfully:', result);
        
        toast({
          title: existingTemplate ? "Template updated" : "Template created",
          description: existingTemplate 
            ? `"${templateData.name}" has been successfully updated.`
            : `"${templateData.name}" has been successfully created.`,
        });
        
        router.push(`/app/host/${listingId}/leases`);
      } else {
        const error = await response.json();
        console.error('Failed to save template:', error);
        
        toast({
          title: "Save failed",
          description: error.error || "Failed to save template. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      toast({
        title: "Error",
        description: "Error saving template. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push(`/app/host/${listingId}/leases`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
          <p className="text-[#777b8b]">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] p-6">
      <TemplateCreationStep
        existingTemplate={existingTemplate}
        onTemplateCreated={handleTemplateCreated}
        onCancel={handleCancel}
        hostName={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined}
        hostEmail={user?.emailAddresses?.[0]?.emailAddress}
      />
    </div>
  );
}