"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFEditorDocument } from "@/components/pdf-editor/PDFEditorDocument";
import type { MatchDetails, FieldFormType } from "@/components/pdf-editor/types";
import type { Recipient } from "@/components/pdf-editor/RecipientManager";
import { mergePDFTemplates, MergedPDFResult } from "@/lib/pdfMerger";
import { PdfTemplate, HousingRequest, User, Application, Listing } from "@prisma/client";
import { toast } from "sonner";
import Link from "next/link";
import { createMergedDocument } from "@/actions/documents";

interface HousingRequestWithDetails extends HousingRequest {
  user: User & {
    applications: Application[];
  };
  listing: Listing;
}

export default function CreateLeasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const listingId = params.listingId as string;
  const housingRequestId = params.housingRequestId as string;
  const templateIdsParam = searchParams.get('templates');
  
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [housingRequest, setHousingRequest] = useState<HousingRequestWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergedPDF, setMergedPDF] = useState<MergedPDFResult | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [createdDocumentId, setCreatedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    if (templateIdsParam) {
      loadInitialData();
    } else {
      setError("No templates selected");
      setLoading(false);
    }
  }, [templateIdsParam, housingRequestId]);

  // Merge PDFs when templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !isMerging && !mergedPDF) {
      mergePDFs();
    }
  }, [templates, isMerging, mergedPDF]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const templateIds = templateIdsParam?.split(',') || [];
      
      // Load templates and housing request in parallel
      const [templatesResponse, housingRequestResponse] = await Promise.all([
        // Load selected templates
        Promise.all(templateIds.map(id => 
          fetch(`/api/pdf-templates/${id}`).then(res => res.json())
        )),
        // Load housing request details
        fetch(`/api/housing-requests/${housingRequestId}`)
      ]);

      // Process templates
      const loadedTemplates = templatesResponse
        .filter(res => res.template)
        .map(res => res.template);
      
      if (loadedTemplates.length === 0) {
        setError("No valid templates found");
        return;
      }
      
      setTemplates(loadedTemplates);

      // Process housing request
      if (housingRequestResponse.ok) {
        const housingRequestData = await housingRequestResponse.json();
        setHousingRequest(housingRequestData);
      } else {
        setError("Failed to load application details");
        return;
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError("Error loading page data");
    } finally {
      setLoading(false);
    }
  };

  const mergePDFs = async () => {
    try {
      setIsMerging(true);
      setError(null);
      
      console.log('Merging', templates.length, 'PDF templates...');
      
      const result = await mergePDFTemplates(templates, {
        fileName: `lease_package_${templates.length}_documents.pdf`,
        includeMetadata: true
      });
      
      console.log('PDF merge successful:', {
        pageCount: result.pageCount,
        fieldCount: result.fields.length,
        recipientCount: result.recipients.length,
        templateCount: result.templateCount
      });
      
      setMergedPDF(result);
      
    } catch (err) {
      console.error('Error merging PDFs:', err);
      setError(`Failed to merge documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('Failed to merge documents');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDocumentCreated = async (documentData: any) => {
    try {
      const createData = {
        templateIds: templates.map(t => t.id),
        documentData: {
          fields: documentData.fields,
          recipients: documentData.recipients,
          metadata: { 
            pageWidth: 800,
            mergedFrom: templates.map(t => ({ id: t.id, title: t.title }))
          }
        },
        status: 'DRAFT' as const,
        currentStep: 'document',
        pdfFileName: `lease_package_${templates.length}_documents.pdf`
      };

      const result = await createMergedDocument(createData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Store document ID and transition to signing
      const documentId = result.document?.id;
      setCreatedDocumentId(documentId);
      sessionStorage.setItem('currentDocumentId', documentId);
      
      toast.success("Lease package created! Ready for signing.");
      
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error("Failed to create document");
    }
  };

  const handleBack = () => {
    // Go back to application details
    router.push(`/app/host/${listingId}/applications/${housingRequestId}`);
  };

  const handleCancel = () => {
    router.push(`/app/host/${listingId}/applications/${housingRequestId}`);
  };

  const handleDocumentCompleted = () => {
    toast.success("Document signed successfully!");
    router.push(`/app/host/${listingId}/applications/${housingRequestId}`);
  };

  if (loading) {
    return (
      <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] min-h-screen">
        <div className="flex items-center justify-center py-12 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
            <p className="text-[#777b8b]">Loading document templates...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !housingRequest) {
    return (
      <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] min-h-screen">
        {/* Back Navigation */}
        <Link 
          href={`/app/host/${listingId}/applications/${housingRequestId}`}
          className="hover:underline pl-2 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Application
        </Link>

        <div className="flex items-center justify-center py-12 w-full">
          <div className="text-center text-red-600">
            <h2 className="text-xl font-semibold mb-2">Error Loading Page</h2>
            <p className="mb-4">{error || "Failed to load application data"}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mr-3"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => router.push(`/app/host/${listingId}/applications/${housingRequestId}`)}
            >
              Back to Application
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const user = housingRequest.user;
  const application = user.applications[0];

  // Create MatchDetails for PDFEditorDocument
  const matchDetails: MatchDetails = {
    propertyAddress: `${housingRequest.listing.address}, ${housingRequest.listing.city}, ${housingRequest.listing.state} ${housingRequest.listing.zipcode || ''}`,
    monthlyPrice: "0.00", // TODO: Calculate from housing request dates and pricing  
    hostName: "Host Name", // TODO: Get from listing owner
    hostEmail: "host@example.com", // TODO: Get from listing owner
    primaryRenterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    primaryRenterEmail: user.email,
    startDate: housingRequest.startDate ? new Date(housingRequest.startDate).toISOString().split('T')[0] : '',
    endDate: housingRequest.endDate ? new Date(housingRequest.endDate).toISOString().split('T')[0] : '',
  };

  return (
    <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] min-h-screen">
      {/* Back Navigation */}
      <Link 
        href={`/app/host/${listingId}/applications/${housingRequestId}`}
        className="hover:underline pl-2 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Application
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4 w-full">
        <div>
          <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
            Create Lease Package
          </h1>
          <p className="text-[#5d606d] text-base leading-[19.2px] mt-1">
            {isMerging 
              ? `Merging ${templates.length} documents...`
              : mergedPDF 
              ? `Merged package: ${mergedPDF.pageCount} pages • ${mergedPDF.fields.length} fields`
              : templates.length === 1 
              ? `Editing: ${templates[0].title}` 
              : `${templates.length} documents selected for lease package`
            }
          </p>
        </div>
        
        {templates.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 font-medium">Documents included:</span>
            {templates.map((template, index) => (
              <div
                key={template.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#3c8787]/10 text-[#3c8787] rounded text-sm"
              >
                {template.title}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* PDF Editor Document */}
      {mergedPDF ? (
        // Merged PDF is ready - show PDFEditorDocument
        <div className="w-full h-screen">
          <PDFEditorDocument
            initialPdfFile={mergedPDF.file}
            initialFields={mergedPDF.fields}
            initialRecipients={mergedPDF.recipients}
            isMergedDocument={true}
            mergedTemplateIds={templates.map(t => t.id)}
            matchDetails={matchDetails}
            onSave={(data) => {
              handleDocumentCreated(data);
            }}
            onCancel={handleCancel}
            onFinish={(stepName) => {
              if (stepName === 'Document Completion') {
                handleDocumentCompleted();
              } else {
                handleDocumentCreated({ stepName });
              }
            }}
            onDocumentCreated={(documentId) => {
              setCreatedDocumentId(documentId);
            }}
          />
        </div>
      ) : isMerging ? (
        // Show merging progress
        <div className="flex items-center justify-center py-12 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Merging Documents</h3>
            <p className="text-[#777b8b] mb-2">
              Combining {templates.length} documents into a single lease package...
            </p>
            {templates.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Documents being merged:</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {templates.map((template, index) => (
                    <span key={template.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {template.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Loading templates
        <div className="flex items-center justify-center py-8 w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
            <p className="text-[#777b8b]">Loading templates...</p>
          </div>
        </div>
      )}
    </main>
  );
}