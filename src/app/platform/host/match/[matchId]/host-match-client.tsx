'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, FileText, Home, Calendar, DollarSign, CheckCircle, CreditCard, Shield, User, RefreshCw, ChevronDown } from 'lucide-react';
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
  const [isRentScheduleOpen, setIsRentScheduleOpen] = useState(false);
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

  // Generate rent payments for the lease duration (matches lease signing client logic)
  const generateRentPayments = (
    monthlyRent: number,
    startDate: Date,
    endDate: Date,
    rentDueAtBooking: number
  ) => {
    const payments: { amount: number; dueDate: Date; description: string }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Start from the first of the month after start date (or same month if starts on 1st)
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    let isFirstPayment = true;
    
    // If booking starts after the 1st, add a pro-rated payment for the partial month
    if (start.getDate() > 1) {
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const daysFromStart = daysInMonth - start.getDate() + 1;
      const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);
      
      // For first partial month, subtract the rent already paid at booking
      const finalAmount = Math.max(0, proRatedAmount - rentDueAtBooking);
      
      if (finalAmount > 0) {
        payments.push({
          amount: finalAmount,
          dueDate: start,
          description: `Pro-rated rent (${daysFromStart} days) - $${rentDueAtBooking.toFixed(2)} paid at booking`
        });
      }
      
      isFirstPayment = false;
      // Move to next month for regular payments
      currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    }
    
    // Generate monthly payments on the 1st of each month
    while (currentDate <= end) {
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Check if this is the last month and we need pro-rating
      if (monthEnd > end && end.getDate() < monthEnd.getDate()) {
        const daysInMonth = monthEnd.getDate();
        const daysToEnd = end.getDate();
        const proRatedAmount = Math.round((monthlyRent * daysToEnd) / daysInMonth);
        
        payments.push({
          amount: proRatedAmount,
          dueDate: currentDate,
          description: `Pro-rated rent (${daysToEnd} days)`
        });
      } else {
        // Full month payment - subtract rent due at booking from first payment only
        let paymentAmount = monthlyRent;
        let description = 'Monthly rent';
        
        if (isFirstPayment) {
          paymentAmount = Math.max(0, monthlyRent - rentDueAtBooking);
          description = `Monthly rent - $${rentDueAtBooking.toFixed(2)} paid at booking`;
          isFirstPayment = false;
        }
        
        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            dueDate: currentDate,
            description: description
          });
        }
      }
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return payments;
  };

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

        // If payment is completed but our local state doesn't reflect it, update the database
        if (data.stripeStatus === 'succeeded' && !match.paymentCapturedAt) {
          toast({
            title: "Payment Completed",
            description: "Payment has been successfully processed!",
          });
          
          // Update the database to mark payment as captured
          try {
            await fetch(`/api/matches/${matchId}/payment-status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'succeeded',
                capturedAt: new Date().toISOString()
              }),
            });
          } catch (error) {
            console.error('Error updating payment status in database:', error);
          }
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
  }, [match.stripePaymentIntentId, match.paymentCapturedAt, checkPaymentStatus]);

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
          // Close iframe by clearing the URL - no need to refresh, state will update automatically
          setEmbedUrl(null);
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
      
      // Update local state instead of refreshing
      setPaymentStatus(prev => ({
        ...prev,
        isCompleted: true,
        localStatus: 'succeeded'
      }));
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

  // Helper function to add credit card processing fee
  const addCreditCardFee = (originalAmount: number) => {
    return (originalAmount + 0.30) / (1 - 0.029);
  };

  // Calculate payment amount (rent due at booking + fees only - matches lease signing client)
  const calculatePaymentAmount = (paymentMethodType?: string) => {
    // Use rent due at booking, fallback to $77 if null (matches lease signing client)
    const rentDueAtBooking = match.listing.rentDueAtBooking || 77;
    
    let subtotal = rentDueAtBooking;
    
    // Add 3% application fee
    const applicationFee = Math.round(subtotal * 0.03 * 100) / 100;
    subtotal += applicationFee;
    
    // Add credit card processing fees if payment method is card
    if (paymentMethodType === 'card') {
      const totalWithCardFee = addCreditCardFee(subtotal);
      return Math.round(totalWithCardFee * 100) / 100;
    }
    
    return Math.round(subtotal * 100) / 100;
  };
  
  // Calculate breakdown for display
  const getPaymentBreakdown = (paymentMethodType?: string) => {
    const rentDueAtBooking = match.listing.rentDueAtBooking || 77;
    const applicationFee = Math.round(rentDueAtBooking * 0.03 * 100) / 100;
    
    let processingFee = 0;
    let total = rentDueAtBooking + applicationFee;
    
    if (paymentMethodType === 'card') {
      const subtotalWithAppFee = rentDueAtBooking + applicationFee;
      const totalWithCardFee = addCreditCardFee(subtotalWithAppFee);
      processingFee = Math.round((totalWithCardFee - subtotalWithAppFee) * 100) / 100;
      total = Math.round(totalWithCardFee * 100) / 100;
    }
    
    return {
      rentDueAtBooking,
      applicationFee,
      processingFee,
      total
    };
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
        return `Payment is authorized! You can now collect $${calculatePaymentAmount().toFixed(2)} (rent due at booking + fees) for ${match.listing.locationString}`;
      case 'completed': 
        return `Booking confirmed! The renter's payment of $${calculatePaymentAmount().toFixed(2)} has been processed for ${match.listing.locationString}`;
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
                    <p className="text-xs text-gray-500 mb-3">Amount collected at lease signing:</p>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rent Due At Booking</span>
                      <span className="font-medium">${getPaymentBreakdown().rentDueAtBooking.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Application Fee (3%)</span>
                      <span className="font-medium">${getPaymentBreakdown().applicationFee.toFixed(2)}</span>
                    </div>
                    {getPaymentBreakdown('card').processingFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processing Fee (if card)</span>
                        <span className="font-medium">${getPaymentBreakdown('card').processingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Amount Collected</span>
                      <span className="text-green-600">${calculatePaymentAmount().toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-3 border-t mt-4">
                      <p className="text-xs text-gray-500 mb-2">Future charges (collected separately):</p>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly Rent</span>
                        <span className="font-medium">${match.monthlyRent?.toLocaleString() || 0}/month</span>
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

                {/* Rent Payment Schedule */}
                <div className="pt-4 border-t">
                  <Collapsible open={isRentScheduleOpen} onOpenChange={setIsRentScheduleOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-0 font-semibold text-gray-900 hover:text-gray-700"
                      >
                        <span>Rent Payment Schedule</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isRentScheduleOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {(() => {
                        const startDate = new Date(match.trip.startDate);
                        const endDate = new Date(match.trip.endDate);
                        const monthlyRent = match.monthlyRent;
                        
                        if (!monthlyRent || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                          return (
                            <div className="text-sm text-gray-500 py-2">
                              Payment schedule will be available after lease details are finalized.
                            </div>
                          );
                        }
                        
                        const payments = generateRentPayments(monthlyRent, startDate, endDate, match.listing.rentDueAtBooking || 77);
                        
                        if (payments.length === 0) {
                          return (
                            <div className="text-sm text-gray-500 py-2">
                              No rent payments scheduled.
                            </div>
                          );
                        }
                        
                        const totalRent = payments.reduce((sum, payment) => sum + payment.amount, 0);
                        
                        return (
                          <>
                            {payments.map((payment, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                                <div>
                                  <p className="text-sm font-medium">{payment.description}</p>
                                  <p className="text-xs text-gray-500">
                                    Due: {payment.dueDate.toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="font-medium text-gray-900">
                                  ${payment.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                            <div className="mt-3 pt-3 border-t border-gray-200 bg-blue-50 rounded px-3 py-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-blue-900">Total Rent Income</span>
                                <span className="font-bold text-blue-900">${totalRent.toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-blue-700 mt-1">
                                {payments.length} payment{payments.length !== 1 ? 's' : ''} over {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                * Rent payments will be automatically charged monthly to the renter&apos;s payment method
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </CollapsibleContent>
                  </Collapsible>
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
                      The renter has authorized payment of ${calculatePaymentAmount().toFixed(2)} (rent due at booking + fees). 
                      Click below to collect the payment and confirm the booking.
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
                        {isLoading ? 'Processing...' : 'Collect Payment and Confirm Booking'}
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