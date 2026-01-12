"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PDFEditor } from "@/components/pdf-editor/PDFEditor";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/brandDialog";
import { BrandAlertProvider } from "@/hooks/useBrandAlert";
import { useIsMobile } from "@/hooks/useIsMobile";

interface TemplateEditClientProps {
  template: {
    id: string;
    title: string;
    type: string;
    templateData: any;
    pdfFileName: string;
    pdfFileUrl: string;
    updatedAt: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
  };
  pdfBase64: string | null;
  listingId: string;
  hostName?: string;
  hostEmail?: string;
  listingAddress?: string;
}

export default function TemplateEditClient({
  template,
  pdfBase64,
  listingId,
  hostName,
  hostEmail,
  listingAddress
}: TemplateEditClientProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadPdfFile = async () => {
      if (pdfBase64 && template.pdfFileName) {
        try {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(pdfBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const file = new File([blob], template.pdfFileName, { 
            type: 'application/pdf',
            lastModified: new Date(template.updatedAt).getTime()
          });
          setPdfFile(file);
        } catch (error) {
          console.error('Error creating File from base64:', error);
          toast({
            title: "Error",
            description: "Failed to load PDF file. Please try again.",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    loadPdfFile();
  }, [pdfBase64, template.pdfFileName, template.updatedAt]);

  const handleTemplateUpdated = async (templateData: any) => {
    setShowUploadModal(true);
    setUploadSuccess(false);

    try {
      const response = await fetch(`/api/pdf-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: templateData.name || template.title,
          type: templateData.type || template.type,
          listingId: listingId,
          fields: templateData.fields,
          recipients: templateData.recipients,
        }),
      });

      if (response.ok) {
        setUploadSuccess(true);

        setTimeout(() => {
          router.push(`/app/host/${listingId}/leases`);
        }, 1000);
      } else {
        const error = await response.json();
        console.error('Failed to update template:', error);

        setShowUploadModal(false);

        toast({
          title: "Update failed",
          description: error.error || "Failed to update template. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating template:', error);

      setShowUploadModal(false);

      toast({
        title: "Error",
        description: "Error updating template. Please check your connection and try again.",
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

  if (!pdfFile) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load PDF file</p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const templateData = template.templateData as any;

  return (
    <BrandAlertProvider>
      <Dialog open={showUploadModal} onOpenChange={() => {}}>
        <DialogContent
          className="!z-[9999] max-w-md !top-[30vh]"
          showCloseButton={false}
        >
          <div className="p-6 text-center">
            {!uploadSuccess ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3c8787] mx-auto mb-6"></div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Saving Template</h2>
                <p className="text-gray-600">Please wait while we save your changes...</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Changes Saved!</h2>
                <p className="text-gray-600">Taking you back to your leases page...</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <PDFEditor
        initialPdfFile={pdfFile}
        initialWorkflowState="template"
        templateType={(template.type as 'lease' | 'addendum') || 'lease'}
        templateName={template.title}
        initialFields={templateData?.fields || []}
        initialRecipients={templateData?.recipients || []}
        hostName={hostName}
        hostEmail={hostEmail}
        listingAddress={listingAddress}
        listingId={listingId}
        isMobile={isMobile}
        onCancel={handleCancel}
        onSave={(updatedTemplateData) => {
          const finalTemplateData = {
            name: template.title,
            type: template.type,
            file: updatedTemplateData.pdfFile,
            fields: updatedTemplateData.fields,
            recipients: updatedTemplateData.recipients,
          };
          handleTemplateUpdated(finalTemplateData);
        }}
      />
    </BrandAlertProvider>
  );
}