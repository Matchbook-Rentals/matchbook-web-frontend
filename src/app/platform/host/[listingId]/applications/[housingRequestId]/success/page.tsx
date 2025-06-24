'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageSquare, Clock, Home } from 'lucide-react';
import Link from 'next/link';
import { getHousingRequestById } from '@/app/actions/housing-requests';

interface LeaseSuccessPageProps {
  params: { listingId: string; housingRequestId: string };
}

export default function LeaseSuccessPage({ params }: LeaseSuccessPageProps) {
  const searchParams = useSearchParams();
  const [tenantName, setTenantName] = useState<string>('');
  
  // Get tenant display name from URL params or fetch from housing request
  const tenantDisplayName = searchParams.get('tenantName') || searchParams.get('tenant') || '';

  useEffect(() => {
    // If we don't have tenant name from URL params, fetch it from the housing request
    if (!tenantDisplayName) {
      getHousingRequestById(params.housingRequestId)
        .then(housingRequest => {
          if (housingRequest?.user) {
            const displayName = housingRequest.user.displayName || 
                               `${housingRequest.user.firstName} ${housingRequest.user.lastName}`.trim() ||
                               housingRequest.user.email;
            setTenantName(displayName);
          }
        })
        .catch(error => {
          console.error('Error fetching tenant name:', error);
          setTenantName('the tenant');
        });
    } else {
      setTenantName(tenantDisplayName);
    }
  }, [tenantDisplayName, params.housingRequestId]);

  const displayTenantName = tenantName || 'the tenant';

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
            Success!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your lease has been sent to {displayTenantName}. Please be ready to communicate with them over the next few days to facilitate lease signing and booking.
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
                  {displayTenantName} will receive an email notification to review and sign the lease
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <p className="text-gray-700">
                  You'll be notified when they complete their signature
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <p className="text-gray-700">
                  Once both parties sign, the booking will be confirmed
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
              Be ready to communicate with {displayTenantName} in the coming days. They may have questions about the lease terms or move-in process.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              asChild
              className="flex items-center gap-2"
            >
              <Link href="/platform/host/dashboard">
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}