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
import { PaymentInfoModal } from '@/components/stripe/payment-info-modal';
import { PDFEditor } from '@/components/pdf-editor/PDFEditor';
import { PDFViewer } from '@/components/pdf-editor/PDFViewer';
import { RenterSidebarFrame } from './renter-sidebar-frame';
import { BookingSummarySidebar } from './booking-summary-sidebar';
import { StepProgress } from '@/components/brandDialog';
import { BrandAlertProvider } from '@/hooks/useBrandAlert';

interface LeaseSigningClientProps {
  match: MatchWithRelations;
  matchId: string;
  testPaymentMethodPreview?: 'card' | 'ach';
}

export function LeaseSigningClient({ match, matchId, testPaymentMethodPreview }: LeaseSigningClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Debug logging to see what data we have
  console.log('=== LEASE SIGNING DEBUG ===');
  console.log('Match data:', {
    id: match.id,
    leaseDocumentId: match.leaseDocumentId,
    tenantSignedAt: match.tenantSignedAt,
    landlordSignedAt: match.landlordSignedAt,
    BoldSignLease: match.BoldSignLease,
    Lease: match.Lease
  });
  const [documentInstance, setDocumentInstance] = useState<any>(null);
  const [documentPdfFile, setDocumentPdfFile] = useState<File | null>(null);
  const [documentFields, setDocumentFields] = useState<any[]>([]);
  const [documentRecipients, setDocumentRecipients] = useState<any[]>([]);
  const [listingDocuments, setListingDocuments] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string>();
  const [leaseCompleted, setLeaseCompleted] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRentScheduleOpen, setIsRentScheduleOpen] = useState(true);
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState<'card' | 'ach'>(testPaymentMethodPreview || 'card');

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
          console.log('📄 Fetching document instance:', match.leaseDocumentId);
          const response = await fetch(`/api/documents/${match.leaseDocumentId}`);
          if (response.ok) {
            const data = await response.json();
            const document = data.document;
            setDocumentInstance(document);
            
            // Set document ID in session storage so PDFEditor can access it
            sessionStorage.setItem('currentDocumentId', document.id);
            
            console.log('📄 Document fetched:', {
              id: document.id,
              pdfFileUrl: document.pdfFileUrl,
              hasDocumentData: !!document.documentData
            });
            
            // Extract fields and recipients from document data
            if (document.documentData) {
              const docData = document.documentData;
              let fields = docData.fields || [];
              
              // Merge field values from fieldValues table into fields
              if (document.fieldValues && document.fieldValues.length > 0) {
                console.log('📄 Merging field values into fields...');
                const fieldValuesMap = new Map();
                
                // Create a map of fieldId -> value
                document.fieldValues.forEach((fieldValue: any) => {
                  fieldValuesMap.set(fieldValue.fieldId, {
                    value: fieldValue.value,
                    signerIndex: fieldValue.signerIndex,
                    signedAt: fieldValue.signedAt
                  });
                  console.log(`📄 Field ${fieldValue.fieldId} has value: "${fieldValue.value}" (signer ${fieldValue.signerIndex})`);
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
                  
                  // Only merge values if this field belongs to the current user AND they signed it
                  if (fieldValue && field.recipientIndex === currentUserSignerIndex && fieldValue.signerIndex === currentUserSignerIndex) {
                    return {
                      ...field,
                      value: fieldValue.value,
                      signedAt: fieldValue.signedAt,
                      signerIndex: fieldValue.signerIndex
                    };
                  }
                  return field; // Return field without pre-signed values from other users
                });
                
                console.log('📄 All fields structure check:', fields.map((f: any, index: number) => ({
                  index,
                  id: f.formId,
                  type: f.type,
                  typeOf: typeof f.type,
                  typeKeys: f.type && typeof f.type === 'object' ? Object.keys(f.type) : null,
                  value: f.value,
                  valueOf: typeof f.value,
                  valueKeys: f.value && typeof f.value === 'object' ? Object.keys(f.value) : null,
                  signerIndex: f.signerIndex,
                  fieldMeta: f.fieldMeta,
                  fieldMetaKeys: f.fieldMeta && typeof f.fieldMeta === 'object' ? Object.keys(f.fieldMeta) : null
                })));
                
                console.log('📄 Fields with merged values:', fields.filter((f: any) => f.value).map((f: any) => ({
                  id: f.formId,
                  type: f.type,
                  typeOf: typeof f.type,
                  value: f.value,
                  valueOf: typeof f.value,
                  signerIndex: f.signerIndex,
                  fieldMeta: f.fieldMeta
                })));
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
              fields.forEach((field: any) => {
                // Field is signed if it has a value and signedAt timestamp
                initialFieldsStatus[field.formId] = (field.value && field.signedAt) ? 'signed' : 'pending';
              });
              setFieldsStatus(initialFieldsStatus);
              console.log('📄 Initial fields status:', initialFieldsStatus);
              
              console.log('📄 Extracted from document:', {
                fieldsCount: fields?.length || 0,
                fieldsWithValues: fields?.filter((f: any) => f.value)?.length || 0,
                recipientsCount: docData.recipients?.length || 0,
                recipients: docData.recipients?.map((r: any) => ({ name: r.name, email: r.email, role: r.role }))
              });
            }
            
            // Fetch the actual PDF file
            if (document.pdfFileUrl) {
              console.log('📄 Fetching PDF file from:', document.pdfFileUrl);
              const pdfResponse = await fetch(document.pdfFileUrl);
              if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const pdfFile = new File([pdfBlob], document.pdfFileName || 'lease.pdf', { type: 'application/pdf' });
                setDocumentPdfFile(pdfFile);
                console.log('📄 PDF file loaded:', {
                  name: pdfFile.name,
                  size: pdfFile.size,
                  type: pdfFile.type
                });
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
        }
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
          console.log('Listing documents:', data);
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
    console.log('generateRentPayments called with:', { monthlyRent, startDate, endDate, actualPaymentAmount });
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
    
    console.log('Generated payments:', payments);
    return payments;
  };

  const handleDocumentSigningComplete = async () => {
    console.log('✅ Document signing completed by tenant');
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
        toast({
          title: "Success",
          description: "Lease signed successfully! Now please set up your payment method.",
        });
        setLeaseCompleted(true);
        setShowPaymentSelector(true);
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
      setLeaseCompleted(true);
      setShowPaymentSelector(true);
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
    setShowPaymentSelector(false);
    setLeaseCompleted(false);
  };

  // Debug function to manually trigger payment step (for testing)
  const handleManualPaymentTrigger = () => {
    console.log('🧪 Manually triggering payment step for testing');
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

  // Calculate pro-rated rent for partial first month
  const calculateProRatedRent = () => {
    const startDate = new Date(match.trip.startDate);
    const monthlyRent = match.monthlyRent || 0;
    
    // Get the number of days in the first month
    const firstMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    
    // Calculate days from move-in date to end of month
    const daysFromStart = daysInMonth - startDate.getDate() + 1;
    
    // Pro-rate based on days
    const proRatedAmount = (monthlyRent * daysFromStart) / daysInMonth;
    
    console.log('🔍 Pro-rated rent calculation:', 
      'startDate:', startDate.toDateString(),
      'startDate.getDate():', startDate.getDate(),
      'monthlyRent:', monthlyRent,
      'daysInMonth:', daysInMonth,
      'daysFromStart:', daysFromStart,
      'proRatedAmount:', proRatedAmount,
      'finalAmount:', Math.round(proRatedAmount * 100) / 100
    );
    
    return Math.round(proRatedAmount * 100) / 100;
  };

  // Get security deposit amount (typically 1x monthly rent)
  const getSecurityDeposit = () => {
    const deposit = match.monthlyRent || 0;
    console.log('🔍 Security deposit calculation:', 
      'monthlyRent:', match.monthlyRent,
      'deposit:', deposit
    );
    return deposit;
  };

  // Calculate payment amount (pro-rated rent + security deposit + fees)
  const calculatePaymentAmount = (paymentMethodType?: string) => {
    const proRatedRent = calculateProRatedRent();
    const securityDeposit = getSecurityDeposit();
    
    let subtotal = proRatedRent + securityDeposit;
    
    // Add 3% application fee on the subtotal
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
    const proRatedRent = calculateProRatedRent();
    const securityDeposit = getSecurityDeposit();
    
    console.log('🔍 Payment breakdown calculation:', 
      'proRatedRent:', proRatedRent,
      'securityDeposit:', securityDeposit,
      'matchMonthlyRent:', match.monthlyRent
    );
    const subtotalBeforeFees = proRatedRent + securityDeposit;
    const applicationFee = Math.round(subtotalBeforeFees * 0.03 * 100) / 100;
    
    let processingFee = 0;
    let total = subtotalBeforeFees + applicationFee;
    
    if (paymentMethodType === 'card') {
      const subtotalWithAppFee = subtotalBeforeFees + applicationFee;
      const totalWithCardFee = addCreditCardFee(subtotalWithAppFee);
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

  // Check lease signing status
  const isLeaseSigned = !!match.tenantSignedAt;
  const isLandlordSigned = !!match.landlordSignedAt;
  const isLeaseFullyExecuted = isLeaseSigned && isLandlordSigned;
  const hasLeaseDocument = !!match.leaseDocumentId;

  // Check payment completion status
  const isPaymentCompleted = !!match.paymentAuthorizedAt;
  const isPaymentCaptured = !!match.paymentCapturedAt;
  const hasPaymentMethod = !!match.stripePaymentMethodId;

  // Add state for overview vs signing mode
  const [showSigningMode, setShowSigningMode] = useState(false);

  // Track field signing status for sidebar progress
  const [fieldsStatus, setFieldsStatus] = useState<Record<string, 'signed' | 'pending'>>({});

  // Handle field signing updates for real-time sidebar progress
  const handleFieldSign = (fieldId: string, value: any) => {
    console.log('🔍 Field signed:', fieldId, 'with value:', value);
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
    
    console.log('🔍 Signed recipients:', Array.from(signedRecipients));
    console.log('🔍 Total recipients:', documentRecipients.length);
    
    // Renter should be the next signer after the highest existing signer
    const maxSignerIndex = signedRecipients.size > 0 ? Math.max(...Array.from(signedRecipients) as number[]) : -1;
    const renterSignerIndex = maxSignerIndex + 1;
    
    console.log('🔍 Renter should be signer:', renterSignerIndex);
    return renterSignerIndex;
  };

  // Determine current step
  const getCurrentStep = () => {
    if (!hasLeaseDocument) return 'no-lease-document';
    if (!isLeaseSigned && !showSigningMode) return 'overview-lease';
    if (!isLeaseSigned && showSigningMode) return 'sign-lease';
    if (isLeaseSigned && hasPaymentMethod && !isPaymentCompleted) return 'payment-method-exists';
    if (!isPaymentCompleted) return 'complete-payment';
    return 'completed';
  };

  const currentStepState = getCurrentStep();

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
  if (showPaymentSelector || currentStepState === 'complete-payment') {
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
            
            {/* HACKY BAD TEMPORARY CODE - REMOVE BEFORE PRODUCTION */}
            {process.env.NODE_ENV === 'development' && match.tenantSignedAt && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-3">🚨 HACKY BAD TEMPORARY CODE - Reset lease signing for testing</p>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (confirm('Reset lease signing state? This will undo tenant signature.')) {
                      try {
                        const response = await fetch(`/api/matches/${matchId}/reset-tenant-signature`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        if (response.ok) {
                          toast({
                            title: "Success", 
                            description: "Lease signing state reset. Refreshing page...",
                          });
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          throw new Error('Failed to reset');
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to reset lease signing state",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  🔄 Reset Tenant Signature (HACKY DEBUG)
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property Summary Sidebar */}
            <div className="lg:col-span-1">
              <BookingSummarySidebar match={match} paymentBreakdown={getPaymentBreakdown(selectedPaymentMethodType)} />
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
    <BrandAlertProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 pb-24">
          {/* Step Progress Bar */}
          <div className="mb-8">
            <StepProgress 
              currentStep={progressCurrentStep}
              totalSteps={3}
              labels={["Review and sign lease agreement", "Review and pay", "Confirmation"]}
            />
          </div>

          <div className={`grid grid-cols-1 gap-6 ${currentStepState === 'sign-lease' ? '' : 'lg:grid-cols-3'}`}>
            {/* Sidebar - shows different content based on step */}
            {currentStepState !== 'sign-lease' && (
              <div className="lg:col-span-1">
                {currentStepState === 'overview-lease' ? (
                  <BookingSummarySidebar match={match} paymentBreakdown={getPaymentBreakdown()} />
                ) : (
                  <Card className='test'>
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
                              <span className="text-green-600">${calculatePaymentAmount(hasPaymentMethod ? undefined : previewPaymentMethod).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {/* Main Content */}
            <div className={currentStepState === 'sign-lease' ? '' : 'lg:col-span-2'}>
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
                      <div className="border rounded-lg overflow-hidden bg-gray-50">
                        <PDFViewer
                          file={documentPdfFile}
                          pageWidth={800}
                        />
                      </div>
                    </div>
                  ) : currentStepState === 'sign-lease' && !isLoading && documentInstance && documentPdfFile ? (
                    <div className="space-y-4">
                      
                      <div className="min-h-[600px]">
                        <PDFEditor
                          initialWorkflowState={(() => {
                            const currentUserSignerIndex = getRenterSignerNumber();
                            console.log('🔍 Setting workflow state for renter signerIndex:', currentUserSignerIndex);
                            
                            // PDFEditor maps: signer1 = recipientIndex 0, signer2 = recipientIndex 1
                            // Find what recipientIndex this renter should have in the document fields
                            const renterFields = documentFields.filter(f => f.recipientIndex === currentUserSignerIndex);
                            console.log('🔍 Renter fields with recipientIndex', currentUserSignerIndex, ':', renterFields.length);
                            
                            // Map recipientIndex to workflow state
                            return currentUserSignerIndex === 0 ? 'signer1' : 'signer2';
                          })()}
                          initialPdfFile={documentPdfFile}
                          initialFields={documentFields}
                          initialRecipients={documentRecipients}
                          onFinish={handleDocumentSigningComplete}
                          onFieldSign={handleFieldSign}
                          onCancel={() => {
                            toast({
                              title: "Signing cancelled",
                              description: "You can return to sign the lease at any time.",
                            });
                          }}
                          customSidebarContent={(workflowState, defaultSidebar) => (
                            <RenterSidebarFrame 
                              match={match} 
                              documentFields={documentFields}
                              fieldsStatus={fieldsStatus}
                              showTitle={true}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ) : currentStepState === 'sign-lease' && isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3c8787] mx-auto mb-4"></div>
                      <p className="text-[#777b8b]">Loading lease document...</p>
                    </div>
                  ) : currentStepState === 'complete-payment' ? (
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
                  ) : currentStepState === 'payment-method-exists' ? (
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
                            <span className="text-green-900">${calculatePaymentAmount(selectedPaymentMethodType).toFixed(2)}</span>
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
                          const monthlyRent = match.monthlyRent;
                          
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

          {/* Footer Controls - Fixed at bottom - only show for overview, signing and completed states */}
          {(currentStepState === 'overview-lease' || currentStepState === 'sign-lease' || currentStepState === 'completed') && (
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
                        <span className="font-medium">{Object.values(fieldsStatus).filter(status => status === 'signed').length}</span> of <span className="font-medium">{Object.keys(fieldsStatus).length}</span> fields completed
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
                      onClick={() => setShowSigningMode(true)}
                      size="sm"
                      className="bg-[#0a6060] hover:bg-[#0a6060]/90"
                    >
                      Proceed to Sign
                    </Button>
                  )}
                  {currentStepState === 'sign-lease' && (
                    <Button 
                      size="sm"
                      className="bg-[#0a6060] hover:bg-[#0a6060]/90"
                      disabled
                    >
                      Next Action
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
