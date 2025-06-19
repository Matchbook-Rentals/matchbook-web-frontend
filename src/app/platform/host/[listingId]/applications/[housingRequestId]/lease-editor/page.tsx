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
          // Redirect back to application details
          router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`);
          break;
        case 'onDocumentSaved':
          toast.success('Document saved');
          break;
        case 'onDocumentCancelled':
          toast.info('Document creation cancelled');
          router.push(`/platform/host/${params.listingId}/applications/${params.housingRequestId}`);
          break;
        case 'onDocumentError':
          toast.error('Error with document: ' + (data?.message || 'Unknown error'));
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

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="text-center text-sm text-gray-600">
          <p>Configure signature fields, then send the lease to both parties for signing.</p>
        </div>
      </div>
    </div>
  );
}