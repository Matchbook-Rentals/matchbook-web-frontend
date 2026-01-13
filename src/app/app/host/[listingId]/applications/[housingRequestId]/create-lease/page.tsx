"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFEditorDocument } from "@/components/pdf-editor/PDFEditorDocument";
import { HostSidebarFrame } from "@/components/pdf-editor/HostSidebarFrame";
import type { MatchDetails, FieldFormType } from "@/components/pdf-editor/types";
import type { Recipient } from "@/components/pdf-editor/RecipientManager";
import { mergePDFTemplates, MergedPDFResult } from "@/lib/pdfMerger";
import { PdfTemplate, HousingRequest, User, Application, Listing } from "@prisma/client";
import { toast } from "sonner";
import Link from "next/link";
import { createMergedDocument } from "@/actions/documents";
import { BrandAlertProvider } from "@/hooks/useBrandAlert";
import { useSignedFieldsStore } from "@/stores/signed-fields-store";
import { useIsMobile } from "@/hooks/useIsMobile";

// Helper function to get recipient color for proper styling
const getRecipientColor = (index: number) => {
  const colorMap = {
    0: '#0B6E6E', // host
    1: '#fb8c00', // primaryRenter
    2: '#3B82F6', // blue
    3: '#8B5CF6', // purple
    4: '#22C55E', // green
    5: '#EF4444', // red
    6: '#EC4899', // pink
    7: '#6366F1', // indigo
    8: '#EAB308', // yellow
    9: '#10B981', // emerald
  };
  return colorMap[index as keyof typeof colorMap] || '#6B7280'; // fallback to gray
};

// Helper to build dynamic recipients list based on trip participants
const buildRecipientsList = (housingRequest: HousingRequestWithDetails, hostUser: any, user: any): Recipient[] => {
  const recipients: Recipient[] = [
    {
      id: 'signer1',
      role: 'HOST' as const,
      name: `${hostUser.firstName || ''} ${hostUser.lastName || ''}`.trim() || hostUser.email,
      email: hostUser.email,
      color: getRecipientColor(0)
    },
    {
      id: 'signer2',
      role: 'RENTER' as const,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      color: getRecipientColor(1)
    }
  ];

  // Add additional renters from trip.allParticipants
  const additionalParticipants = housingRequest.trip?.allParticipants || [];
  additionalParticipants.forEach((participant, index) => {
    recipients.push({
      id: `signer${index + 3}`,
      role: 'RENTER' as const,
      name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.email,
      email: participant.email,
      color: getRecipientColor(index + 2)
    });
  });

  return recipients;
};

// Helper to filter out fields for recipients that don't exist
const filterFieldsForAvailableRecipients = (fields: FieldFormType[], recipientCount: number): FieldFormType[] => {
  const filteredFields = fields.filter(field => field.recipientIndex < recipientCount);
  return filteredFields;
};

interface HousingRequestWithDetails extends HousingRequest {
  user: User & {
    applications: Application[];
  };
  listing: Listing;
}

