'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function LeaseSuccessPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const listingId = searchParams.get('listingId');
    const housingRequestId = searchParams.get('housingRequestId');
    const documentId = searchParams.get('documentId');
    
    // Notify parent window that the lease process is complete
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        action: 'onDocumentSent',
        data: { 
          listingId, 
          housingRequestId, 
          documentId,
          success: true 
        }
      }, '*');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Lease Configured Successfully!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your lease agreement has been configured and sent for signatures.
        </p>

        <p className="text-gray-700 mb-8 text-sm">
          Closing window and returning to application...
        </p>
      </div>
    </div>
  );
}