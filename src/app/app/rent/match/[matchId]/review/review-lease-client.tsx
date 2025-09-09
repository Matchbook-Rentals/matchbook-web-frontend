'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';
import { StepProgress } from '@/components/StepProgress';
import { BookingSummarySidebar } from '../booking-summary-sidebar';
import { AdminDebugPanel } from '@/components/admin/AdminDebugPanel';
import { calculatePayments } from '@/lib/calculate-payments';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';
import dynamic from 'next/dynamic';

// Dynamic import for PDF component
const PDFViewer = dynamic(() => import('@/components/pdf-editor/PDFViewer').then(mod => ({ default: mod.PDFViewer })), { ssr: false });

interface ReviewLeaseClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
}

export function ReviewLeaseClient({ match, matchId, isAdminDev = false }: ReviewLeaseClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [documentInstance, setDocumentInstance] = useState<any>(null);
  const [documentPdfFile, setDocumentPdfFile] = useState<File | null>(null);
  const [documentFields, setDocumentFields] = useState<any[]>([]);
  const [documentRecipients, setDocumentRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);

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
            
            // Extract fields and recipients from document data
            if (document.documentData) {
              const docData = document.documentData;
              const fields = docData.fields || [];
              setDocumentFields(fields);
              
              const recipients = (docData.recipients || []).map((recipient: any, index: number) => ({
                ...recipient,
                title: recipient.role === 'landlord' ? 'Landlord' : 
                       recipient.role === 'tenant' ? 'Primary Renter' :
                       recipient.role === 'guarantor' ? 'Guarantor' :
                       recipient.title || `Signer ${index + 1}`
              }));
              setDocumentRecipients(recipients);
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
  }, [match.leaseDocumentId, toast]);

  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent
  });

  const calculateProRatedRent = () => {
    const startDate = new Date(match.trip.startDate);
    const monthlyRent = paymentDetails.totalMonthlyRent;
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const daysFromStart = daysInMonth - startDate.getDate() + 1;
    const proRatedAmount = (monthlyRent * daysFromStart) / daysInMonth;
    return Math.round(proRatedAmount * 100) / 100;
  };

  const getPaymentBreakdown = () => {
    const proRatedRent = calculateProRatedRent();
    const securityDeposit = paymentDetails.totalDeposit;
    const subtotalBeforeFees = proRatedRent + securityDeposit;
    const applicationFee = Math.round(subtotalBeforeFees * 0.03 * 100) / 100;
    const total = subtotalBeforeFees + applicationFee;
    
    return {
      proRatedRent,
      securityDeposit,
      applicationFee,
      processingFee: 0,
      total
    };
  };

  const handleProceedToSign = () => {
    router.push(`/app/rent/match/${matchId}/sign`);
  };

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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BookingSummarySidebar 
                match={match} 
                paymentBreakdown={getPaymentBreakdown()} 
                paymentDetails={paymentDetails}
                isUsingCard={false}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className='bg-inherit border-none'>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading lease document...</p>
                    </div>
                  ) : documentInstance && documentPdfFile ? (
                    <div className="space-y-4">
                      {/* PDF Preview */}
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <PDFViewer
                          file={documentPdfFile}
                          pageWidth={800}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Unable to Load Document
                      </h3>
                      <p className="text-gray-600">
                        There was an issue loading the lease document. Please try refreshing the page.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
            <div className="flex items-center justify-between">
              {/* Left side - Status info */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{documentFields.length}</span> fields • 
                  <span className="font-medium">{documentRecipients.length}</span> recipients
                </div>
              </div>

              {/* Right side - Action buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleProceedToSign}
                  size="sm"
                  className="bg-[#0a6060] hover:bg-[#0a6060]/90"
                  disabled={isLoading || !documentPdfFile}
                >
                  Proceed to Sign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrandAlertProvider>
  );
}