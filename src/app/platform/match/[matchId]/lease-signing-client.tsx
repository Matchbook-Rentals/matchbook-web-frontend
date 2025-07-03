'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, FileText, Home, Calendar, DollarSign, CheckCircle, CreditCard, Shield, ChevronDown } from 'lucide-react';
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
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>();
  const [leaseCompleted, setLeaseCompleted] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRentScheduleOpen, setIsRentScheduleOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate sample rent payments for display
  const generateRentPayments = (
    monthlyRent: number,
    startDate: Date,
    endDate: Date
  ) => {
    console.log('generateRentPayments called with:', { monthlyRent, startDate, endDate });
    const payments: { amount: number; dueDate: Date; description: string }[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Date processing:', {
      originalStart: startDate,
      originalEnd: endDate,
      processedStart: start,
      processedEnd: end,
      startValid: !isNaN(start.getTime()),
      endValid: !isNaN(end.getTime())
    });
    
    // Start from the first of the month after start date (or same month if starts on 1st)
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    
    // If booking starts after the 1st, add a pro-rated payment for the partial month
    if (start.getDate() > 1) {
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      const daysFromStart = daysInMonth - start.getDate() + 1;
      const proRatedAmount = Math.round((monthlyRent * daysFromStart) / daysInMonth);
      
      payments.push({
        amount: proRatedAmount,
        dueDate: start,
        description: `Pro-rated rent (${daysFromStart} days)`
      });
      
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
        // Full month payment
        payments.push({
          amount: monthlyRent,
          dueDate: currentDate,
          description: 'Monthly rent'
        });
      }
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    console.log('Generated payments:', payments);
    return payments;
  };

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
  }, []);

  const handlePaymentSuccess = () => {
    toast({
      title: "Success",
      description: "Payment completed successfully! Your booking is confirmed.",
    });
    // Refresh to update state and move to next step
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

  // Helper function to add credit card processing fee
  const addCreditCardFee = (originalAmount: number) => {
    return (originalAmount + 0.30) / (1 - 0.029);
  };

  // Calculate payment amount (reservation deposit only + fees)
  const calculatePaymentAmount = (paymentMethodType?: string) => {
    // Use reservation deposit, fallback to $77 if null
    // MARKED FOR DELETION: $77 fallback logic should be removed once all listings have reservation deposits
    const reservationDeposit = match.listing.reservationDeposit || 77;
    
    let subtotal = reservationDeposit;
    
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
    // MARKED FOR DELETION: $77 fallback logic should be removed once all listings have reservation deposits
    const reservationDeposit = match.listing.reservationDeposit || 77;
    const applicationFee = Math.round(reservationDeposit * 0.03 * 100) / 100;
    
    let processingFee = 0;
    let total = reservationDeposit + applicationFee;
    
    if (paymentMethodType === 'card') {
      const subtotalWithAppFee = reservationDeposit + applicationFee;
      const totalWithCardFee = addCreditCardFee(subtotalWithAppFee);
      processingFee = Math.round((totalWithCardFee - subtotalWithAppFee) * 100) / 100;
      total = Math.round(totalWithCardFee * 100) / 100;
    }
    
    return {
      reservationDeposit,
      applicationFee,
      processingFee,
      total
    };
  };

  // Check lease signing status
  const isLeaseSigned = match.BoldSignLease?.tenantSigned || false;
  const isLandlordSigned = match.BoldSignLease?.landlordSigned || false;
  const isLeaseFullyExecuted = isLeaseSigned && isLandlordSigned;

  // Check payment completion status
  const isPaymentCompleted = !!match.paymentAuthorizedAt;
  const isPaymentCaptured = !!match.paymentCapturedAt;
  const hasPaymentMethod = !!match.stripePaymentMethodId;

  // Determine current step
  const getCurrentStep = () => {
    if (!isLeaseSigned) return 'sign-lease';
    if (isLeaseSigned && hasPaymentMethod && !isPaymentCompleted) return 'payment-method-exists';
    if (!isPaymentCompleted) return 'complete-payment';
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

  const handleCompleteExistingPayment = async () => {
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
        throw new Error('Failed to complete payment');
      }

      toast({
        title: "Success",
        description: "Payment completed successfully! Your booking is confirmed.",
      });
      // Refresh the page to update the state and move to next step
      window.location.reload();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Failed to complete payment",
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
  if (showPaymentSelector || currentStep === 'complete-payment') {
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
                      <span className="text-sm text-gray-600">Reservation Deposit</span>
                      <span className="font-medium">${(match.listing.reservationDeposit || 77).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Application Fee (3%)</span>
                      <span className="font-medium">${getPaymentBreakdown(selectedPaymentMethodType).applicationFee.toFixed(2)}</span>
                    </div>
                    {selectedPaymentMethodType === 'card' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processing Fee (2.9% + $0.30)</span>
                        <span className="font-medium">${getPaymentBreakdown(selectedPaymentMethodType).processingFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total Due Today</span>
                      <span className="text-green-600">${calculatePaymentAmount(selectedPaymentMethodType).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Rent Payment Schedule */}
                  <div className="border-t pt-4">
                    <Collapsible open={isRentScheduleOpen} onOpenChange={setIsRentScheduleOpen}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between p-0 font-medium text-gray-900 hover:text-gray-700"
                        >
                          <span>Rent Payment Schedule</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isRentScheduleOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-2">
                        {(() => {
                          console.log('Debug rent payments data:', {
                            tripStartDate: match.trip.startDate,
                            tripEndDate: match.trip.endDate,
                            monthlyRent: match.monthlyRent,
                            tripData: match.trip
                          });
                          
                          const startDate = new Date(match.trip.startDate);
                          const endDate = new Date(match.trip.endDate);
                          const monthlyRent = match.monthlyRent;
                          
                          console.log('Parsed dates:', {
                            startDate: !isNaN(startDate.getTime()) ? startDate.toISOString() : 'Invalid Date',
                            endDate: !isNaN(endDate.getTime()) ? endDate.toISOString() : 'Invalid Date',
                            monthlyRent,
                            isValidStart: !isNaN(startDate.getTime()),
                            isValidEnd: !isNaN(endDate.getTime())
                          });
                          
                          if (!monthlyRent || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return (
                              <div className="text-sm text-gray-500 py-2">
                                Payment schedule will be available after lease details are finalized.
                                <br />
                                <small>Debug: monthlyRent={monthlyRent}, startDate={startDate?.toString()}, endDate={endDate?.toString()}</small>
                              </div>
                            );
                          }
                          
                          const payments = generateRentPayments(monthlyRent, startDate, endDate);
                          
                          if (payments.length === 0) {
                            return (
                              <div className="text-sm text-gray-500 py-2">
                                No rent payments scheduled.
                              </div>
                            );
                          }
                          
                          return payments.map((payment, index) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">{payment.description}</p>
                                <p className="text-xs text-gray-500">
                                  Due: {payment.dueDate.toLocaleDateString()}
                                </p>
                              </div>
                              <span className="font-medium text-gray-900">
                                ${payment.amount.toFixed(2)}
                              </span>
                            </div>
                          ));
                        })()}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            * These payments will be automatically charged to your payment method monthly
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Setup */}
            <div className="lg:col-span-2">
              <PaymentMethodSelector
                matchId={matchId}
                amount={calculatePaymentAmount(selectedPaymentMethodType)}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onPaymentMethodTypeChange={setSelectedPaymentMethodType}
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
             currentStep === 'complete-payment' ? 'Complete Payment' :
             currentStep === 'payment-method-exists' ? 'Complete Payment' :
             currentStep === 'completed' ? 'Booking Complete' : 'Lease Management'}
          </h1>
          <p className="text-gray-600">
            {currentStep === 'sign-lease' ? `Please review your lease agreement for ${match.listing.locationString}` :
             currentStep === 'complete-payment' ? `Complete your booking by paying for ${match.listing.locationString}` :
             currentStep === 'payment-method-exists' ? `Complete your payment for ${match.listing.locationString}` :
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
                    <p className="font-medium">{new Date(match.trip.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-medium">{new Date(match.trip.endDate).toLocaleDateString()}</p>
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
                      {isPaymentCompleted ? 
                        <CheckCircle className="w-4 h-4 text-green-600" /> : 
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      }
                      <span className={`text-sm ${isPaymentCompleted ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        Payment Completed
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
                ) : currentStep === 'complete-payment' ? (
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
                        Complete Payment
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
                      We found an existing payment method on your account. Please complete your payment of ${calculatePaymentAmount().toFixed(2)}.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                      <p className="text-blue-800 text-sm">
                        💳 Your payment will be processed immediately to secure your lease.
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
                        onClick={handleCompleteExistingPayment}
                        disabled={isLoading}
                        size="lg"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {isLoading ? 'Processing...' : 'Complete Payment'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Booking Complete!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your lease has been signed and payment has been completed. Welcome to your new home!
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
