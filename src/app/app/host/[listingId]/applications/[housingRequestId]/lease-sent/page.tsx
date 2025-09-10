'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
// DEPRECATED: BoldSign integration removed
// import { updateHousingRequestWithBoldSignLease } from '@/app/actions/documents';
import { toast } from 'sonner';

interface LeaseSuccessPageProps {
  params: { listingId: string; housingRequestId: string };
}

export default function LeaseSuccessPage({ params }: LeaseSuccessPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const documentId = searchParams.get('documentId');

  useEffect(() => {
    // DEPRECATED: BoldSign integration removed - this functionality is no longer available
    if (documentId) {
      console.log('DEPRECATED: Lease sent with document ID (BoldSign integration removed):', documentId);
      
      // updateHousingRequestWithBoldSignLease(params.housingRequestId, documentId)
      //   .then((result) => {
      //     if (result.success) {
      //       console.log('Housing request updated with BoldSign lease');
      //       toast.success('Lease configuration completed successfully!');
      //     } else {
      //       console.error('Failed to update housing request:', result.error);
      //       toast.error('Lease sent but failed to update records');
      //     }
      //   })
      //   .catch((error) => {
      //     console.error('Error updating housing request:', error);
      //     toast.error('Lease sent but failed to update records');
      //   });
      
      // For now, just show success message since BoldSign integration is removed
      toast.success('Lease page loaded (BoldSign integration deprecated)');
    }
  }, [documentId, params.housingRequestId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Lease Sent Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your lease agreement has been sent to the renter for review and signature.
          </p>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              What happens next?
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
                <p className="text-gray-700">
                  The renter will receive an email notification to review and sign the lease
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <p className="text-gray-700">
                  You&apos;ll be notified when they complete their signature
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <p className="text-gray-700">
                  Once both parties sign, you&apos;ll receive the fully executed lease
                </p>
              </div>
            </div>
          </div>

          {/* Communication Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Stay Responsive</h3>
            </div>
            <p className="text-yellow-700 text-sm">
              Be ready to communicate with the renter in the coming days. They may have questions about the lease terms or move-in process.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push(`/app/host/${params.listingId}/applications/${params.housingRequestId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Application
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/app/host/dashboard/applications')}
              className="flex items-center gap-2"
            >
              View All Applications
            </Button>
          </div>

          {/* Document Info */}
          {documentId && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Document ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{documentId}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}