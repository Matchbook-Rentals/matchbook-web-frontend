'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSignedFieldsStore } from '@/stores/signed-fields-store-v2';
import { useBookingSidebarStore } from '@/stores/booking-sidebar-store';
import { useResponsivePDFWidth } from '@/hooks/useResponsivePDFWidth';
import dynamic from 'next/dynamic';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';
import type { StepProps } from './types';

const PDFEditorSigner = dynamic(
  () => import('@/components/pdf-editor-v2/PDFEditorSigner').then(mod => ({ default: mod.PDFEditorSigner })),
  { ssr: false }
);

/* ── Sidebar Field Item ── */
function FieldItem({
  type,
  page,
  status,
  isActive,
  onClick,
}: {
  type: string;
  page: number;
  status: 'signed' | 'pending';
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all border-2 ${
        isActive
          ? 'bg-zinc-50 border-zinc-300'
          : 'border-transparent hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[15px] text-zinc-900">{type}</span>
        <span className="text-xs text-zinc-500">Page {page}</span>
      </div>

      {status === 'signed' ? (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-700 bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <Check size={14} strokeWidth={3} className="text-emerald-700" />
          Signed
        </div>
      ) : (
        <div className="px-3 py-1 rounded-full border border-zinc-300 text-zinc-500 text-xs font-medium bg-white">
          Pending
        </div>
      )}
    </div>
  );
}

export function StepSignLease({ match, matchId, currentUserEmail, leaseDocument }: StepProps) {
  const { toast } = useToast();
  const { initializeSignedFields } = useSignedFieldsStore();
  const signedFields = useSignedFieldsStore((s) => s.signedFields);
  const { isMobile } = useResponsivePDFWidth();

  const sidebarOpen = useBookingSidebarStore((s) => s.open);
  const setSidebarOpen = useBookingSidebarStore((s) => s.setOpen);
  const setSidebarVisible = useBookingSidebarStore((s) => s.setVisible);

  // Register the header toggle while this step is mounted
  useEffect(() => {
    setSidebarVisible(true);
    return () => {
      setSidebarVisible(false);
      setSidebarOpen(false);
    };
  }, [setSidebarVisible, setSidebarOpen]);

  // Close the mobile drawer when crossing into desktop
  useEffect(() => {
    if (!isMobile && sidebarOpen) setSidebarOpen(false);
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  const [documentPdfFile, setDocumentPdfFile] = useState<File | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Derived from prefetched leaseDocument
  const documentFields = (() => {
    if (!leaseDocument?.documentData) return [];
    let fields = leaseDocument.documentData.fields || [];

    if (leaseDocument.fieldValues?.length > 0) {
      const fvMap = new Map(leaseDocument.fieldValues.map(fv => [fv.fieldId, fv]));
      fields = fields.map((field: any) => {
        const fv = fvMap.get(field.formId);
        return fv ? { ...field, value: fv.value, signedAt: fv.signedAt, signerIndex: fv.signerIndex } : field;
      });
    }

    return fields;
  })();

  const documentRecipients = (() => {
    if (!leaseDocument?.documentData) return [];
    return (leaseDocument.documentData.recipients || []).map((r: any, i: number) => ({
      ...r,
      title: r.role === 'landlord' ? 'Landlord'
        : r.role === 'tenant' ? 'Primary Renter'
        : r.role === 'guarantor' ? 'Guarantor'
        : r.title || `Signer ${i + 1}`,
    }));
  })();

  const renterEmail = match.trip.user?.email || currentUserEmail;
  const renterIndex = documentRecipients.findIndex((r: any) => r.email === renterEmail);

  const signerStep: 'signer1' | 'signer2' = renterIndex === 0 ? 'signer1' : 'signer2';

  // Get fields assigned to current renter (signatures + initials only)
  const renterSignFields = documentFields.filter((f: any) => {
    if (f.recipientIndex !== renterIndex) return false;
    const fieldType = typeof f.type === 'string' ? f.type : (f.type?.type || f.type?.value || '');
    return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
  });

  // Initialize signed fields store (once)
  useEffect(() => {
    if (initialized || !leaseDocument) return;

    const signedFieldsMap: Record<string, any> = {};
    documentFields.forEach((field: any) => {
      if (field.value && field.signedAt) {
        signedFieldsMap[field.formId] = field.value;
      }
    });
    initializeSignedFields(signedFieldsMap);

    if (leaseDocument.id) sessionStorage.setItem('currentDocumentId', leaseDocument.id);
    sessionStorage.setItem('currentRenterRecipientIndex', renterIndex.toString());

    setInitialized(true);
  }, [leaseDocument]);

  // Fetch PDF binary client-side
  useEffect(() => {
    if (!leaseDocument?.pdfFileUrl) {
      setIsLoadingPdf(false);
      return;
    }

    const fetchPdf = async () => {
      try {
        const response = await fetch(leaseDocument.pdfFileUrl);
        if (response.ok) {
          const blob = await response.blob();
          setDocumentPdfFile(new File([blob], leaseDocument.pdfFileName || 'lease.pdf', { type: 'application/pdf' }));
        }
      } catch (error) {
        console.error('Error fetching PDF:', error);
        toast({ title: 'Error', description: 'Failed to load PDF file', variant: 'destructive' });
      } finally {
        setIsLoadingPdf(false);
      }
    };

    fetchPdf();
  }, [leaseDocument?.pdfFileUrl]);

  const handleSigningComplete = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/tenant-signed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update match record');
      toast({ title: 'Lease Signed', description: 'Your lease has been signed successfully.' });
    } catch (error) {
      console.error('Error updating match record:', error);
      toast({
        title: 'Warning',
        description: 'Lease signed but failed to update records. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  // No lease document
  if (!leaseDocument) {
    return (
      <div className="booking-review__step-shell">
        <h2 className="booking-review__step-shell-title">Sign Lease</h2>
        <p className="booking-review__step-shell-description">
          Your host is still preparing the lease document. You&apos;ll be able to sign once it&apos;s ready.
        </p>
      </div>
    );
  }

  // Loading PDF binary
  if (isLoadingPdf) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e7c6b] mx-auto mb-4" />
        <p className="text-[#777b8b]">Loading lease document...</p>
      </div>
    );
  }

  // Completed + signed count
  const completedCount = renterSignFields.filter((f: any) => signedFields[f.formId]).length;
  const totalCount = renterSignFields.length;

  // Ready to sign
  if (documentPdfFile) {
    return (
      <BrandAlertProvider>
        <div className="flex min-h-[700px] w-screen max-w-[1400px] relative left-1/2 -translate-x-1/2">
          {/* Mobile drawer backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
            className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Sidebar — fixed drawer on mobile, sticky column on desktop */}
          <aside
            className={`
              fixed md:sticky top-0 left-0 md:left-auto z-50 md:z-auto
              w-[340px] max-w-[85vw] md:max-w-none
              h-[100dvh] md:h-auto md:max-h-screen
              bg-white md:border-r md:border-zinc-200
              p-8 overflow-y-auto
              md:self-start md:flex-shrink-0
              transform transition-transform duration-300 ease-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0
            `}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Sign Lease</h2>
              <p className="text-zinc-500 mt-1 text-sm">
                Complete required fields ({completedCount}/{totalCount})
              </p>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="w-full bg-zinc-200 rounded-full h-2 mb-6">
                <div
                  className="bg-[#0e7c6b] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            )}

            <div className="mb-6">
              <h4 className="uppercase text-xs font-bold tracking-widest text-zinc-500 mb-4">
                Required Fields
              </h4>

              <div className="space-y-2">
                {renterSignFields.map((field: any) => {
                  const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                  const friendlyType = fieldType === 'SIGNATURE' ? 'Signature' : 'Initials';
                  const isSigned = !!signedFields[field.formId];

                  return (
                    <FieldItem
                      key={field.formId}
                      type={friendlyType}
                      page={field.pageNumber || field.page || 1}
                      status={isSigned ? 'signed' : 'pending'}
                      isActive={activeFieldId === field.formId}
                      onClick={() => {
                        setActiveFieldId(field.formId);
                        if (isMobile) setSidebarOpen(false);
                      }}
                    />
                  );
                })}

                {renterSignFields.length === 0 && (
                  <p className="text-sm text-zinc-500 py-4">
                    No signature fields required. You may review and proceed.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Document Area */}
          <main className="flex-1 bg-[#8a9a94] flex items-start justify-center p-6 md:p-10 overflow-auto">
            <div className="w-full">
              <PDFEditorSigner
                initialPdfFile={documentPdfFile}
                initialFields={documentFields}
                initialRecipients={documentRecipients}
                signerStep={signerStep}
                currentUserEmail={currentUserEmail}
                isMobile={isMobile}
                hideDefaultSidebar={true}
                showFooter={true}
                onSave={() => {}}
                onCancel={() => {}}
                onFinish={handleSigningComplete}
                onFieldSign={(fieldId, value) => {
                  useSignedFieldsStore.getState().setSignedField(fieldId, value ? 'signed' : undefined);
                }}
              />
            </div>
          </main>
        </div>
      </BrandAlertProvider>
    );
  }

  // Fallback
  return (
    <div className="booking-review__step-shell">
      <h2 className="booking-review__step-shell-title">Sign Lease</h2>
      <p className="booking-review__step-shell-description">
        Unable to load the lease document. Please try refreshing.
      </p>
    </div>
  );
}
