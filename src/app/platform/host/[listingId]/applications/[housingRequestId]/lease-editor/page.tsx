'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { updateHousingRequestWithBoldSignLease } from '@/app/actions/documents';

interface LeaseEditorPageProps {
  params: { listingId: string; housingRequestId: string };
}

export default function LeaseEditorPage({ params }: LeaseEditorPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRetryOption, setShowRetryOption] = useState(false);
  
  const embedUrl = searchParams.get('embedUrl');
  const documentId = searchParams.get('documentId');

  const handleRetryEdit = async () => {
    if (!documentId) {
      toast.error('No document ID available for retry');
      return;
    }

    try {
      setIsLoading(true);
      // Call API to get a new edit URL for the existing document
      const response = await fetch(`/api/leases/edit?documentId=${documentId}`);
      const data = await response.json();
      
      if (data.success && data.embedUrl) {
        // Update the URL to use the new embed URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('embedUrl', data.embedUrl);
        window.history.replaceState({}, '', newUrl.toString());
        
        // Reset states and reload iframe
        setShowRetryOption(false);
        setIsLoading(false);
        
        // Reload the iframe with the new URL
        if (iframeRef.current) {
          iframeRef.current.src = data.embedUrl;
        }
      } else {
        toast.error(data.error || 'Failed to get edit URL');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error retrying edit:', error);
      toast.error('Failed to retry editing. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!embedUrl) {
      toast.error('No embed URL provided');
      router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`);
      return;
    }

    // Handle messages from BoldSign iframe
    const handleMessage = (event: MessageEvent) => {
      console.log('=== BOLDSIGN EDITOR EVENT DEBUG ===');
      console.log('Event origin:', event.origin);
      console.log('Event data:', event.data);
      console.log('Event type:', typeof event.data);
      
      if (event.origin !== 'https://app.boldsign.com') {
        console.log('Event ignored - wrong origin');
        return;
      }

      switch (event.data) {
        case 'onDocumentSent':
          console.log('✅ Document sent successfully');
          toast.success('Lease document sent successfully!');
          // Note: Match and BoldSignLease are already created in the API route
          // The webhook will handle notifications when BoldSign sends the "Sent" event
          // Just close the window/iframe
          window.close();
          break;
        case 'onDocumentSaved':
          console.log('💾 Document saved');
          toast.success('Document saved');
          break;
        case 'onDocumentCancelled':
          console.log('❌ Document creation cancelled');
          toast.info('Document creation cancelled');
          setShowRetryOption(true);
          break;
        case 'onDocumentSendingFailed':
          console.error('❌ Failed to send document');
          toast.error('Failed to send lease document. Please try again.');
          break;
        case 'onDocumentSavingFailed':
          console.error('❌ Failed to save document');
          toast.error('Failed to save document. Please try again.');
          break;
        default:
          console.log('🔍 Unknown BoldSign editor event:', event.data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Set loading to false after iframe loads
    const timer = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [embedUrl, documentId, params, router]);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p className="mb-4">No embed URL provided for lease editing.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configure Lease Document</h1>
            <p className="text-gray-600">Add signature fields and configure your lease agreement</p>
          </div>
          <Link
            href={`/platform/host/${params.listingId}/applications/${params.housingRequestId}`}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Application
          </Link>
        </div>
      </div>

      {/* Show retry option if cancelled */}
      {showRetryOption ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>

            {/* Main Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Document Configuration Cancelled
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              The lease document configuration was cancelled. You can try again to continue editing the same document.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetryEdit}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                )}
                {isLoading ? 'Getting edit link...' : 'Try Again'}
              </button>
              
              <button
                onClick={() => router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Back to Application
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading lease editor...</p>
              </div>
            </div>
          )}

          {/* BoldSign Iframe */}
          <div className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              width="100%"
              height="800px"
              frameBorder="0"
              title="BoldSign Lease Editor"
              className="border-0"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="text-center text-sm text-gray-600">
          <p>Configure signature fields, then send the lease to both parties for signing.</p>
        </div>
      </div>
    </div>
  );
}