// Inner component that uses the SignedFields context
function CreateLeasePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signedFields, setSignedField, initializeSignedFields } = useSignedFieldsStore();
  const isMobile = useIsMobile();

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
  const [currentWorkflowState, setCurrentWorkflowState] = useState<'document' | 'signer1'>('document');
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const completeStepFunctionRef = useRef<(() => Promise<void>) | null>(null);
  const [completeStepFunction, setCompleteStepFunction] = useState<(() => Promise<void>) | null>(null);
  const signingActionFunctionRef = useRef<(() => Promise<void>) | null>(null);
  const [signingActionFunction, setSigningActionFunction] = useState<(() => Promise<void>) | null>(null);
  // signedFields state is now managed by SignedFieldsContext

  useEffect(() => {
    if (templateIdsParam) {
      // Store redirect URL for after host completes signing
      sessionStorage.setItem('hostSigningRedirectUrl', `/app/host/${listingId}/applications/${housingRequestId}`);
      loadInitialData();
    } else {
      setError("No templates selected");
      setLoading(false);
    }
  }, [templateIdsParam, housingRequestId, listingId]);

  // Merge PDFs when templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !isMerging && !mergedPDF) {
      mergePDFs();
    }
  }, [templates, isMerging, mergedPDF]);

  // Auto-populate fields when mergedPDF is ready and we have all required data
  useEffect(() => {
    if (mergedPDF && mergedPDF.fields && housingRequest && templates.length > 0) {
      
      const user = housingRequest.user;
      const hostUser = housingRequest.listing.user;
      
      // Helper function to get monthly rent value
      const getMonthlyRentValue = () => {
        if (housingRequest.match?.paymentAmount) {
          return `$${housingRequest.match.paymentAmount.toFixed(2)}`;
        } else if (housingRequest.monthlyRent) {
          return `$${housingRequest.monthlyRent.toFixed(2)}`;
        }
        return "$0.00";
      };
      

      const matchDetailsForPopulation = {
        propertyAddress: `${housingRequest.listing.streetAddress1 || ''}${housingRequest.listing.streetAddress2 ? ' ' + housingRequest.listing.streetAddress2 : ''}, ${housingRequest.listing.city || ''}, ${housingRequest.listing.state || ''} ${housingRequest.listing.postalCode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ','),
        monthlyPrice: getMonthlyRentValue(),
        hostName: `${hostUser.firstName || ''} ${hostUser.lastName || ''}`.trim() || hostUser.email,
        hostEmail: hostUser.email,
        primaryRenterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        primaryRenterEmail: user.email,
        startDate: housingRequest.startDate ? new Date(housingRequest.startDate).toISOString().split('T')[0] : '',
        endDate: housingRequest.endDate ? new Date(housingRequest.endDate).toISOString().split('T')[0] : ''
      };


      const preFilledValues: Record<string, any> = {};

      mergedPDF.fields.forEach(field => {
        if (field.type === 'NAME') {
          if (field.recipientIndex === 0 || field.signerEmail?.includes('host')) {
            preFilledValues[field.formId] = matchDetailsForPopulation.hostName;
          } else if (field.recipientIndex === 1 || field.signerEmail?.includes('renter')) {
            preFilledValues[field.formId] = matchDetailsForPopulation.primaryRenterName;
          }
        } else if (field.type === 'EMAIL') {
          if (field.recipientIndex === 0 || field.signerEmail?.includes('host')) {
            preFilledValues[field.formId] = matchDetailsForPopulation.hostEmail;
          } else if (field.recipientIndex === 1 || field.signerEmail?.includes('renter')) {
            preFilledValues[field.formId] = matchDetailsForPopulation.primaryRenterEmail;
          }
        } else if (field.type === 'NUMBER') {
          // Auto-populate number fields based on label
          // Remove dollar sign from monthlyPrice for NUMBER fields
          const cleanMonthlyPrice = matchDetailsForPopulation.monthlyPrice.replace('$', '');
          const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
          if (fieldLabel.includes('rent') || fieldLabel.includes('price') || fieldLabel.includes('amount') || fieldLabel.includes('monthly')) {
            preFilledValues[field.formId] = cleanMonthlyPrice;
          } else if (fieldLabel.includes('deposit') || fieldLabel.includes('security')) {
            preFilledValues[field.formId] = cleanMonthlyPrice; // Assuming deposit = 1 month rent
          } else {
            // For unlabeled NUMBER fields, check if it's the first number field - likely rent
            const numberFields = mergedPDF.fields.filter(f => f.type === 'NUMBER');
            const numberFieldIndex = numberFields.findIndex(f => f.formId === field.formId);
            if (numberFieldIndex === 0) {
              preFilledValues[field.formId] = cleanMonthlyPrice;
            }
          }
        } else if (field.type === 'TEXT') {
          // Auto-populate text fields based on label
          const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';
          if (fieldLabel.includes('address') || fieldLabel.includes('property') || fieldLabel.includes('location') || fieldLabel.includes('premises')) {
            preFilledValues[field.formId] = matchDetailsForPopulation.propertyAddress;
          } else if (fieldLabel.includes('rent') && (fieldLabel.includes('amount') || fieldLabel.includes('price'))) {
            preFilledValues[field.formId] = `$${matchDetailsForPopulation.monthlyPrice}`;
          }
        } else if (field.type === 'DATE') {
          const fieldLabel = field.fieldMeta?.label?.toLowerCase() || '';

          if (fieldLabel.includes('start') || fieldLabel.includes('begin') || (fieldLabel.includes('move') && fieldLabel.includes('in'))) {
            preFilledValues[field.formId] = matchDetailsForPopulation.startDate;
          } else if (fieldLabel.includes('end') || fieldLabel.includes('expire') || fieldLabel.includes('terminate') || (fieldLabel.includes('move') && fieldLabel.includes('out'))) {
            preFilledValues[field.formId] = matchDetailsForPopulation.endDate;
          } else {
            // For unlabeled DATE fields, alternate between start and end dates
            const dateFields = mergedPDF.fields.filter(f => f.type === 'DATE');
            const dateFieldIndex = dateFields.findIndex(f => f.formId === field.formId);

            if (dateFieldIndex === 0) {
              preFilledValues[field.formId] = matchDetailsForPopulation.startDate;
            } else if (dateFieldIndex === 1) {
              preFilledValues[field.formId] = matchDetailsForPopulation.endDate;
            }
          }
        }
        // Note: SIGNATURE, INITIALS, SIGN_DATE, and INITIAL_DATE fields are not pre-filled
      });

      initializeSignedFields(preFilledValues);
    }
  }, [mergedPDF, housingRequest, templates]);

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
        // Load housing request details (includes user with signingInitials)
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

      // Process housing request (includes user with signingInitials)
      if (housingRequestResponse.ok) {
        const housingRequestData = await housingRequestResponse.json();
        setHousingRequest(housingRequestData);
      } else {
        setError("Failed to load application details");
        return;
      }

    } catch (err) {
      setError("Error loading page data");
    } finally {
      setLoading(false);
    }
  };

  const mergePDFs = async () => {
    try {
      setIsMerging(true);
      setError(null);

      const result = await mergePDFTemplates(templates, {
        fileName: `lease_package_${templates.length}_documents.pdf`,
        includeMetadata: true
      });

      setMergedPDF(result);

    } catch (err) {
      setError(`Failed to merge documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('Failed to merge documents');
    } finally {
      setIsMerging(false);
    }
  };

  // Filter fields whenever mergedPDF changes (works for both single and merged templates)
  useEffect(() => {
    if (!mergedPDF || !housingRequest) return;

    const user = housingRequest.user;
    const hostUser = housingRequest.listing.user;

    console.log('👥 Trip participant data:', {
      primaryRenter: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      },
      additionalParticipants: housingRequest.trip?.allParticipants?.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        email: p.email
      })) || []
    });

    // Build dynamic recipients list based on trip participants
    const dynamicRecipients = buildRecipientsList(housingRequest, hostUser, user);

    console.log('🎯 Checking if fields need filtering:', {
      currentFieldCount: mergedPDF.fields.length,
      recipientCount: dynamicRecipients.length,
      fieldsByRecipientIndex: mergedPDF.fields.reduce((acc, field) => {
        acc[field.recipientIndex] = (acc[field.recipientIndex] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    });

    // Check if any fields need to be filtered
    const fieldsToRemove = mergedPDF.fields.filter(f => f.recipientIndex >= dynamicRecipients.length);

    if (fieldsToRemove.length > 0) {
      console.log('🗑️ Found fields to remove:', {
        count: fieldsToRemove.length,
        fields: fieldsToRemove.map(f => ({
          id: f.formId,
          recipientIndex: f.recipientIndex,
          type: f.type
        }))
      });

      // Filter out fields for recipients that don't exist
      const filteredFields = filterFieldsForAvailableRecipients(mergedPDF.fields, dynamicRecipients.length);

      // Update mergedPDF with filtered fields
      setMergedPDF(prev => prev ? {
        ...prev,
        fields: filteredFields
      } : null);

      console.log('✅ Fields filtered and state updated');
    } else {
      console.log('✅ No filtering needed - all fields have valid recipients');
    }
  }, [mergedPDF?.fields.length, housingRequest]);

  const handleDocumentCreated = async (documentData: any) => {
    try {
      
      const createData = {
        templateIds: templates.map(t => t.id),
        documentData: {
          fields: documentData.fields,
          recipients: documentData.recipients,
          metadata: { 
            pageWidth: 800,
            mergedFrom: templates.map(t => ({ id: t.id, title: t.title })),
            housingRequestId: housingRequestId,
            listingId: listingId
          }
        },
        status: 'DRAFT' as const,
        currentStep: 'document',
        pdfFileName: `lease_package_${templates.length}_documents.pdf`,
        housingRequestId: housingRequestId // Pass housing request ID to link to match
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

  // Helper function to determine if there are unsigned signature/initial fields for current signer (host = index 0)
  const getUnsignedHostFields = () => {
    if (!mergedPDF?.fields) return [];
    return mergedPDF.fields.filter(field => 
      field.recipientIndex === 0 && 
      ['SIGNATURE', 'INITIALS'].includes(field.type) && 
      !signedFields[field.formId]
    );
  };

  // Get the appropriate button function and text
  const getButtonProps = () => {
    if (currentWorkflowState === 'signer1') {
      const unsignedFields = getUnsignedHostFields();

      if (unsignedFields.length > 0) {
        return {
          text: 'Next Action',
          action: signingActionFunction
        };
      } else {
        return {
          text: 'Save and Continue',
          action: completeStepFunction
        };
      }
    }
    return {
      text: 'Create & Sign Document',
      action: completeStepFunction
    };
  };

  // Get contextual guidance text for mobile footer
  const getGuidanceText = () => {
    if (currentWorkflowState === 'signer1') {
      const unsignedFields = getUnsignedHostFields();
      if (unsignedFields.length > 0) {
        return `${unsignedFields.length} signature field${unsignedFields.length > 1 ? 's' : ''} remaining`;
      }
      return 'All fields signed - ready to send';
    }
    return 'Review your lease package';
  };

  if (loading) {
    return (
      <main className="flex flex-col items-start gap-6 px-6  py-8 bg-[#f9f9f9] ">
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
      <main className="flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] ">
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
  const hostUser = housingRequest.listing.user;

  // Determine which monthly rent value to use
  const getMonthlyRentValue = () => {
    // Priority: match.paymentAmount > housingRequest.monthlyRent
    if (housingRequest.match?.paymentAmount) {
      return `$${housingRequest.match.paymentAmount.toFixed(2)}`;
    } else if (housingRequest.monthlyRent) {
      return `$${housingRequest.monthlyRent.toFixed(2)}`;
    }
    return "$0.00";
  };


  // Create MatchDetails for PDFEditorDocument
  const matchDetails: MatchDetails = {
    propertyAddress: `${housingRequest.listing.streetAddress1 || ''}${housingRequest.listing.streetAddress2 ? ' ' + housingRequest.listing.streetAddress2 : ''}, ${housingRequest.listing.city || ''}, ${housingRequest.listing.state || ''} ${housingRequest.listing.postalCode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ','),
    monthlyPrice: getMonthlyRentValue(),
    hostName: `${hostUser.firstName || ''} ${hostUser.lastName || ''}`.trim() || hostUser.email,
    hostEmail: hostUser.email,
    primaryRenterName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    primaryRenterEmail: user.email,
    startDate: housingRequest.startDate ? new Date(housingRequest.startDate).toISOString().split('T')[0] : '',
    endDate: housingRequest.endDate ? new Date(housingRequest.endDate).toISOString().split('T')[0] : '',
  };

  // Debug logging for email values

  return (
    <BrandAlertProvider>
      <main className={`flex flex-col items-start gap-6 px-6 py-8 bg-[#f9f9f9] ${mergedPDF && isMobile ? 'pb-24' : ''}`}>

      {/* Header */}
      <header className="flex flex-col gap-4 w-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl tracking-[0] leading-[28.8px]">
              {currentWorkflowState === 'signer1' ? 'Sign and Send Lease' : 'Finalize Lease'}
            </h1>
            <p className="text-[#5d606d] text-base leading-[19.2px] mt-1">
              {currentWorkflowState === 'signer1'
                ? `${mergedPDF?.fields.filter(f => ['SIGNATURE', 'INITIALS'].includes(f.type)).length || 0} signature fields`
                : 'Review and edit the lease before signing'
              }
            </p>
          </div>
          
          {mergedPDF && !isMobile && (() => {
            const buttonProps = getButtonProps();
            const isDisabled = !buttonProps.action || isCreatingDocument;
            return (
              <Button
                onClick={(e) => {
                  try {
                    if (buttonProps.action) {
                      buttonProps.action();
                    }
                  } catch (error) {
                  }
                }}
                disabled={!buttonProps.action || isCreatingDocument}
                className="bg-[#3c8787] hover:bg-[#2d6666] text-white px-6 py-2"
              >
                {isCreatingDocument ? 'Creating Document...' : buttonProps.text}
              </Button>
            );
          })()}
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
      {mergedPDF && housingRequest ? (
        // Merged PDF is ready - show PDFEditorDocument
        <div className="w-full ">
          <PDFEditorDocument
            initialPdfFile={mergedPDF.file}
            initialFields={mergedPDF.fields}
            initialRecipients={buildRecipientsList(
              housingRequest,
              housingRequest.listing.user,
              housingRequest.user
            )}
            isMergedDocument={true}
            mergedTemplateIds={templates.map(t => t.id)}
            matchDetails={matchDetails}
            housingRequestId={housingRequestId}
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
            onCompleteStepReady={(completeStepFn) => {
              completeStepFunctionRef.current = completeStepFn;
              setCompleteStepFunction(() => async () => {
                setIsCreatingDocument(true);
                try {
                  await completeStepFunctionRef.current?.();
                } finally {
                  setIsCreatingDocument(false);
                }
              });
            }}
            contentHeight="calc(100vh - 210px)"
            signerRole="host"
            onWorkflowStateChange={(newState) => {
              setCurrentWorkflowState(newState as 'document' | 'signer1');
            }}
            onSigningActionReady={(signingActionFn) => {
              signingActionFunctionRef.current = signingActionFn;
              setSigningActionFunction(() => async () => {
                await signingActionFunctionRef.current?.();
              });
            }}
            onFieldSign={(fieldId, value) => {
              // Field signing is now handled by the context
              setSignedField(fieldId, value);
            }}
            currentUserInitials={housingRequest?.listing?.user?.signingInitials}
            currentUserName={housingRequest?.listing?.user ? `${housingRequest.listing.user.firstName || ''} ${housingRequest.listing.user.lastName || ''}`.trim() || housingRequest.listing.user.email : undefined}
            isMobile={isMobile}
            customSidebarContent={(workflowState, defaultContent) => {
              // Only show custom sidebar during signing states
              if (workflowState === 'signer1') {
                return (
                  <HostSidebarFrame
                    hostName={matchDetails.hostName}
                    hostEmail={matchDetails.hostEmail}
                    documentFields={mergedPDF.fields}
                  />
                );
              }
              return defaultContent;
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

      {/* Mobile Action Footer */}
      {mergedPDF && isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-4 py-4 flex justify-between items-center gap-3">
            <div className="text-sm text-gray-600 flex-1 min-w-0">
              {getGuidanceText()}
            </div>
            <Button
              onClick={() => {
                const buttonProps = getButtonProps();
                if (buttonProps.action) {
                  buttonProps.action();
                }
              }}
              disabled={!getButtonProps().action || isCreatingDocument}
              className="bg-[#3c8787] hover:bg-[#2d6666] text-white px-4 py-2 whitespace-nowrap flex-shrink-0"
            >
              {isCreatingDocument ? 'Creating...' : getButtonProps().text}
            </Button>
          </div>
        </div>
      )}
      </main>
    </BrandAlertProvider>
  );
}

// Main component - now using Zustand store instead of context
export default function CreateLeasePage() {
  return <CreateLeasePageContent />;
}
