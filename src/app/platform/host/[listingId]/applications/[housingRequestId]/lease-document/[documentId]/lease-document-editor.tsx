"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_PAGE_MARGIN } from '@/constants/styles';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Send, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeaseDocumentEditorProps {
  listingId: string;
  housingRequestId: string;
  documentId: string;
}

export const LeaseDocumentEditor = ({ listingId, housingRequestId, documentId }: LeaseDocumentEditorProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentData, setDocumentData] = useState<any>(null);
  const [embedError, setEmbedError] = useState(false);
  const [urls, setUrls] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const fetchDocumentInfo = async () => {
      try {
        const response = await fetch('/api/signnow/embed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentId }),
        });

        const result = await response.json();
        
        if (result.success) {
          setDocumentData(result.documentData);
          setUrls(result.urls);
          
          console.log('Document data:', result.documentData);
          console.log('Available URLs:', result.urls);
          console.log('Debug info:', result.debug);
          
          // Check if we have an embed URL from the v2 API
          if (result.urls.embed) {
            console.log('Using embedded editor URL:', result.urls.embed);
            setDocumentUrl(result.urls.embed);
            // Don't set timeout here - let the iframe load naturally
          } else {
            console.log('No embed URL available - reasons could be:');
            console.log('1. Document already sent for signature');
            console.log('2. Document is archived/deleted');
            console.log('3. API permissions issue');
            console.log('4. Invalid API key');
            setEmbedError(true);
          }
        } else {
          console.error('Failed to get document info:', result.error);
          setEmbedError(true);
          toast.error('Failed to load document information');
        }
      } catch (error) {
        console.error('Error fetching document info:', error);
        setEmbedError(true);
        toast.error('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentInfo();
  }, [documentId]);

  const handleSendForSignature = async () => {
    try {
      // This would call an API to send the document for signature
      toast.info('Sending document for signature functionality coming soon!');
    } catch (error) {
      toast.error('Failed to send document for signature');
    }
  };

  const handleRemoveLease = async () => {
    if (!confirm('Are you sure you want to remove this lease document? This action cannot be undone.')) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await fetch('/api/signnow/delete-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          housingRequestId,
          documentId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Lease document removed successfully');
        // Navigate back to the application page
        router.push(`/platform/host/${listingId}/applications/${housingRequestId}`);
      } else {
        toast.error(result.error || 'Failed to remove lease document');
      }
    } catch (error) {
      console.error('Error removing lease document:', error);
      toast.error('Failed to remove lease document. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full min-h-screen">
      <div className={`bg-white w-full max-w-[1920px] relative ${APP_PAGE_MARGIN} py-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href={`/platform/host/${listingId}/applications/${housingRequestId}`}
              className="hover:underline flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Application
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Edit Lease Document</h1>
              {documentData && (
                <p className="text-sm text-gray-600 mt-1">
                  {documentData.document_name} • {documentData.page_count} page(s)
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRemoveLease}
              disabled={isRemoving}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              {isRemoving ? 'Removing...' : 'Remove Lease'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                if (urls?.embed) {
                  setDocumentUrl(urls.embed);
                  setEmbedError(false);
                  setIframeLoaded(false);
                }
              }}
              disabled={!urls?.embed}
              className="flex items-center gap-2 disabled:opacity-50"
              title={!urls?.embed ? 'Embedded editor not available' : 'Use embedded editor'}
            >
              <ExternalLink className="w-4 h-4" />
              Embed Editor {!urls?.embed && '(N/A)'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => urls?.editor && window.open(urls.editor, '_blank')}
              disabled={!urls?.editor}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              Open Editor {!urls?.editor && '(N/A)'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => urls?.viewer && window.open(urls.viewer, '_blank')}
              disabled={!urls?.viewer}
              className="flex items-center gap-2 disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              Preview {!urls?.viewer && '(N/A)'}
            </Button>
            
            <Button
              onClick={handleSendForSignature}
              disabled={!documentData}
              className="flex items-center gap-2 bg-[#39b54a] hover:bg-[#2da23d] text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send for Signature
            </Button>
          </div>
        </div>

        {/* Document Editor */}
        <Card className="w-full h-[800px] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          ) : embedError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <h3 className="text-xl font-semibold mb-3">Document Ready for Editing</h3>
                <p className="text-gray-600 mb-6">
                  Your lease document has been uploaded to SignNow successfully. The embedded editor couldn't be loaded (this may require a SignNow Business account), but you can open it directly in SignNow to add signature fields, text fields, and prepare it for signing.
                </p>
                
                {documentData && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-2">Document Details:</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {documentData.document_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Pages:</strong> {documentData.page_count}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Created:</strong> {new Date(documentData.created).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    Available actions:
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button
                      onClick={() => urls?.editor && window.open(urls.editor, '_blank')}
                      disabled={!urls?.editor}
                      className="flex items-center gap-2 bg-[#5c9ac5] hover:bg-[#4a8bb3] text-white disabled:opacity-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Edit in SignNow {!urls?.editor && '(N/A)'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => urls?.viewer && window.open(urls.viewer, '_blank')}
                      disabled={!urls?.viewer}
                      className="flex items-center gap-2 disabled:opacity-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview {!urls?.viewer && '(N/A)'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => urls?.embed && setDocumentUrl(urls.embed)}
                      disabled={!urls?.embed}
                      className="flex items-center gap-2 disabled:opacity-50"
                      title={!urls?.embed ? 'Embedded editor not available - see console for details' : 'Try embedded editor'}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Try Embed {!urls?.embed && '(N/A)'}
                    </Button>
                  </div>
                  
                  {!urls?.embed && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <strong>Embed not available:</strong> Check browser console for details. 
                      Common reasons: document already sent for signature, API permissions, or account limitations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title="SignNow Embedded Document Editor"
              allow="fullscreen; camera; microphone; clipboard-write"
              onLoad={() => {
                console.log('Iframe onLoad event fired');
                setIframeLoaded(true);
                // Give it a moment to fully render before clearing any errors
                setTimeout(() => {
                  if (embedError) {
                    console.log('Iframe loaded successfully, clearing error state');
                    setEmbedError(false);
                  }
                }, 1000);
              }}
              onError={(e) => {
                console.error('Iframe onError event fired:', e);
                setEmbedError(true);
              }}
              ref={(iframe) => {
                if (iframe) {
                  // Add additional event listeners
                  iframe.addEventListener('load', () => {
                    console.log('Iframe addEventListener load fired');
                    setIframeLoaded(true);
                  });
                }
              }}
            />
          )}
        </Card>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-6 p-4 bg-gray-50 border-gray-200">
            <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <div>Embed Error: {embedError ? 'Yes' : 'No'}</div>
              <div>Iframe Loaded: {iframeLoaded ? 'Yes' : 'No'}</div>
              <div>Document URL: {documentUrl ? 'Set' : 'Not Set'}</div>
              <div>Embed URL Available: {urls?.embed ? 'Yes' : 'No'}</div>
            </div>
            {embedError && urls?.embed && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEmbedError(false);
                  setIframeLoaded(false);
                }}
                className="mt-2 text-xs"
              >
                Force Show Iframe
              </Button>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-2">How to prepare your lease document:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Add signature fields where the tenant and landlord need to sign</li>
            <li>Add text fields for any information that needs to be filled in</li>
            <li>Add date fields where dates need to be entered</li>
            <li>Position fields by dragging them to the correct location</li>
            <li>Set field properties (required, role assignment, etc.)</li>
            <li>Once ready, click "Send for Signature" to send to the tenant</li>
          </ol>
        </Card>
      </div>
    </main>
  );
};