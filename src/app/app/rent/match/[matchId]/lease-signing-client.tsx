/**
 * Lease Signing Client Component
 *
 * Handles the complete lease signing and payment flow for renters.
 * For payment logic details, see /docs/payment-spec.md
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, FileText, Home, Calendar, DollarSign, CheckCircle, CreditCard, Shield, ChevronDown, User, Banknote } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { MatchWithRelations } from '@/types';
import { PaymentMethodSelector } from '@/components/stripe/payment-method-selector';
import { PaymentReviewScreen } from '@/components/payment-review/PaymentReviewScreen';
import { PaymentInfoModal } from '@/components/stripe/payment-info-modal';
import { AdminDebugPanel } from '@/components/admin/AdminDebugPanel';
import { useSignedFieldsStore } from '@/stores/signed-fields-store';
import dynamic from 'next/dynamic';
import { calculatePayments, PaymentDetails } from '@/lib/calculate-payments';
import { calculateTotalWithStripeCardFee, FEES } from '@/lib/fee-constants';
import { calculateCreditCardFee } from '@/lib/payment-calculations';
import { useResponsivePDFWidth } from '@/hooks/useResponsivePDFWidth';
import { MobilePDFWrapper } from '@/components/pdf-editor/MobilePDFWrapper';

// Define step types for cleaner state management
type LeaseSigningStep = 
  | 'no-lease'
  | 'overview'
  | 'signing'
  | 'pdf-review'
  | 'payment'
  | 'payment-method-exists'
  | 'completed';

// Dynamic imports for PDF components to prevent SSR issues
const PDFEditor = dynamic(() => import('@/components/pdf-editor/PDFEditor').then(mod => ({ default: mod.PDFEditor })), { ssr: false });
const PDFEditorSigner = dynamic(() => import('@/components/pdf-editor/PDFEditorSigner').then(mod => ({ default: mod.PDFEditorSigner })), { ssr: false });
const PDFViewer = dynamic(() => import('@/components/pdf-editor/PDFViewer').then(mod => ({ default: mod.PDFViewer })), { ssr: false });

import { RenterSidebarFrame } from './renter-sidebar-frame';
import { BookingSummarySidebar } from './booking-summary-sidebar';
import { SigningSidebar } from './signing-sidebar';
import { StepProgress } from '@/components/StepProgress';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';

interface LeaseSigningClientProps {
  match: MatchWithRelations;
  matchId: string;
  testPaymentMethodPreview?: 'card' | 'ach';
  isAdminDev?: boolean;
  initialStep?: string;
}

export function LeaseSigningClient({ match, matchId, testPaymentMethodPreview, isAdminDev = false, initialStep }: LeaseSigningClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { initializeSignedFields } = useSignedFieldsStore();
  
  const [documentInstance, setDocumentInstance] = useState<any>(null);
  const [documentPdfFile, setDocumentPdfFile] = useState<File | null>(null);
  const [documentFields, setDocumentFields] = useState<any[]>([]);
  const [documentRecipients, setDocumentRecipients] = useState<any[]>([]);
  const [listingDocuments, setListingDocuments] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Unified step state to replace multiple booleans
  const [currentStep, setCurrentStep] = useState<LeaseSigningStep>('overview');
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>();
  const [leaseCompleted, setLeaseCompleted] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRentScheduleOpen, setIsRentScheduleOpen] = useState(true);
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState<'card' | 'ach'>(testPaymentMethodPreview || 'card');
  const [hidePaymentMethods, setHidePaymentMethods] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Responsive PDF width
  const { pdfWidth, isMobile } = useResponsivePDFWidth();
  
  // Track server-provided initial step (clear after first render to allow client transitions)
  const [serverInitialStep, setServerInitialStep] = useState(initialStep);
  
  // Track previous step for back navigation
  const [previousStep, setPreviousStep] = useState<LeaseSigningStep | null>(null);
  
  // Note: Workflow state management removed - PDFEditorSigner handles this internally

  // Update preview payment method when test prop changes
  useEffect(() => {
    if (testPaymentMethodPreview) {
      setPreviewPaymentMethod(testPaymentMethodPreview);
    }
  }, [testPaymentMethodPreview]);

  // Fetch document instance if leaseDocumentId exists
  useEffect(() => {
    const fetchDocument = async () => {
      if (match.leaseDocumentId) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/documents/${match.leaseDocumentId}`);
          if (response.ok) {
            const data = await response.json();
            const document = data.document;
            setDocumentInstance(document);
            
            // Set document ID in session storage so PDFEditor can access it
            sessionStorage.setItem('currentDocumentId', document.id);
            
            
            // Extract fields and recipients from document data
            if (document.documentData) {
              const docData = document.documentData;
              let fields = docData.fields || [];
              
              // Merge field values from fieldValues table into fields
              if (document.fieldValues && document.fieldValues.length > 0) {
                const fieldValuesMap = new Map();
                
                // Create a map of fieldId -> value
                document.fieldValues.forEach((fieldValue: any) => {
                  fieldValuesMap.set(fieldValue.fieldId, {
                    value: fieldValue.value,
                    signerIndex: fieldValue.signerIndex,
                    signedAt: fieldValue.signedAt
                  });
                });
                
                // Merge values into fields - but only for fields assigned to the current user
                // Get current renter's signer index
                const currentUserSignerIndex = (() => {
                  const signedRecipients = new Set();
                  document.fieldValues?.forEach((fieldValue: any) => {
                    if (fieldValue.signerIndex !== undefined && fieldValue.signerIndex !== null) {
                      signedRecipients.add(fieldValue.signerIndex);
                    }
                  });
                  const maxSignerIndex = signedRecipients.size > 0 ? Math.max(...Array.from(signedRecipients) as number[]) : -1;
                  return maxSignerIndex + 1;
                })();
                
                fields = fields.map((field: any) => {
                  const fieldValue = fieldValuesMap.get(field.formId);
                  
                  // Merge ALL field values (including host's) so we know what's already signed
                  if (fieldValue) {
                    return {
                      ...field,
                      value: fieldValue.value,
                      signedAt: fieldValue.signedAt,
                      signerIndex: fieldValue.signerIndex
                    };
                  }
                  return field;
                });
                
                
              }
              
              setDocumentFields(fields);
              
              // Map recipients and ensure proper titles for display
              const recipients = (docData.recipients || []).map((recipient: any, index: number) => ({
                ...recipient,
                title: recipient.role === 'landlord' ? 'Landlord' : 
                       recipient.role === 'tenant' ? 'Primary Renter' :
                       recipient.role === 'guarantor' ? 'Guarantor' :
                       recipient.title || `Signer ${index + 1}`
              }));
              
              setDocumentRecipients(recipients);

              // Initialize field status based on current field values
              const initialFieldsStatus: Record<string, 'signed' | 'pending'> = {};
              const signedFieldsMap: Record<string, any> = {};
              
              
              fields.forEach((field: any) => {
                // Field is signed if it has a value and signedAt timestamp
                const isSigned = (field.value && field.signedAt);
                initialFieldsStatus[field.formId] = isSigned ? 'signed' : 'pending';
                
                
                // Also populate Zustand store with signed field values
                if (isSigned) {
                  signedFieldsMap[field.formId] = field.value;
                }
              });
              
              setFieldsStatus(initialFieldsStatus);
              
              // Initialize Zustand store with the same data as fieldsStatus
              initializeSignedFields(signedFieldsMap);
              
              // Allow components to re-render with initialized Zustand store
              setTimeout(() => {
                setIsLoading(false);
                setIsInitializing(false);
              }, 100);
              
            } else {
              // No document data, but still mark as initialized
              setIsLoading(false);
              setIsInitializing(false);
            }
            
            // Fetch the actual PDF file
            if (document.pdfFileUrl) {
              const pdfResponse = await fetch(document.pdfFileUrl);
              if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const pdfFile = new File([pdfBlob], document.pdfFileName || 'lease.pdf', { type: 'application/pdf' });
                setDocumentPdfFile(pdfFile);
              } else {
                console.error('Failed to fetch PDF file');
                toast({
                  title: "Error",
                  description: "Failed to load PDF file",
                  variant: "destructive",
                });
              }
            }
            
          } else {
            console.error('Failed to fetch document');
            toast({
              title: "Error",
              description: "Failed to load lease document",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching document:', error);
          toast({
            title: "Error", 
            description: "Error loading lease document",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          setIsInitializing(false);
        }
      } else {
        // No lease document, still mark as initialized
        setIsInitializing(false);
      }
    };

    fetchDocument();
  }, [match.leaseDocumentId, toast]);

  // Fetch listing documents to show available templates/documents
  useEffect(() => {
    const fetchListingDocuments = async () => {
      try {
        const response = await fetch(`/api/listings/${match.listing.id}/documents`);
        if (response.ok) {
          const data = await response.json();
          setListingDocuments(data);
        } else {
          console.error('Failed to fetch listing documents');
        }
      } catch (error) {
        console.error('Error fetching listing documents:', error);
      }
    };

    fetchListingDocuments();
  }, [match.listing.id]);

  // Generate sample rent payments for display
  const generateRentPayments = (
    monthlyRent: number,
    startDate: Date,
    endDate: Date,
    actualPaymentAmount: number
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
      
      // For first partial month, subtract the actual payment amount already paid at booking
      const finalAmount = Math.max(0, proRatedAmount - actualPaymentAmount);
      
      if (finalAmount > 0) {
        payments.push({
          amount: finalAmount,
          dueDate: start,
          description: `Pro-rated rent (${daysFromStart} days) - $${actualPaymentAmount.toFixed(2)} paid at booking`
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
          paymentAmount = Math.max(0, monthlyRent - actualPaymentAmount);
          description = `Monthly rent - $${actualPaymentAmount.toFixed(2)} paid at booking`;
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

  const handleDocumentSigningComplete = async () => {
    setIsTransitioning(true);
    
    try {
      // Update match record with tenant signature timestamp
      const response = await fetch(`/api/matches/${matchId}/tenant-signed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Save current step before transitioning
        setPreviousStep('signing');
        
        // Transition to payment step (stay on same route)
        setLeaseCompleted(true);
        setCurrentStep('payment');
        
        // Clear server initial step so client-side logic takes over for transitions
        setServerInitialStep(undefined);
        
      } else {
        throw new Error('Failed to update match record');
      }
    } catch (error) {
      console.error('Error updating match record:', error);
      toast({
        title: "Warning",
        description: "Lease signed but failed to update records. Please contact support.",
        variant: "destructive",
      });
      // Still proceed to payment since document was signed
      setPreviousStep('signing');
      setLeaseCompleted(true);
      setCurrentStep('payment');
    } finally {
      setIsTransitioning(false);
    }
  };


  const handlePaymentSuccess = () => {
    toast({
      title: "Success",
      description: "Payment completed successfully! Your booking is confirmed.",
    });
    // Refresh to update state and move to next step
    window.location.reload();
  };

  const handlePaymentCancel = () => {
    setCurrentStep('overview');
    setLeaseCompleted(false);
  };

  // Debug function to manually trigger payment step (for testing)
  const handleManualPaymentTrigger = () => {
    setPreviousStep(currentStep);
    setLeaseCompleted(true);
    setCurrentStep('payment');
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

  // Note: Credit card fee calculation uses Stripe's inclusive formula
  // to ensure we receive the intended amount after fees are deducted

  // Calculate all payment details
  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent,
    petRentOverride: match.petRent,
    petDepositOverride: match.petDeposit
  });

  // Calculate total due today ONCE - this is the single source of truth
  const totalDeposits = paymentDetails.securityDeposit + (paymentDetails.petDeposit || 0);
  const transferFee = FEES.TRANSFER_FEE_DOLLARS; // Fixed $7 deposit transfer fee
  const baseAmountDue = totalDeposits + transferFee;
  
  // Calculate with/without card fee
  const totalDueTodayNoCard = baseAmountDue;
  const creditCardFee = calculateCreditCardFee(baseAmountDue);
  const totalDueTodayWithCard = baseAmountDue + creditCardFee;

  // Calculate pro-rated rent for partial first month (includes pet rent)
  const calculateProRatedRent = () => {
    const startDate = new Date(match.trip.startDate);
    const monthlyRent = paymentDetails.totalMonthlyRent; // This includes pet rent
    
    // Get the number of days in the first month
    const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    
    // Calculate days from move-in date to end of month
    const daysFromStart = daysInMonth - startDate.getDate() + 1;
    
    // Pro-rate based on days
    const proRatedAmount = (monthlyRent * daysFromStart) / daysInMonth;
    
    return Math.round(proRatedAmount * 100) / 100;
  };

  // Get total deposit amount (security + pet)
  const getSecurityDeposit = () => {
    return paymentDetails.totalDeposit;
  };

  // Get the total due today based on payment method - uses pre-calculated values
  const getTotalDueToday = (paymentMethodType?: string) => {
    return paymentMethodType === 'card' ? totalDueTodayWithCard : totalDueTodayNoCard;
  };
  
  // Calculate breakdown for display
  const getPaymentBreakdown = (paymentMethodType?: string) => {
    const proRatedRent = calculateProRatedRent();
    const securityDeposit = getSecurityDeposit();
    
    const subtotalBeforeFees = proRatedRent + securityDeposit;
    const applicationFee = Math.round(subtotalBeforeFees * 0.03 * 100) / 100;
    
    let processingFee = 0;
    let total = subtotalBeforeFees + applicationFee;
    
    if (paymentMethodType === 'card') {
      const subtotalWithAppFee = subtotalBeforeFees + applicationFee;
      const totalWithCardFee = calculateTotalWithStripeCardFee(subtotalWithAppFee);
      processingFee = Math.round((totalWithCardFee - subtotalWithAppFee) * 100) / 100;
      total = Math.round(totalWithCardFee * 100) / 100;
    }
    
    return {
      proRatedRent,
      securityDeposit,
      applicationFee,
      processingFee,
      total
    };
  };

  // Check lease signing status - use local state for tenant signing since match props don't update
  const isLeaseSigned = !!match.tenantSignedAt || leaseCompleted;
  const isLandlordSigned = !!match.landlordSignedAt;
  const isLeaseFullyExecuted = isLeaseSigned && isLandlordSigned;
  const hasLeaseDocument = !!match.leaseDocumentId;

  // Check payment completion status
  const isPaymentCompleted = !!match.paymentAuthorizedAt;
  const isPaymentCaptured = !!match.paymentCapturedAt;
  const hasPaymentMethod = !!match.stripePaymentMethodId;


  // Track field signing status for sidebar progress
  const [fieldsStatus, setFieldsStatus] = useState<Record<string, 'signed' | 'pending'>>({});

  // Handle field signing updates for real-time sidebar progress
  const handleFieldSign = (fieldId: string, value: any) => {
    setFieldsStatus(prev => ({
      ...prev,
      [fieldId]: value ? 'signed' : 'pending'
    }));
  };

  // Determine the correct signer number for the renter
  const getRenterSignerNumber = () => {
    if (!documentRecipients || documentRecipients.length === 0) {
      return 1; // Default to signer 1 if no recipients data
    }
    
    // Find which recipients have already signed by checking fieldValues
    const signedRecipients = new Set();
    if (documentInstance?.fieldValues) {
      documentInstance.fieldValues.forEach((fieldValue: any) => {
        if (fieldValue.signerIndex !== undefined && fieldValue.signerIndex !== null) {
          signedRecipients.add(fieldValue.signerIndex);
        }
      });
    }
    
    
    // Renter should be the next signer after the highest existing signer
    const maxSignerIndex = signedRecipients.size > 0 ? Math.max(...Array.from(signedRecipients) as number[]) : -1;
    const renterSignerIndex = maxSignerIndex + 1;
    
    return renterSignerIndex;
  };

  // Initialize current step based on state
  useEffect(() => {
    // Only set initial step once based on server or current state
    if (serverInitialStep && currentStep === 'overview') {
      if (serverInitialStep === 'no-lease-document') setCurrentStep('no-lease');
      else if (serverInitialStep === 'overview-lease') setCurrentStep('overview');
      else if (serverInitialStep === 'sign-lease') setCurrentStep('signing');
      else if (serverInitialStep === 'payment-method-exists') setCurrentStep('payment-method-exists');
      else if (serverInitialStep === 'complete-payment') setCurrentStep('payment');
      else if (serverInitialStep === 'completed') setCurrentStep('completed');
      setServerInitialStep(undefined);
    }
  }, [serverInitialStep, currentStep]);

  // Determine legacy step for components that still use it
  const currentStepState = (() => {
    if (currentStep === 'no-lease') return 'no-lease-document';
    if (currentStep === 'overview') return 'overview-lease';
    if (currentStep === 'signing') return 'sign-lease';
    if (currentStep === 'payment') return 'complete-payment';
    if (currentStep === 'pdf-review') return 'overview-lease'; // Treat PDF review as overview for progress
    return currentStep;
  })();

  // Map current step state to progress bar step number
  const progressCurrentStep = (() => {
    switch (currentStepState) {
      case 'no-lease-document':
      case 'overview-lease':
      case 'sign-lease':
        return 1;
      case 'complete-payment':
      case 'payment-method-exists':
        return 2;
      case 'completed':
        return 3;
      default:
        return 1;
    }
  })();

  const handleViewLease = async () => {
    if (!match.leaseDocumentId) {
      toast({
        title: "Error",
        description: "Lease document not available",
        variant: "destructive",
      });
      return;
    }
    
    // View the completed document
    window.open(`/api/documents/${match.leaseDocumentId}/view`, '_blank');
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
          amount: getTotalDueToday()
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

  // Note: Simplified for PDFEditorSigner - it handles workflow internally

  // Loading states
  const renderLoadingSpinner = (message: string) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );

  if (isInitializing) return renderLoadingSpinner("Loading lease details...");
  if (isTransitioning) return renderLoadingSpinner("Processing lease signature...");

  // Show PDF review screen when user clicks back from payment
  if (currentStep === 'pdf-review' && documentPdfFile) {
    return (
      <BrandAlertProvider>
        <div className="min-h-screen bg-gray-50">
          <div className={`container mx-auto pb-24 ${isMobile ? 'p-2' : 'p-4'}`}>
          {/* Step Progress Bar */}
          <div className="mb-8">
            <StepProgress
              currentStep={1}
              totalSteps={3}
              labels={["Review and sign", "Review and pay", "Confirmation"]}
              mobileTextBelow={true}
              className='w-full max-w-2xl'
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Review Your Signed Lease</h1>
            <p className="text-gray-600 mt-2">
              Your lease has been signed. Review the document below or proceed to payment.
            </p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Sidebar - Shows first on mobile, first on desktop (left) */}
            <div className="w-full lg:col-span-1 order-1 lg:sticky lg:top-4 lg:self-start">
              <BookingSummarySidebar
                match={match}
                paymentBreakdown={getPaymentBreakdown()}
                paymentDetails={paymentDetails}
                isUsingCard={false}
              />
            </div>

            {/* PDF Viewer with Fields - Shows second on mobile, second on desktop (right) */}
            <div className="w-full lg:col-span-2 order-2">
              <div className={`w-full ${isMobile ? 'overflow-x-auto' : ''}`}>
                <MobilePDFWrapper isMobile={isMobile}>
                  <PDFEditor
                    initialWorkflowState="completion"
                    initialPdfFile={documentPdfFile}
                    initialFields={documentFields}
                    initialRecipients={documentRecipients}
                    onSave={() => {}} // No saving in review mode
                    onCancel={() => {}} // No cancel needed
                    onFinish={() => {}} // No finish action
                    pageWidth={pdfWidth}
                  />
                </MobilePDFWrapper>
              </div>
            </div>
          </div>

          {/* Fixed Footer Controls */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
            <div className="flex items-center justify-between">
              {/* Left side - Status info */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="text-green-600 font-medium">✓ Lease signed successfully</span>
                </div>
              </div>

              {/* Right side - Action button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setCurrentStep('payment');
                  }}
                  size="lg"
                  className="bg-[#0A6060] hover:bg-[#085050]"
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </BrandAlertProvider>
    );
  }

  // Show payment selector if in payment step
  if (currentStep === 'payment' || (leaseCompleted && currentStepState === 'complete-payment')) {
    return (
      <div className="min-h-screen bg-background">
        <div className={`container mx-auto pb-24 ${isMobile ? 'p-2' : 'p-4'}`}>
          {/* Step Progress Bar */}
          <div className="mb-8">
            <StepProgress
              currentStep={2}
              totalSteps={3}
              labels={["Review and sign", "Review and pay", "Confirmation"]}
              mobileTextBelow={true}
              className='w-full max-w-2xl'
            />
          </div>
          
          {/* Header */}
          <div className="hidden md:block mb-6">
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

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Property Summary Sidebar - Shows first on mobile, first on desktop (left) */}
            <div className="w-full lg:col-span-1 order-1 lg:sticky lg:top-0 lg:self-start">
              <BookingSummarySidebar
                match={match}
                paymentBreakdown={getPaymentBreakdown(selectedPaymentMethodType)}
                paymentDetails={paymentDetails}
                isUsingCard={selectedPaymentMethodType === 'card'}
              />
            </div>

            {/* Payment Method Setup - Shows second on mobile, second on desktop (right) */}
            <div className="w-full lg:col-span-2 order-2">
              <PaymentReviewScreen
                matchId={matchId}
                amount={getTotalDueToday(selectedPaymentMethodType)}
                paymentBreakdown={{
                  monthlyRent: paymentDetails.monthlyRent, // Pass base rent
                  petRent: paymentDetails.monthlyPetRent, // Pass pet rent separately
                  securityDeposit: paymentDetails.securityDeposit, // Pass only security deposit, not total
                  petDeposit: paymentDetails.petDeposit || 0,
                  transferFee: FEES.TRANSFER_FEE_DOLLARS, // Fixed $7 deposit transfer fee for deposits
                  processingFee: selectedPaymentMethodType === 'card' 
                    ? getTotalDueToday('card') - getTotalDueToday() // Difference between card and non-card total
                    : undefined,
                  total: getTotalDueToday(selectedPaymentMethodType)
                }}
                onSuccess={handlePaymentSuccess}
                onAddPaymentMethod={() => setCurrentStep('overview')}
                onPaymentMethodChange={(methodType) => {
                  setSelectedPaymentMethodType(methodType || undefined);
                }}
                onBack={() => {
                  console.log('🔙 Back button clicked - showing PDF review screen');
                  // Show the PDF review screen
                  setCurrentStep('pdf-review');
                }}
                tripStartDate={match.trip.startDate}
                tripEndDate={match.trip.endDate}
                hidePaymentMethods={hidePaymentMethods}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrandAlertProvider>
      <div className="min-h-screen bg-gray-50">
        <div className={`container mx-auto pb-24 ${isMobile ? 'p-2' : 'p-4'}`}>
          {/* Step Progress Bar */}
          <div className="mb-8 ">
            <StepProgress
              currentStep={progressCurrentStep}
              totalSteps={3}
              labels={["Review and sign", "Review and pay", "Confirmation"]}
              mobileTextBelow={true}
              className='w-full max-w-2xl'
            />
          </div>

          {/* Admin Debug Panel for main view */}
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sidebar - shows different content based on step */}
            <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
              {currentStepState === 'overview-lease' ? (
                <BookingSummarySidebar
                  match={match}
                  paymentBreakdown={getPaymentBreakdown()}
                  paymentDetails={paymentDetails}
                  isUsingCard={false}
                />
              ) : currentStepState === 'sign-lease' ? (
                <SigningSidebar
                  fields={documentFields}
                  recipients={documentRecipients}
                  currentSignerIndex={1} // Renter is index 1
                  signedFields={fieldsStatus}
                  onNavigateToField={(fieldId) => {
                    // Navigate to field functionality can be added here
                    console.log('Navigate to field:', fieldId);
                  }}
                />
              ) : (
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
                        <span className="font-semibold">${paymentDetails.totalMonthlyRent}/month</span>
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

                      {/* Payment Breakdown - only show on non-signing steps */}
                      {currentStepState !== 'sign-lease' && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3">Move-in Costs</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Pro-rated Rent</span>
                              <span className="font-medium">${getPaymentBreakdown(hasPaymentMethod ? undefined : previewPaymentMethod).proRatedRent.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Security Deposit</span>
                              <span className="font-medium">${getPaymentBreakdown(hasPaymentMethod ? undefined : previewPaymentMethod).securityDeposit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Application Fee (3%)</span>
                              <span className="font-medium">${getPaymentBreakdown(hasPaymentMethod ? undefined : previewPaymentMethod).applicationFee.toFixed(2)}</span>
                            </div>
                            {!hasPaymentMethod && previewPaymentMethod === 'card' && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Processing Fee (2.9% + $0.30)</span>
                                <span className="font-medium">${getPaymentBreakdown(previewPaymentMethod).processingFee.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2 font-semibold">
                              <span>Total Due Today</span>
                              <span className="text-green-600">${getTotalDueToday(hasPaymentMethod ? undefined : previewPaymentMethod).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              }
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className='bg-inherit border-none'>
                <CardContent>
                  {currentStepState === 'no-lease-document' ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Lease Being Prepared
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Your host is currently preparing your lease document. You will be notified when it&apos;s ready for signing.
                      </p>
                      
                      {listingDocuments && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 max-w-md mx-auto">
                          <h4 className="font-semibold text-blue-900 mb-2">Debug Info</h4>
                          <div className="text-left text-sm text-blue-800 space-y-1">
                            <p>Templates available: {listingDocuments.summary?.totalTemplates || 0}</p>
                            <p>Documents created: {listingDocuments.summary?.totalDocuments || 0}</p>
                            <p>Awaiting signature: {listingDocuments.summary?.documentsAwaitingSignature || 0}</p>
                            <p>Completed: {listingDocuments.summary?.documentsCompleted || 0}</p>
                          </div>
                          
                          {listingDocuments.documents && listingDocuments.documents.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-300">
                              <p className="text-xs text-blue-700 font-semibold mb-1">Recent Documents:</p>
                              {listingDocuments.documents.slice(0, 3).map((doc: any, index: number) => (
                                <div key={index} className="text-xs text-blue-700">
                                  {doc.template.title} - {doc.currentStep} ({doc.status})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : currentStepState === 'overview-lease' && !isLoading && documentInstance && documentPdfFile ? (
                    <div className="space-y-4">
                      {/* PDF Preview */}
                      <div className={`border rounded-lg overflow-hidden bg-gray-50 ${isMobile ? 'overflow-x-auto' : ''}`}>
                        <MobilePDFWrapper isMobile={isMobile}>
                          <PDFViewer
                            file={documentPdfFile}
                            pageWidth={pdfWidth}
                          />
                        </MobilePDFWrapper>
                      </div>
                    </div>
                  ) : currentStepState === 'sign-lease' && !isLoading && documentInstance && documentPdfFile ? (
                    <div className={`border rounded-lg bg-gray-50 ${isMobile ? 'overflow-x-auto' : ''}`}>
                      <PDFEditorSigner
                        initialPdfFile={documentPdfFile}
                        initialFields={documentFields}
                        initialRecipients={documentRecipients}
                        signerStep="signer2"
                        isMobile={isMobile}
                        hideDefaultSidebar={true}
                        showFooter={true}
                        onSave={(data) => {
                        }}
                        onCancel={() => {
                          setCurrentStep('overview');
                          toast({
                            title: "Returned to lease review",
                            description: "You can proceed to sign when ready.",
                          });
                        }}
                        onFinish={handleDocumentSigningComplete}
                      />
                    </div>
                  ) : currentStepState === 'sign-lease' && isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
                      <p className="text-[#777b8b]">Loading lease document...</p>
                    </div>
                  ) : currentStepState === 'payment-method-exists' ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Payment Method Found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        We found an existing payment method on your account. Please complete your payment of ${getTotalDueToday().toFixed(2)}.
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
                          onClick={() => {
                            setPreviousStep('payment-method-exists');
                            setCurrentStep('payment');
                          }}
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
                    <div className="space-y-6">
                      {/* Completion Header */}
                      <div className="text-center py-8">
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
                            onClick={() => router.push('/app/dashboard')}
                            size="lg"
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                          </Button>
                        </div>
                      </div>

                      {/* Payment Receipt */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Payment Receipt</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Pro-rated Rent</span>
                            <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).proRatedRent.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-green-600 mt-1 ml-4">
                            * Partial payment for move-in month
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Security Deposit</span>
                            <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).securityDeposit.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-green-600 mt-1 ml-4">
                            * Refundable at lease end
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Application Fee (3%)</span>
                            <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).applicationFee.toFixed(2)}</span>
                          </div>
                          {selectedPaymentMethodType === 'card' && getPaymentBreakdown(selectedPaymentMethodType).processingFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm text-green-700">Processing Fee</span>
                              <span className="font-medium text-green-900">${getPaymentBreakdown(selectedPaymentMethodType).processingFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-green-300 pt-2 font-semibold">
                            <span className="text-green-900">Total Paid</span>
                            <span className="text-green-900">${getTotalDueToday(selectedPaymentMethodType).toFixed(2)}</span>
                          </div>
                          <div className="mt-4 pt-4 border-t border-green-300">
                            <p className="text-xs text-green-700">
                              Payment processed on {new Date().toLocaleDateString()} • Transaction ID: {match.stripePaymentMethodId || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Future Payments Schedule */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Your Rent Payment Schedule</h4>
                        </div>
                        {(() => {
                          const startDate = new Date(match.trip.startDate);
                          const endDate = new Date(match.trip.endDate);
                          const monthlyRent = paymentDetails.totalMonthlyRent;
                          
                          if (!monthlyRent || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return (
                              <div className="text-sm text-blue-700 py-2">
                                Payment schedule will be available after lease details are finalized.
                              </div>
                            );
                          }
                          
                          const payments = generateRentPayments(monthlyRent, startDate, endDate, calculateProRatedRent());
                          
                          if (payments.length === 0) {
                            return (
                              <div className="text-sm text-blue-700 py-2">
                                No additional rent payments scheduled.
                              </div>
                            );
                          }
                          
                          const totalRent = payments.reduce((sum, payment) => sum + payment.amount, 0);
                          
                          return (
                            <div className="space-y-3">
                              {payments.map((payment, index) => (
                                <div key={index} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-blue-200">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">{payment.description}</p>
                                    <p className="text-xs text-blue-600">
                                      Due: {payment.dueDate.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className="font-medium text-blue-900">
                                    ${payment.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              <div className="mt-4 pt-4 border-t border-blue-300 bg-blue-100 rounded-lg px-4 py-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold text-blue-900">Total Rent Due</span>
                                  <span className="font-bold text-blue-900">${totalRent.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-blue-700 mt-1">
                                  {payments.length} payment{payments.length !== 1 ? 's' : ''} over {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-blue-300">
                                <p className="text-xs text-blue-700">
                                  💳 These payments will be automatically charged to your saved payment method on the due dates above.
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Host Contact Information */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-5 h-5 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">Your Host Contact</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {match.listing.user?.firstName} {match.listing.user?.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{match.listing.user?.email}</span>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <p className="text-xs text-gray-500">
                              📞 Contact your host for any questions about the property, move-in instructions, or lease terms.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Controls - Fixed at bottom - only show for overview and completed states (PDFEditor has its own footer for signing) */}
          {(currentStepState === 'overview-lease' || currentStepState === 'completed') && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-40" style={{ height: '80px' }}>
              <div className="flex items-center justify-between">
                {/* Left side - Status info */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {currentStepState === 'overview-lease' && (
                      <>
                        <span className="font-medium">{documentFields.length}</span> fields • 
                        <span className="font-medium">{documentRecipients.length}</span> recipients
                      </>
                    )}
                    {currentStepState === 'sign-lease' && (
                      <>
                        {(() => {
                          // Only count renter's signature/initial fields
                          const renterSignatureFields = documentFields.filter((field: any) => {
                            if (field.recipientIndex !== 1) return false;
                            const fieldType = typeof field.type === 'string' ? field.type : (field.type?.type || field.type?.value || '');
                            return fieldType === 'SIGNATURE' || fieldType === 'INITIALS';
                          });
                          const completedRenterFields = renterSignatureFields.filter((field: any) => 
                            fieldsStatus[field.formId] === 'signed'
                          );
                          return renterSignatureFields.length === 0 ? (
                            <span className="text-gray-600">No signature required - you may review the document</span>
                          ) : (
                            <>
                              <span className="font-medium">{completedRenterFields.length}</span> of <span className="font-medium">{renterSignatureFields.length}</span> fields completed
                            </>
                          );
                        })()}
                      </>
                    )}
                    {currentStepState === 'completed' && (
                      <span className="text-green-600 font-medium">✓ Lease signed and payment completed</span>
                    )}
                  </div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-3">
                  {currentStepState === 'overview-lease' && (
                    <Button 
                      onClick={() => {
                        setPreviousStep('overview');
                        setCurrentStep('signing');
                        setServerInitialStep(undefined); // Clear server step to allow client transition
                      }}
                      size="sm"
                      className="bg-[#0a6060] hover:bg-[#0a6060]/90"
                    >
                      Proceed to Sign
                    </Button>
                  )}
                  {currentStepState === 'completed' && (
                    <Button 
                      onClick={handleViewLease}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Signed Lease
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

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
    </BrandAlertProvider>
  );
}
