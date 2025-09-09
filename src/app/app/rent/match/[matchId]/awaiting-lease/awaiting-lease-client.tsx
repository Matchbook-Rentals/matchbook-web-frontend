'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { MatchWithRelations } from '@/types';
import { StepProgress } from '@/components/StepProgress';
import { BookingSummarySidebar } from '../booking-summary-sidebar';
import { AdminDebugPanel } from '@/components/admin/AdminDebugPanel';
import { calculatePayments } from '@/lib/calculate-payments';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';

interface AwaitingLeaseClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
}

export function AwaitingLeaseClient({ match, matchId, isAdminDev = false }: AwaitingLeaseClientProps) {
  const router = useRouter();
  const [listingDocuments, setListingDocuments] = useState<any>(null);
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);

  // Poll for lease document availability
  useEffect(() => {
    const checkForLease = async () => {
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.match?.leaseDocumentId) {
          // Lease is now available, redirect to lease-signing
          router.push(`/app/rent/match/${matchId}/lease-signing`);
        }
      }
    };

    // Check immediately
    checkForLease();

    // Set up polling every 5 seconds
    const interval = setInterval(checkForLease, 5000);

    return () => clearInterval(interval);
  }, [matchId, router]);

  // Fetch listing documents to show available templates/documents
  useEffect(() => {
    const fetchListingDocuments = async () => {
      try {
        const response = await fetch(`/api/listings/${match.listing.id}/documents`);
        if (response.ok) {
          const data = await response.json();
          setListingDocuments(data);
        }
      } catch (error) {
        console.error('Error fetching listing documents:', error);
      }
    };

    fetchListingDocuments();
  }, [match.listing.id]);

  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent
  });

  const calculateProRatedRent = () => {
    const startDate = new Date(match.trip.startDate);
    const monthlyRent = paymentDetails.totalMonthlyRent;
    const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
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
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Lease Being Prepared
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your host is currently preparing your lease document. You will be notified when it&apos;s ready for signing.
                    </p>
                    
                    {listingDocuments && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 max-w-md mx-auto">
                        <h4 className="font-semibold text-blue-900 mb-2">Debug Info</h4>
                        <div className="text-left text-sm text-blue-800 space-y-1">
                          <p>Templates available: {listingDocuments.summary?.totalTemplates || 0}</p>
                          <p>Documents created: {listingDocuments.summary?.totalDocuments || 0}</p>
                          <p>Awaiting signature: {listingDocuments.summary?.documentsAwaitingSignature || 0}</p>
                          <p>Completed: {listingDocuments.summary?.documentsCompleted || 0}</p>
                        </div>
                        
                        {listingDocuments.documents && listingDocuments.documents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-300">
                            <p className="text-xs text-blue-700 font-semibold mb-1">Recent Documents:</p>
                            {listingDocuments.documents.slice(0, 3).map((doc: any, index: number) => (
                              <div key={index} className="text-xs text-blue-700">
                                {doc.template.title} - {doc.currentStep} ({doc.status})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </BrandAlertProvider>
  );
}