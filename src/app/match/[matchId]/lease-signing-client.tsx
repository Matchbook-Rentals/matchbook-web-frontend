'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Home, Calendar, DollarSign, CheckCircle, CreditCard, Shield } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';
import { PaymentMethodSelector } from '@/components/stripe/payment-method-selector';
import { PaymentInfoModal } from '@/components/stripe/payment-info-modal';

interface LeaseSigningClientProps {
  match: MatchWithRelations;
  matchId: string;
}

export function LeaseSigningClient({ match, matchId }: LeaseSigningClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [leaseCompleted, setLeaseCompleted] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
      toast({
        title: "Error",
        description: "No lease document found for this match",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: `Failed to start lease signing process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      console.log('=== BOLDSIGN EVENT DEBUG ===');
      console.log('Event origin:', event.origin);
      console.log('Event data:', event.data);
      console.log('Event type:', typeof event.data);
      console.log('Event data stringified:', JSON.stringify(event.data));
      console.log('Event source:', event.source);
      
      // Check if this is a BoldSign event (ignore Stripe and other iframe events)
      const isBoldSignEvent = event.origin.includes('boldsign.com') || event.origin === window.location.origin;
      const isStripeEvent = event.origin.includes('stripe.com') || event.origin.includes('js.stripe.com');
      
      if (isStripeEvent) {
        console.log('Event ignored - Stripe event detected:', event.origin);
        return;
      }
      
      if (!isBoldSignEvent) {
        console.log('Event ignored - wrong origin:', event.origin);
        return;
      }
      
      console.log('✅ BoldSign event detected from origin:', event.origin);

      // Handle both direct string events and object-wrapped events
      let eventType = event.data;
      if (typeof event.data === 'object' && event.data !== null) {
        // Check if event is wrapped in an object
        eventType = event.data.type || event.data.eventType || event.data.action || event.data;
        console.log('Extracted event type from object:', eventType);
      }

      switch (eventType) {
        case "onDocumentSigned":
        case "onDocumentSent":
          console.log("✅ Document signed/sent successfully - transitioning to payment");
          setIsTransitioning(true);
          toast({
            title: "Success",
            description: "Lease signed successfully! Now please set up your payment method.",
          });
          // Clear iframe first to prevent dual rendering
          setEmbedUrl(null);
          // Then set completion states
          setLeaseCompleted(true);
          setShowPaymentSelector(true);
          setIsTransitioning(false);
          break;
        case "onDocumentSigningFailed":
          console.error("❌ Failed to sign document");
          toast({
            title: "Error",
            description: "Failed to sign lease. Please try again.",
            variant: "destructive",
          });
          break;
        case "onDocumentDeclined":
          console.log("🚫 Document signing declined");
          toast({
            title: "Declined",
            description: "Lease signing was declined",
            variant: "destructive",
          });
          // Optionally close iframe and allow retry
          setEmbedUrl(null);
          break;
        case "onDocumentDecliningFailed":
          console.error("❌ Failed to decline document");
          toast({
            title: "Error",
            description: "Failed to decline lease",
            variant: "destructive",
          });
          break;
        case "onDocumentReassigned":
          console.log("🔄 Document reassigned successfully");
          toast({
            title: "Info",
            description: "Document has been reassigned",
          });
          break;
        case "onDocumentReassigningFailed":
          console.error("❌ Failed to reassign document");
          toast({
            title: "Error",
            description: "Failed to reassign document",
            variant: "destructive",
          });
          break;
        default:
          console.log('🔍 Unknown BoldSign event:', event.data);
          console.log('🔍 Event type was:', eventType);
          console.log('🔍 Original event.data:', JSON.stringify(event.data, null, 2));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast]);

  const handlePaymentSuccess = () => {
    toast({
      title: "Success",
      description: "Payment authorized successfully! Waiting for landlord to sign the lease.",
    });
    // Refresh to update state and move to waiting step
    window.location.reload();
  };

  const handlePaymentCancel = () => {
    setShowPaymentSelector(false);
    setLeaseCompleted(false);
  };

  // Debug function to manually trigger payment step (for testing)
  const handleManualPaymentTrigger = () => {
    console.log('🧪 Manually triggering payment step for testing');
    setEmbedUrl(null);
    setLeaseCompleted(true);
    setShowPaymentSelector(true);
    toast({
      title: "Debug",
      description: "Payment step triggered manually",
    });
  };

  // Debug function to clear payment info (for testing)
  const handleClearPaymentInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/clear-payment`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear payment info');
      }

      toast({
        title: "Debug",
        description: "Payment information cleared successfully",
      });
      
      // Refresh the page to update the state
      window.location.reload();
    } catch (error) {
      console.error('Clear payment error:', error);
      toast({
        title: "Error",
        description: "Failed to clear payment information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate payment amount (deposit + first month rent)
  const calculatePaymentAmount = () => {
    const monthlyRent = match.monthlyRent || 0;
    const deposit = match.listing.depositSize || 0;
    const petDeposit = match.listing.petDeposit || 0;
    return monthlyRent + deposit + petDeposit;
  };

  // Check lease signing status
  const isLeaseSigned = match.BoldSignLease?.tenantSigned || false;
  const isLandlordSigned = match.BoldSignLease?.landlordSigned || false;
  const isLeaseFullyExecuted = isLeaseSigned && isLandlordSigned;

  // Check payment authorization status
  const isPaymentAuthorized = !!match.paymentAuthorizedAt;
  const isPaymentCaptured = !!match.paymentCapturedAt;
  const hasPaymentMethod = !!match.stripePaymentMethodId;

  // Determine current step
  const getCurrentStep = () => {
    if (!isLeaseSigned) return 'sign-lease';
    if (isLeaseSigned && hasPaymentMethod && !isPaymentAuthorized) return 'payment-method-exists';
    if (!isPaymentAuthorized) return 'authorize-payment';
    if (!isLandlordSigned) return 'waiting-landlord';
    if (!isPaymentCaptured) return 'payment-pending';
    return 'completed';
  };

  const currentStep = getCurrentStep();

  const handleViewLease = async () => {
    if (!match.BoldSignLease?.id) {
      toast({
        title: "Error",
        description: "Lease document not available",
        variant: "destructive",
      });
      return;
    }
    
    // Use the new view endpoint for signed documents
    window.open(`/api/leases/view?documentId=${match.BoldSignLease.id}`, '_blank');
  };

  const handleViewPaymentInfo = () => {
    setShowPaymentInfoModal(true);
  };

  const handleAuthorizeExistingPayment = async () => {
    if (!hasPaymentMethod) {
      toast({
        title: "Error",
        description: "No payment method found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/authorize-existing-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: calculatePaymentAmount()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authorize payment');
      }

      toast({
        title: "Success",
        description: "Payment authorized successfully! Waiting for landlord to sign the lease.",
      });
      // Refresh the page to update the state and move to next step
      window.location.reload();
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: "Error",
        description: "Failed to authorize payment method",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading during transition
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing lease signature...</p>
        </div>
      </div>
    );
  }

  // Show payment selector if lease is completed or if forced by showPaymentSelector
  if (showPaymentSelector || currentStep === 'authorize-payment') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Lease Signed Successfully!</h1>
            </div>
            <p className="text-gray-600">
              Complete your booking by setting up your payment method for {match.listing.locationString}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{match.listing.locationString}</h3>
                    <p className="text-sm text-gray-600">{match.listing.propertyType}</p>
                  </div>
                  
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Rent</span>
                      <span className="font-medium">${match.monthlyRent?.toLocaleString() || 0}</span>
                    </div>
                    {match.listing.depositSize > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Security Deposit</span>
                        <span className="font-medium">${match.listing.depositSize.toLocaleString()}</span>
                      </div>
                    )}
                    {match.listing.petDeposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pet Deposit</span>
                        <span className="font-medium">${match.listing.petDeposit.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Pre-authorized Amount</span>
                      <span className="text-green-600">${calculatePaymentAmount().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Setup */}
            <div className="lg:col-span-2">
              <PaymentMethodSelector
                matchId={matchId}
                amount={calculatePaymentAmount()}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 'sign-lease' ? 'Review and Sign Lease' :
             currentStep === 'authorize-payment' ? 'Set Up Payment Method' :
             currentStep === 'payment-method-exists' ? 'Authorize Payment Method' :
             currentStep === 'waiting-landlord' ? 'Review & Wait for Landlord' :
             currentStep === 'payment-pending' ? 'Processing Payment' :
             currentStep === 'completed' ? 'Booking Complete' : 'Lease Management'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 'sign-lease' ? `Please review your lease agreement for ${match.listing.locationString}` :
             currentStep === 'authorize-payment' ? `Complete your booking by setting up payment for ${match.listing.locationString}` :
             currentStep === 'payment-method-exists' ? `Authorize your existing payment method for ${match.listing.locationString}` :
             currentStep === 'waiting-landlord' ? `You've completed all steps! Review your information while waiting for the landlord to finalize the lease` :
             currentStep === 'payment-pending' ? `Processing payment for your booking at ${match.listing.locationString}` :
             currentStep === 'completed' ? `Congratulations! Your booking at ${match.listing.locationString} is complete` :
             `Manage your lease for ${match.listing.locationString}`}
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

                {/* Progress Status */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Progress Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isLeaseSigned ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isLeaseSigned ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Lease Signed by You
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPaymentAuthorized ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isPaymentAuthorized ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Payment Authorized
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLandlordSigned ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isLandlordSigned ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Lease Signed by Host
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPaymentCaptured ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isPaymentCaptured ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Payment Processed
                      </span>
                    </div>
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
                {currentStep === 'sign-lease' && !embedUrl ? (
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
                ) : currentStep === 'sign-lease' && embedUrl && !isTransitioning ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        📋 Please review all terms carefully before signing. 
                        You can ask questions or request changes before finalizing the agreement.
                      </p>
                    </div>
                    
                    {/* Debug button for testing - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm mb-3">🧪 Development Mode:</p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleManualPaymentTrigger}
                            variant="outline"
                            size="sm"
                          >
                            Test Payment Flow
                          </Button>
                          <Button 
                            onClick={() => {
                              console.log('🧪 Manually triggering onDocumentSigned event');
                              // Simulate the BoldSign event
                              window.postMessage('onDocumentSigned', window.location.origin);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Test Signing Event
                          </Button>
                          <Button 
                            onClick={handleClearPaymentInfo}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                          >
                            Clear Payment Info
                          </Button>
                        </div>
                      </div>
                    )}
                    
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
                ) : currentStep === 'authorize-payment' ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Lease Signed Successfully!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your lease has been signed. Now complete the process by setting up your payment method.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleViewLease}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Signed Lease
                      </Button>
                      <Button 
                        onClick={() => setShowPaymentSelector(true)}
                        size="lg"
                      >
                        Set Up Payment
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 'payment-method-exists' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Payment Method Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      We found an existing payment method on your account. Please authorize the pre-authorization for ${calculatePaymentAmount().toLocaleString()}.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                      <p className="text-blue-800 text-sm">
                        💳 Your saved payment method will be pre-authorized but not charged until the landlord signs the lease.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleViewLease}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Lease
                      </Button>
                      <Button 
                        onClick={() => setShowPaymentSelector(true)}
                        variant="outline"
                        size="lg"
                      >
                        Use Different Card
                      </Button>
                      <Button 
                        onClick={handleAuthorizeExistingPayment}
                        disabled={isLoading}
                        size="lg"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {isLoading ? 'Authorizing...' : 'Authorize Payment'}
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 'waiting-landlord' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Almost Complete!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      🎉 Excellent work! You&apos;ve successfully completed your part of the process.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                      <h4 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h4>
                      <p className="text-blue-800 text-sm">
                        Your landlord has been notified and will sign the lease within 24-48 hours. 
                        Once they sign, your payment will be processed and you&apos;ll receive confirmation.
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Your Completed Steps:</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• Lease agreement signed</li>
                        <li>• Payment method authorized (${calculatePaymentAmount().toLocaleString()})</li>
                        <li>• All documentation complete</li>
                      </ul>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleViewLease}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Review Signed Lease
                      </Button>
                      <Button 
                        onClick={handleViewPaymentInfo}
                        variant="outline"
                        size="lg"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Payment Details
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 'payment-pending' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Processing Payment
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Both parties have signed the lease. Payment is being processed.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleViewLease}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Lease
                      </Button>
                      <Button 
                        onClick={handleViewPaymentInfo}
                        variant="outline"
                        size="lg"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        View Payment Info
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 'completed' ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Booking Complete!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your lease has been fully executed and payment has been processed. Welcome to your new home!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={handleViewLease}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Lease
                      </Button>
                      <Button 
                        onClick={() => router.push('/platform/dashboard')}
                        size="lg"
                      >
                        <Home className="w-4 h-4 mr-2" />
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Info Modal */}
        <PaymentInfoModal
          matchId={matchId}
          paymentAmount={match.paymentAmount}
          paymentAuthorizedAt={match.paymentAuthorizedAt}
          paymentCapturedAt={match.paymentCapturedAt}
          stripePaymentMethodId={match.stripePaymentMethodId}
          isOpen={showPaymentInfoModal}
          onClose={() => setShowPaymentInfoModal(false)}
        />
      </div>
    </div>
  );
}