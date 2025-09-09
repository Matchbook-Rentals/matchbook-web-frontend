'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Shield, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';
import { PaymentReviewScreen } from '@/components/payment-review/PaymentReviewScreen';
import { PaymentInfoModal } from '@/components/stripe/payment-info-modal';
import { AdminDebugPanel } from '@/components/admin/AdminDebugPanel';
import { StepProgress } from '@/components/StepProgress';
import { BookingSummarySidebar } from '../booking-summary-sidebar';
import { calculatePayments } from '@/lib/calculate-payments';
import type { PaymentMethod } from '@/app/actions/payment-methods';
import { processDirectPayment } from '@/app/actions/process-payment';
import { calculateTotalWithStripeCardFee } from '@/lib/fee-constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentSetupClientProps {
  match: MatchWithRelations;
  matchId: string;
  isAdminDev?: boolean;
  paymentMethods: PaymentMethod[];
}

export function PaymentSetupClient({ match, matchId, isAdminDev = false, paymentMethods }: PaymentSetupClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Calculate payment details
  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent
  });

  // Fixed transfer fee for deposits
  const TRANSFER_FEE = 5;

  // Get total deposit amount
  const getSecurityDeposit = () => {
    return paymentDetails.totalDeposit;
  };
  
  // Get pet deposit if applicable
  const getPetDeposit = () => {
    return paymentDetails.petDeposit || 0;
  };

  // Calculate payment amount (deposits + fees only, no rent)
  const calculatePaymentAmount = (paymentMethodType?: string) => {
    const securityDeposit = getSecurityDeposit();
    const petDeposit = getPetDeposit();
    
    // Base amount is deposits + transfer fee
    let subtotal = securityDeposit + petDeposit + TRANSFER_FEE;
    
    // Add Stripe's credit card processing fees (2.9% + $0.30) if using card
    // This ensures we receive the full intended amount after Stripe's fees
    if (paymentMethodType === 'card') {
      const totalWithCardFee = calculateTotalWithStripeCardFee(subtotal);
      return Math.round(totalWithCardFee * 100) / 100;
    }
    
    return Math.round(subtotal * 100) / 100;
  };
  
  // Calculate breakdown for display (deposits + fees only, no rent)
  const getPaymentBreakdown = (paymentMethodType?: string) => {
    const securityDeposit = getSecurityDeposit();
    const petDeposit = getPetDeposit();
    
    // Base amount is deposits + transfer fee
    const subtotalBeforeFees = securityDeposit + petDeposit;
    
    let processingFee = 0;
    let total = subtotalBeforeFees + TRANSFER_FEE;
    
    if (paymentMethodType === 'card') {
      // Calculate total with Stripe's inclusive fee formula
      const totalWithCardFee = calculateTotalWithStripeCardFee(total);
      processingFee = Math.round((totalWithCardFee - total) * 100) / 100;
      total = Math.round(totalWithCardFee * 100) / 100;
    }
    
    return {
      securityDeposit,
      petDeposit,
      transferFee: TRANSFER_FEE,
      processingFee,
      total
    };
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Success",
      description: "Payment completed successfully! Your booking is confirmed.",
    });
    router.push(`/app/rent/match/${matchId}/complete`);
  };

  const handleViewLease = async () => {
    if (!match.leaseDocumentId) {
      toast({
        title: "Error",
        description: "Lease document not available",
        variant: "destructive",
      });
      return;
    }
    window.open(`/api/documents/${match.leaseDocumentId}/view`, '_blank');
  };

  const handleCompleteExistingPayment = async () => {
    if (!match.stripePaymentMethodId) {
      toast({
        title: "Error",
        description: "No payment method found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setShowProcessingDialog(true);
    setProcessingStatus('processing');
    setProcessingError(null);
    
    try {
      console.log('💳 Processing payment with existing method:', match.stripePaymentMethodId);
      
      const result = await processDirectPayment({
        matchId,
        paymentMethodId: match.stripePaymentMethodId,
        amount: calculatePaymentAmount(),
        includeCardFee: false // Existing payment method, fee already determined
      });

      if (result.success) {
        setProcessingStatus('success');
        setTimeout(() => {
          setShowProcessingDialog(false);
          toast({
            title: "Success",
            description: "Payment completed successfully! Your booking is confirmed.",
          });
          router.push(`/app/rent/match/${matchId}/complete`);
        }, 1500);
      } else {
        setProcessingStatus('error');
        setProcessingError(result.error || 'Payment failed. Please try again.');
        console.error('Payment failed:', result.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setProcessingStatus('error');
      setProcessingError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if payment method exists
  const hasPaymentMethod = !!match.stripePaymentMethodId;

  if (hasPaymentMethod && !hidePaymentMethods) {
    // Show existing payment method screen
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 pb-24">
          {/* Step Progress Bar */}
          <div className="mb-8">
            <StepProgress 
              currentStep={2}
              totalSteps={3}
              labels={["Review and sign lease agreement", "Review and pay", "Confirmation"]}
              className='w-full max-w-2xl'
            />
          </div>

          {/* Admin Debug Panel */}
          {isAdminDev && (
            <div className="mb-6">
              <AdminDebugPanel 
                match={match}
                matchId={matchId}
                isAdminDev={isAdminDev}
                onHidePaymentMethods={() => setHidePaymentMethods(true)}
              />
            </div>
          )}

          <div className="max-w-2xl mx-auto">
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
                  onClick={() => setHidePaymentMethods(true)}
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
          </div>
        </div>
      </div>
    );
  }

  // Show payment method setup screen
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Lease Signed Successfully!</h1>
          </div>
          <p className="text-gray-600">
            Complete your booking by setting up your payment method for {match.listing.locationString}
          </p>
          
          {/* Admin Debug Panel */}
          {isAdminDev && (
            <div className="mt-4">
              <AdminDebugPanel 
                match={match}
                matchId={matchId}
                isAdminDev={isAdminDev}
                onHidePaymentMethods={() => setHidePaymentMethods(true)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Summary Sidebar */}
          <div className="lg:col-span-1">
            <BookingSummarySidebar 
              match={match} 
              paymentBreakdown={getPaymentBreakdown(selectedPaymentMethodType)} 
              paymentDetails={paymentDetails}
              isUsingCard={selectedPaymentMethodType === 'card'}
            />
          </div>

          {/* Payment Method Setup */}
          <div className="lg:col-span-2">
            <PaymentReviewScreen
              matchId={matchId}
              amount={calculatePaymentAmount(selectedPaymentMethodType)}
              paymentBreakdown={{
                monthlyRent: 0, // No rent charged today
                securityDeposit: getSecurityDeposit(),
                petDeposit: getPetDeposit(),
                transferFee: TRANSFER_FEE, // Flat $5 transfer fee for deposits
                processingFee: selectedPaymentMethodType === 'card' 
                  ? calculatePaymentAmount('card') - calculatePaymentAmount() // Difference between card and non-card total
                  : undefined,
                total: calculatePaymentAmount(selectedPaymentMethodType)
              }}
              onSuccess={handlePaymentSuccess}
              onAddPaymentMethod={() => {}}
              onPaymentMethodChange={(methodType) => {
                setSelectedPaymentMethodType(methodType || undefined);
              }}
              onBack={() => {
                router.push(`/app/rent/match/${matchId}/review`);
              }}
              tripStartDate={match.trip.startDate}
              tripEndDate={match.trip.endDate}
              hidePaymentMethods={hidePaymentMethods}
              initialPaymentMethods={paymentMethods}
            />
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
        
        {/* Payment Processing Dialog */}
        <Dialog open={showProcessingDialog} onOpenChange={(open) => {
          // Only allow closing if there's an error
          if (!open && processingStatus === 'error') {
            setShowProcessingDialog(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {processingStatus === 'processing' && 'Processing Payment'}
                {processingStatus === 'success' && 'Payment Successful!'}
                {processingStatus === 'error' && 'Payment Failed'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-6">
              {processingStatus === 'processing' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-center text-gray-600">
                    Processing your payment of ${calculatePaymentAmount().toFixed(2)}...
                  </p>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Please do not close this window.
                  </p>
                </>
              )}
              
              {processingStatus === 'success' && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-center text-gray-600">
                    Your payment has been processed successfully!
                  </p>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Redirecting to confirmation...
                  </p>
                </>
              )}
              
              {processingStatus === 'error' && (
                <>
                  <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                  <p className="text-center text-gray-600">
                    {processingError || 'Payment could not be processed.'}
                  </p>
                  <Button
                    onClick={() => {
                      setShowProcessingDialog(false);
                      setProcessingStatus('processing');
                      setProcessingError(null);
                    }}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}