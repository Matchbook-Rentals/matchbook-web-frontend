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
  const [showIframe, setShowIframe] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const embedUrl = searchParams.get('embedUrl');
  const documentId = searchParams.get('documentId');

  useEffect(() => {
    if (!embedUrl) {
      toast.error('No embed URL provided');
      router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`);
      return;
    }

    // Handle messages from BoldSign iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://app.boldsign.com') {
        return;
      }

      const { action, data } = event.data;
      console.log('BoldSign message:', action, data);

      switch (action) {
        case 'onDocumentSent':
          toast.success('Lease document sent successfully!');
          // Update database with the sent document info
          if (documentId) {
            updateHousingRequestWithBoldSignLease(params.housingRequestId, documentId)
              .then((result) => {
                if (result.success) {
                  console.log('Housing request updated with BoldSign lease');
                } else {
                  console.error('Failed to update housing request:', result.error);
                }
              });
          }
          // Hide iframe and show success state
          setShowIframe(false);
          setIsCompleted(true);
          break;
        case 'onDocumentSaved':
          toast.success('Document saved');
          break;
        case 'onDocumentCancelled':
          toast.info('Document creation cancelled');
          setShowIframe(false);
          setIsCompleted(true);
          break;
        case 'onDocumentError':
          toast.error('Error with document: ' + (data?.message || 'Unknown error'));
          break;
        case 'redirectToListing':
          // Redirect to the listing dashboard
          if (data?.listingId) {
            router.push(`/platform/host/${data.listingId}`);
          }
          break;
        default:
          console.log('Unhandled BoldSign action:', action);
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

      {/* Show iframe or success state */}
      {showIframe ? (
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
      ) : (
        /* Success State */
        <div className="flex items-center justify-center py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>

            {/* Main Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Lease Configured Successfully!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Your lease agreement has been configured and sent for signatures.
            </p>

            <p className="text-gray-700 mb-8 text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
              Please be ready to communicate with the renters to facilitate lease signing and booking in the coming days.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Back to Application
              </button>
              
              <button
                onClick={() => router.push(`/platform/host/${params.listingId}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Back to Listing Dashboard
              </button>
            </div>
          </div>
        </div>
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