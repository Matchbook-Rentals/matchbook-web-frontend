'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Home, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MatchWithRelations } from '@/types';

interface LeaseSigningClientProps {
  match: MatchWithRelations;
  matchId: string;
}

export function LeaseSigningClient({ match, matchId }: LeaseSigningClientProps) {
  const router = useRouter();
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const startLeaseSigningFlow = async () => {
    console.log('=== LEASE SIGNING DEBUG ===');
    console.log('Match data:', {
      matchId: match.id,
      hasBoldSignLease: !!match.BoldSignLease,
      boldSignLeaseId: match.BoldSignLease?.id,
      leaseDocumentId: match.leaseDocumentId,
      tripUser: match.trip.user,
      listingUser: match.listing.user
    });

    // Try to get document ID from BoldSignLease first, fallback to leaseDocumentId
    const documentId = match.BoldSignLease?.id || match.leaseDocumentId;

    if (!documentId) {
      console.error('No lease document found on match');
      toast.error('No lease document found for this match');
      return;
    }

    setIsLoading(true);
    
    try {
      const requestBody = {
        documentId: documentId,
        signerEmail: match.trip.user?.email,
        signerName: match.trip.user?.firstName && match.trip.user?.lastName 
          ? `${match.trip.user.firstName} ${match.trip.user.lastName}`.trim()
          : match.trip.user?.email || 'Unknown User',
      };
      
      console.log('Request body:', requestBody);

      // Get the embed URL for lease signing
      const response = await fetch(`/api/leases/start-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to start lease signing flow: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      setEmbedUrl(data.embedUrl);
    } catch (error) {
      console.error('Error starting lease signing flow:', error);
      toast.error(`Failed to start lease signing process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== "https://app.boldsign.com") {
        return;
      }

      switch (event.data) {
        case "onDocumentSigned":
          console.log("Document signed successfully");
          toast.success('Lease signed successfully!');
          // Redirect to success page or trip dashboard
          router.push('/platform/dashboard');
          break;
        case "onDocumentSigningFailed":
          console.error("Failed to sign document");
          toast.error('Failed to sign lease');
          break;
        case "onDocumentDeclined":
          console.log("Document signing declined");
          toast.error('Lease signing was declined');
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review and Sign Lease</h1>
          <p className="text-gray-600">
            Please review your lease agreement for {match.listing.locationString}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Details Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{match.listing.locationString}</h3>
                  <p className="text-sm text-gray-600">{match.listing.propertyType}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">${match.monthlyRent}/month</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-medium">{new Date(match.trip.checkIn).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-medium">{new Date(match.trip.checkOut).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Host Contact</h4>
                  <p className="text-sm text-gray-600">
                    {match.listing.user?.firstName} {match.listing.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{match.listing.user?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Lease Agreement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!embedUrl ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Review Your Lease?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Click the button below to open your lease agreement for review and signing.
                    </p>
                    <Button 
                      onClick={startLeaseSigningFlow}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Loading...' : 'Open Lease Agreement'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        📋 Please review all terms carefully before signing. 
                        You can ask questions or request changes before finalizing the agreement.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        width="100%"
                        height="700px"
                        className="border-0"
                        title="Lease Agreement Signing"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}