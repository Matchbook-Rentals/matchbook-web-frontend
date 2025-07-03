'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Home, Calendar, DollarSign, CheckCircle, CreditCard, Shield, User, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';

interface HostMatchClientProps {
  match: MatchWithRelations;
  matchId: string;
}

export default function HostMatchClient({ match, matchId }: HostMatchClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    localStatus: string | null;
    stripeStatus: string | null;
    isCompleted: boolean;
  }>({
    localStatus: match.paymentStatus || null,
    stripeStatus: null,
    isCompleted: !!match.paymentCapturedAt,
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const checkPaymentStatus = async () => {
    if (!match.stripePaymentIntentId) {
      return;
    }

    setIsCheckingPayment(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/payment-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus({
          localStatus: data.localStatus,
          stripeStatus: data.stripeStatus,
          isCompleted: data.stripeStatus === 'succeeded' || !!data.capturedAt,
        });

        // If payment is completed but our local state doesn't reflect it, refresh the page
        if (data.stripeStatus === 'succeeded' && !match.paymentCapturedAt) {
          toast({
            title: "Payment Completed",
            description: "Payment has been successfully processed! Refreshing page...",
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Check payment status on component mount and periodically if payment is pending
  useEffect(() => {
    if (match.stripePaymentIntentId && !match.paymentCapturedAt) {
      checkPaymentStatus();
      
      // Poll every 30 seconds if payment is authorized but not captured
      const interval = setInterval(checkPaymentStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [match.stripePaymentIntentId, match.paymentCapturedAt]);

  const startLeaseSigningFlow = async () => {
    console.log('=== HOST LEASE SIGNING DEBUG ===');
    console.log('Match data:', {
      matchId: match.id,
      hasBoldSignLease: !!match.BoldSignLease,
      boldSignLeaseId: match.BoldSignLease?.id,
      leaseDocumentId: match.leaseDocumentId,
      hostUser: match.listing.user,
      tenantUser: match.trip.user
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
        signerEmail: match.listing.user?.email,
        signerName: match.listing.user?.firstName && match.listing.user?.lastName 
          ? `${match.listing.user.firstName} ${match.listing.user.lastName}`.trim()
          : match.listing.user?.email || 'Unknown Host',
      };
      
      console.log('Host signing request body:', requestBody);

      // Get the embed URL for host lease signing
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
      console.log('=== HOST BOLDSIGN EVENT DEBUG ===');
      console.log('Event origin:', event.origin);
      console.log('Event data:', event.data);
      console.log('Event type:', typeof event.data);
      
      if (event.origin !== "https://app.boldsign.com") {
        console.log('Event ignored - wrong origin');
        return;
      }

      // Handle both direct string events and object-wrapped events
      let eventType = event.data;
      if (typeof event.data === 'object' && event.data !== null) {
        // Check if event is wrapped in an object
        eventType = event.data.type || event.data.eventType || event.data.action || event.data;
        console.log('Extracted event type from object:', eventType);
      }

      switch (eventType) {
        case "onDocumentSigned":
          console.log("✅ Host document signed successfully");
          toast({
            title: "Success",
            description: "Lease signed successfully! The renter can now proceed with payment.",
          });
          // Close iframe by clearing the URL and refresh the page to update status
          setEmbedUrl(null);
          window.location.reload();
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
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast]);

  const handleViewLease = async () => {
    if (!match.BoldSignLease?.id) {
      toast({
        title: "Error",
        description: "Lease document not available",
        variant: "destructive",
      });
      return;
    }
    
    window.open(`/api/leases/view?documentId=${match.BoldSignLease.id}`, '_blank');
  };

  const handleSetupStripeConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Stripe Connect account: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.accountLinkUrl) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.accountLinkUrl;
      } else {
        throw new Error('No account link URL returned');
      }
    } catch (error) {
      console.error('Error setting up Stripe Connect:', error);
      toast({
        title: "Error",
        description: `Failed to setup payment processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectPayment = async () => {
    if (!isPaymentAuthorized) {
      toast({
        title: "Error",
        description: "Payment has not been authorized by the renter yet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/capture-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to capture payment: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Payment captured successfully! Booking is now confirmed.",
      });
      
      // Refresh to update the status
      window.location.reload();
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast({
        title: "Error",
        description: `Failed to capture payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  const isTenantSigned = match.BoldSignLease?.tenantSigned || false;
  const isHostSigned = match.BoldSignLease?.landlordSigned || false;
  const isLeaseFullyExecuted = isTenantSigned && isHostSigned;

  // Check payment status - use enhanced state that includes Stripe status
  const isPaymentAuthorized = !!match.paymentAuthorizedAt;
  const isPaymentCaptured = paymentStatus.isCompleted || !!match.paymentCapturedAt;
  const hasPaymentMethod = !!match.stripePaymentMethodId;

  // Check Stripe Connect setup
  const hasStripeConnect = !!match.listing.user?.stripeAccountId;

  // Determine current step for host
  const getCurrentStep = () => {
    if (!hasStripeConnect) return 'setup-stripe-connect';
    if (!isTenantSigned) return 'waiting-tenant-signature';
    if (!isHostSigned) return 'sign-lease';
    if (!isPaymentAuthorized) return 'waiting-payment-auth';
    if (!isPaymentCaptured) return 'ready-to-collect';
    return 'completed';
  };

  const currentStep = getCurrentStep();

  const getStepTitle = () => {
    switch (currentStep) {
      case 'setup-stripe-connect': return 'Setup Payment Processing';
      case 'waiting-tenant-signature': return 'Waiting for Renter Signature';
      case 'sign-lease': return 'Review and Sign Lease';
      case 'waiting-payment-auth': return 'Waiting for Payment Authorization';
      case 'ready-to-collect': return 'Ready to Collect Payment';
      case 'completed': return 'Booking Complete';
      default: return 'Lease Management';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'setup-stripe-connect': 
        return `You need to set up payment processing with Stripe Connect to receive payments for ${match.listing.locationString}`;
      case 'waiting-tenant-signature': 
        return `The renter needs to review and sign the lease agreement for ${match.listing.locationString}`;
      case 'sign-lease': 
        return `Please review and sign the lease agreement for ${match.listing.locationString}`;
      case 'waiting-payment-auth': 
        return `The renter needs to authorize payment for ${match.listing.locationString}`;
      case 'ready-to-collect': 
        return `Payment is authorized! You can now collect the deposits and confirm the booking for ${match.listing.locationString}`;
      case 'completed': 
        return `Booking confirmed! The renter's payment has been processed for ${match.listing.locationString}`;
      default: 
        return `Manage the lease agreement for ${match.listing.locationString}`;
    }
  };

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
            Back to Bookings
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getStepTitle()}
          </h1>
          <p className="text-gray-600">
            {getStepDescription()}
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
                  <p className="text-sm text-gray-600">{match.listing.title}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">${match.monthlyRent?.toLocaleString()}/month</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Move-in</p>
                    <p className="font-medium">{new Date(match.trip.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Move-out</p>
                    <p className="font-medium">{new Date(match.trip.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Payment Details</h4>
                  <div className="space-y-2">
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
                      <span>Total Amount</span>
                      <span className="text-green-600">${calculatePaymentAmount().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Status */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Progress Status</h4>
                    {match.stripePaymentIntentId && !isPaymentCaptured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkPaymentStatus}
                        disabled={isCheckingPayment}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                        {isCheckingPayment ? 'Checking...' : 'Refresh'}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isTenantSigned ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isTenantSigned ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Signed by Renter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isHostSigned ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isHostSigned ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Signed by You
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
                      {isPaymentCaptured ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isPaymentCaptured ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Payment Collected
                      </span>
                      {paymentStatus.stripeStatus && paymentStatus.stripeStatus !== paymentStatus.localStatus && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Stripe: {paymentStatus.stripeStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Renter Contact */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Renter Contact</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {match.trip.user?.firstName} {match.trip.user?.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{match.trip.user?.email}</p>
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
                {currentStep === 'setup-stripe-connect' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Setup Payment Processing
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You need to set up Stripe Connect to receive payments from renters. This is required to collect deposits and rent payments.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                      <p className="text-blue-800 text-sm">
                        🔒 Stripe Connect provides secure payment processing with built-in fraud protection and compliance.
                      </p>
                    </div>
                    <Button 
                      onClick={handleSetupStripeConnect}
                      disabled={isLoading}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isLoading ? 'Setting up...' : 'Setup Payment Processing'}
                    </Button>
                  </div>
                ) : currentStep === 'waiting-tenant-signature' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Waiting for Renter to Sign
                    </h3>
                    <p className="text-gray-600 mb-6">
                      The lease agreement has been sent to the renter. They need to review and sign it before you can proceed.
                    </p>
                    <Button 
                      onClick={handleViewLease}
                      variant="outline"
                      size="lg"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Lease Agreement
                    </Button>
                  </div>
                ) : currentStep === 'sign-lease' && !embedUrl ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Sign the Lease?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      The renter has signed the lease. Now it&apos;s your turn to review and sign the agreement.
                    </p>
                    <Button 
                      onClick={startLeaseSigningFlow}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? 'Loading...' : 'Open Lease Agreement'}
                    </Button>
                  </div>
                ) : currentStep === 'sign-lease' && embedUrl ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm">
                        📋 Please review all terms carefully before signing. 
                        Make sure all details are correct for your property.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        width="100%"
                        height="700px"
                        className="border-0"
                        title="Host Lease Agreement Signing"
                      />
                    </div>
                  </div>
                ) : currentStep === 'waiting-payment-auth' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Waiting for Payment Authorization
                    </h3>
                    <p className="text-gray-600 mb-4">
                      The lease is fully signed! The renter now needs to authorize payment before you can collect the deposits.
                    </p>
                    
                    {/* Real-time payment checking notice */}
                    {match.stripePaymentIntentId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <RefreshCw className={`w-4 h-4 text-blue-600 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                          <span className="text-sm font-medium text-blue-800">
                            Monitoring Payment Status
                          </span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          This page will automatically update when payment is authorized
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleViewLease}
                      variant="outline"
                      size="lg"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Signed Lease
                    </Button>
                  </div>
                ) : currentStep === 'ready-to-collect' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Collect Payment!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      The renter has authorized payment of ${calculatePaymentAmount().toLocaleString()}. 
                      Click below to collect the deposits and confirm the booking.
                    </p>
                    
                    {/* Payment Status Details */}
                    {paymentStatus.stripeStatus && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Payment Status: {paymentStatus.stripeStatus}
                          </span>
                          {isCheckingPayment && (
                            <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                          )}
                        </div>
                        <p className="text-green-700 text-sm">
                          Payment is secured and ready to be captured
                        </p>
                      </div>
                    )}

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
                        onClick={handleCollectPayment}
                        disabled={isLoading}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {isLoading ? 'Processing...' : 'Collect Deposits and Confirm Booking'}
                      </Button>
                    </div>
                  </div>
                ) : currentStep === 'completed' ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Booking Complete!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Congratulations! The booking is confirmed and payment has been processed. 
                      The renter can now move in on {new Date(match.trip.startDate).toLocaleDateString()}.
                    </p>
                    <Button 
                      onClick={handleViewLease}
                      variant="outline"
                      size="lg"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Final Lease
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}