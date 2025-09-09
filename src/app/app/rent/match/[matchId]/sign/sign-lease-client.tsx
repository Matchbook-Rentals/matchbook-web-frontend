'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';
import { StepProgress } from '@/components/StepProgress';
import { AdminDebugPanel } from '@/components/admin/AdminDebugPanel';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';
import dynamic from 'next/dynamic';

// Dynamic import for PDF components
const PDFEditorSigner = dynamic(() => import('@/components/pdf-editor/PDFEditorSigner').then(mod => ({ default: mod.PDFEditorSigner })), { ssr: false });

interface SignLeaseClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
}

export function SignLeaseClient({ match, matchId, isAdminDev = false }: SignLeaseClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { initializeSignedFields } = useSignedFieldsStore();
  
  const [documentInstance, setDocumentInstance] = useState<any>(null);
  const [documentPdfFile, setDocumentPdfFile] = useState<File | null>(null);
  const [documentFields, setDocumentFields] = useState<any[]>([]);
  const [documentRecipients, setDocumentRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);
  const [fieldsStatus, setFieldsStatus] = useState<Record<string, 'signed' | 'pending'>>({});

  // Fetch document instance
  useEffect(() => {
    const fetchDocument = async () => {
      if (match.leaseDocumentId) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/documents/${match.leaseDocumentId}`);
          if (response.ok) {
            const data = await response.json();
            const document = data.document;
            setDocumentInstance(document);
            
            // Set document ID in session storage
            sessionStorage.setItem('currentDocumentId', document.id);
            
            // Extract fields and recipients from document data
            if (document.documentData) {
              const docData = document.documentData;
              let fields = docData.fields || [];
              
              // Merge field values from fieldValues table
              if (document.fieldValues && document.fieldValues.length > 0) {
                const fieldValuesMap = new Map();
                
                document.fieldValues.forEach((fieldValue: any) => {
                  fieldValuesMap.set(fieldValue.fieldId, {
                    value: fieldValue.value,
                    signerIndex: fieldValue.signerIndex,
                    signedAt: fieldValue.signedAt
                  });
                });
                
                fields = fields.map((field: any) => {
                  const fieldValue = fieldValuesMap.get(field.formId);
                  if (fieldValue) {
                    return {
                      ...field,
                      value: fieldValue.value,
                      signedAt: fieldValue.signedAt,
                      signerIndex: fieldValue.signerIndex
                    };
                  }
                  return field;
                });
              }
              
              setDocumentFields(fields);
              
              // Map recipients
              const recipients = (docData.recipients || []).map((recipient: any, index: number) => ({
                ...recipient,
                title: recipient.role === 'landlord' ? 'Landlord' : 
                       recipient.role === 'tenant' ? 'Primary Renter' :
                       recipient.role === 'guarantor' ? 'Guarantor' :
                       recipient.title || `Signer ${index + 1}`
              }));
              
              setDocumentRecipients(recipients);

              // Initialize field status
              const initialFieldsStatus: Record<string, 'signed' | 'pending'> = {};
              const signedFieldsMap: Record<string, any> = {};
              
              fields.forEach((field: any) => {
                const isSigned = (field.value && field.signedAt);
                initialFieldsStatus[field.formId] = isSigned ? 'signed' : 'pending';
                if (isSigned) {
                  signedFieldsMap[field.formId] = field.value;
                }
              });
              
              setFieldsStatus(initialFieldsStatus);
              initializeSignedFields(signedFieldsMap);
            }
            
            // Fetch the actual PDF file
            if (document.pdfFileUrl) {
              const pdfResponse = await fetch(document.pdfFileUrl);
              if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const pdfFile = new File([pdfBlob], document.pdfFileName || 'lease.pdf', { type: 'application/pdf' });
                setDocumentPdfFile(pdfFile);
              }
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to load lease document",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching document:', error);
          toast({
            title: "Error", 
            description: "Error loading lease document",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDocument();
  }, [match.leaseDocumentId, toast, initializeSignedFields]);

  const handleDocumentSigningComplete = async () => {
    setIsTransitioning(true);
    
    try {
      // Update match record with tenant signature timestamp
      const response = await fetch(`/api/matches/${matchId}/tenant-signed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Lease signed successfully! Now please set up your payment method.",
        });
        
        // Navigate to payment step
        router.push(`/app/rent/match/${matchId}/payment`);
      } else {
        throw new Error('Failed to update match record');
      }
    } catch (error) {
      console.error('Error updating match record:', error);
      toast({
        title: "Warning",
        description: "Lease signed but failed to update records. Please contact support.",
        variant: "destructive",
      });
      // Still proceed to payment since document was signed
      router.push(`/app/rent/match/${matchId}/payment`);
    } finally {
      setIsTransitioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lease document...</p>
        </div>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing lease signature...</p>
        </div>
      </div>
    );
  }

  return (
    <BrandAlertProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 pb-24">
          {/* Step Progress Bar */}
          <div className="mb-8">
            <StepProgress 
              currentStep={1}
              totalSteps={3}
              labels={["Review and sign lease agreement", "Review and pay", "Confirmation"]}
              className='w-full max-w-2xl'
            />
          </div>

          {/* Admin Debug Panel */}
          {isAdminDev && (
            <div className="mb-6">
              <AdminDebugPanel 
                match={match}
                matchId={matchId}
                isAdminDev={isAdminDev}
                onHidePaymentMethods={() => setHidePaymentMethods(true)}
              />
            </div>
          )}

          {/* Full width signing interface */}
          <div className="w-full">
            <div className="w-full min-h-[600px]">
              {documentInstance && documentPdfFile && (
                <PDFEditorSigner
                  initialPdfFile={documentPdfFile}
                  initialFields={documentFields}
                  initialRecipients={documentRecipients}
                  signerStep="signer2"
                  onSave={(data) => {}}
                  onCancel={() => {
                    toast({
                      title: "Signing cancelled",
                      description: "You can return to sign the lease at any time.",
                    });
                    router.push(`/app/rent/match/${matchId}/review`);
                  }}
                  onFinish={handleDocumentSigningComplete}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </BrandAlertProvider>
  );
}