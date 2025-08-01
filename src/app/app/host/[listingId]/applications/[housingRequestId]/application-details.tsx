"use client";

import { ChevronDownIcon, Upload, Trash2, Loader2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { HousingRequest, User, Application, Income, ResidentialHistory, Listing, Identification, IDPhoto } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateRent, calculateLengthOfStay as calculateStayLength } from "@/lib/calculate-rent";
import { approveHousingRequest, declineHousingRequest, undoApprovalHousingRequest, undoDeclineHousingRequest } from "@/app/actions/housing-requests";
import { createBoldSignLeaseFromHousingRequest, removeBoldSignLease } from "@/app/actions/documents";
import { toast } from "sonner";
import { StripeConnectVerificationDialog } from "@/components/brandDialog";
import { useClientLogger } from "@/hooks/useClientLogger";
import { useUser } from "@clerk/nextjs";

interface HousingRequestWithUser extends HousingRequest {
  user: User & {
    applications: (Application & {
      incomes: Income[];
      residentialHistories: ResidentialHistory[];
      identifications: (Identification & {
        idPhotos: IDPhoto[];
      })[];
    })[];
  };
  listing: Listing;
  trip?: any;
  hasBooking?: boolean;
  boldSignLeaseId?: string | null;
  match?: {
    id: string;
    stripePaymentMethodId?: string | null;
    paymentAuthorizedAt?: Date | null;
    paymentAmount?: number | null;
    paymentCapturedAt?: Date | null;
    paymentStatus?: string | null;
    BoldSignLease?: {
      id: string;
      tenantSigned: boolean;
      landlordSigned: boolean;
      embedUrl?: string | null;
    } | null;
  } | null;
}

interface ApplicationDetailsProps {
  housingRequestId: string;
  housingRequest: HousingRequestWithUser;
  listingId: string;
  from?: string;
}

// Data for the application
const guestDetails = {
  name: "Daniel Resner",
  rating: "4.0",
  averageRating: "Average Rating",
  household: {
    income: "$5,600/ mo",
    incomeLabel: "Household income",
    rentToIncomeRatio: "12%",
    rentToIncomeStatus: "Great",
  },
  household_members: {
    adults: 4,
    kids: 2,
    dogs: 0,
    cats: 3,
  },
  guests: [
    { name: "Daniel Resner", active: true },
    { name: "Isabelle Resner", active: false },
    { name: "Tyler Bennett", active: false },
  ],
};

const financialDetails = {
  earnings: {
    monthlyRent: "$2,374.50",
    deposit: "$3,500",
    totalBookingEarnings: "$28,494.00",
  },
  dates: {
    moveIn: "6 Jan 25",
    moveOut: "6 Jan 25",
    lengthOfStay: "365 days",
  },
};

const residentialHistory = [
  {
    type: "Current Residence",
    ownership: "Applicant owns this residence",
    address: "3024 N 1400 E North Ogden, UT 84414",
    monthlyPayment: "$5,500",
    lengthOfResidence: "12 Months",
  },
  {
    type: "Past Residence 1",
    ownership: "Applicant rents this residence",
    address: "2155 Quincy Ave Ogden, UT, 84401",
    monthlyPayment: "$1,450",
    lengthOfResidence: "12 Months",
    propertyManager: {
      name: "Mr Cooper Resner",
      phone: "317-908-7302",
      email: "daniel.resner@matchbookrentals.com",
    },
  },
];

const incomeDetails = [
  {
    source: "Source 1",
    description: "Government Moochery",
    monthlyAmount: "$5,500",
  },
  {
    source: "Source 2",
    description: "Social security",
    monthlyAmount: "$5,500",
  },
];

const questionnaire = {
  criminal: {
    question:
      "Have you been convicted of a felony or misdemeanor offense in the past 7 years?",
    answer: "No",
    followUp: "Please provide the date, and nature of the conviction.",
    followUpAnswer: "N/A",
  },
  eviction: {
    question:
      "Have you been evicted from a rental property in the past 7 years?",
    answer: "Yes",
    followUp:
      "Please explain the circumstances surrounding the eviction, including the reason for the eviction, and the outcome.",
    followUpAnswer:
      "Evicted due to lease violation in 2018; case resolved amicably.",
  },
};

export const ApplicationDetails = ({ housingRequestId, housingRequest, listingId, from }: ApplicationDetailsProps): JSX.Element => {
  const application = housingRequest.user.applications[0];
  const user = housingRequest.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const logger = useClientLogger();
  const { user: clerkUser } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isUndoingDecline, setIsUndoingDecline] = useState(false);
  const [isUploadingLease, setIsUploadingLease] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'checking' | 'selecting' | 'uploading' | 'creating'>('idle');
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);
  const [isRemovingLease, setIsRemovingLease] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(housingRequest.status);
  const [leaseDocumentId, setLeaseDocumentId] = useState(housingRequest.leaseDocumentId);
  const [boldSignLeaseId, setBoldSignLeaseId] = useState(housingRequest.boldSignLeaseId);
  const [isStripeDialogOpen, setIsStripeDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin detection and editable income state
  const [testIncome, setTestIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  
  // Check if user is admin
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin';
  
  // Log browser/OS info for debugging Mac-specific issues
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMac = /Mac|macOS/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    logger.info('Browser environment detected', {
      userAgent,
      isMac,
      isSafari,
      platform: navigator.platform,
      housingRequestId
    });
    
    // Cleanup timeout on unmount
    return () => {
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
      }
    };
  }, [housingRequestId, logger]);
  
  // Function to check Stripe Connect setup from database
  const checkStripeConnectSetup = async () => {
    try {
      logger.debug('Checking Stripe Connect setup');
      const response = await fetch('/api/user/stripe-account');
      const data = await response.json();
      const hasStripeAccount = Boolean(data.stripeAccountId);
      logger.info('Stripe Connect setup check completed', { hasStripeAccount, stripeAccountId: data.stripeAccountId });
      return hasStripeAccount;
    } catch (error) {
      logger.error('Error checking Stripe account', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  };

  // Handler for when user closes the Stripe dialog
  const handleStripeDialogClose = () => {
    setIsStripeDialogOpen(false);
  };

  // Handler for when user completes Stripe setup and wants to continue
  const handleStripeDialogContinue = () => {
    logger.info('Stripe setup completed, continuing with file picker');
    setIsStripeDialogOpen(false);
    // Now that Stripe is set up, open the file picker
    setTimeout(() => {
      setUploadPhase('selecting');
      setIsUploadingLease(true);
      fileInputRef.current?.click();
    }, 100); // Small delay to ensure dialog is closed
  };
  
  // Get user name from actual data
  const getUserName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || guestDetails.name;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    }).format(new Date(date));
  };

  // Helper function to calculate length of stay
  const calculateLengthOfStay = () => {
    if (!housingRequest.startDate || !housingRequest.endDate) return 'N/A';
    const start = new Date(housingRequest.startDate);
    const end = new Date(housingRequest.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  // Helper function to calculate monthly rent
  const getMonthlyRent = () => {
    if (!housingRequest.startDate || !housingRequest.endDate || !housingRequest.listing) {
      return 0;
    }
    
    const trip = {
      startDate: new Date(housingRequest.startDate),
      endDate: new Date(housingRequest.endDate)
    };
    
    return calculateRent({
      listing: housingRequest.listing,
      trip: trip
    });
  };

  // Helper function to calculate total booking earnings
  const getTotalBookingEarnings = () => {
    if (!housingRequest.startDate || !housingRequest.endDate) return 0;
    
    const monthlyRent = getMonthlyRent();
    const stayLength = calculateStayLength(
      new Date(housingRequest.startDate), 
      new Date(housingRequest.endDate)
    );
    
    // Calculate total based on months and partial days
    const totalMonths = stayLength.months + (stayLength.days / 30);
    return monthlyRent * totalMonths;
  };

  // Helper function to calculate total monthly income
  const getTotalMonthlyIncome = () => {
    // For admins, use test income if set, otherwise use actual income
    if (isAdmin && testIncome !== null) {
      return testIncome;
    }
    return application?.incomes?.reduce((acc, cur) => acc + Number(cur.monthlyAmount || 0), 0) || 0;
  };

  // Helper function to get rent-to-income ratio classification
  const getRentToIncomeClassification = (ratio: number) => {
    if (ratio <= 30) {
      return {
        status: 'Ideal',
        description: 'Low risk. Strong ability to pay rent.',
        recommendation: 'Approve without hesitation.',
        color: '#39b54a', // Green
        bgColor: '#f0f9f0'
      };
    } else if (ratio <= 35) {
      return {
        status: 'Acceptable',
        description: 'Still reasonable if other factors (credit, savings) are good.',
        recommendation: 'Approve with standard screening.',
        color: '#5c9ac5', // Blue
        bgColor: '#f0f8ff'
      };
    } else if (ratio <= 40) {
      return {
        status: 'Borderline',
        description: 'Moderate risk. May struggle if unexpected expenses arise.',
        recommendation: 'Consider with compensating factors (e.g. guarantor, high credit, longer history).',
        color: '#f39c12', // Orange
        bgColor: '#fffbf0'
      };
    } else if (ratio <= 50) {
      return {
        status: 'High Risk',
        description: 'Rent-heavy budget; may lead to late or missed payments.',
        recommendation: 'Likely decline unless exceptional compensating factors exist.',
        color: '#e67e22', // Dark orange
        bgColor: '#fff5f0'
      };
    } else {
      return {
        status: 'Very High Risk',
        description: 'Unsustainable. Indicates high likelihood of payment issues.',
        recommendation: 'Decline.',
        color: '#e74c3c', // Red
        bgColor: '#fff0f0'
      };
    }
  };

  // Helper function to calculate rent-to-income ratio
  const getRentToIncomeRatio = () => {
    const monthlyRent = getMonthlyRent();
    const monthlyIncome = getTotalMonthlyIncome();
    
    if (monthlyIncome === 0) return { percentage: 'N/A', status: 'Unknown', classification: null };
    
    const ratio = (monthlyRent / monthlyIncome) * 100;
    const percentage = Math.round(ratio);
    const classification = getRentToIncomeClassification(ratio);
    
    return { percentage: `${percentage}%`, status: classification.status, classification, rawRatio: ratio };
  };

  // Helper function to get upload button text based on phase
  const getUploadButtonText = (baseText: string) => {
    if (uploadPhase === 'checking') return 'Checking onboard status...';
    if (uploadPhase === 'selecting') return 'Selecting file...';
    if (uploadPhase === 'uploading') return 'Uploading file...';
    if (uploadPhase === 'creating') return 'Creating editable document...';
    return baseText;
  };

  // Manual trigger for fallback picker
  const showFallbackManually = () => {
    logger.info('User manually triggered fallback picker');
    setUploadPhase('idle');
    setIsUploadingLease(false);
    setShowFallbackPicker(true);
  };

  // Handler for approving housing request
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveHousingRequest(housingRequestId);
      if (result.success) {
        setCurrentStatus('approved');
        toast.success('Application approved successfully!');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handler for declining housing request
  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const result = await declineHousingRequest(housingRequestId);
      if (result.success) {
        setCurrentStatus('declined');
        toast.success('Application declined successfully.');
      }
    } catch (error) {
      console.error('Error declining application:', error);
      toast.error('Failed to decline application. Please try again.');
    } finally {
      setIsDeclining(false);
    }
  };

  // Handler for undoing approval
  const handleUndoApproval = async () => {
    setIsUndoing(true);
    try {
      const result = await undoApprovalHousingRequest(housingRequestId);
      if (result.success) {
        setCurrentStatus('pending');
        toast.success('Approval has been undone.');
      }
    } catch (error) {
      console.error('Error undoing approval:', error);
      if (error instanceof Error && error.message.includes('booking already exists')) {
        toast.error('Cannot undo approval: A booking has already been created.');
      } else {
        toast.error('Failed to undo approval. Please try again.');
      }
    } finally {
      setIsUndoing(false);
    }
  };

  // Handler for undoing decline
  const handleUndoDecline = async () => {
    setIsUndoingDecline(true);
    try {
      const result = await undoDeclineHousingRequest(housingRequestId);
      if (result.success) {
        setCurrentStatus('pending');
        toast.success('Application is being reconsidered.');
      }
    } catch (error) {
      console.error('Error undoing decline:', error);
      toast.error('Failed to undo decline. Please try again.');
    } finally {
      setIsUndoingDecline(false);
    }
  };

  // Handler for uploading lease file and creating template
  const handleUploadLease = async () => {
    logger.info('Upload lease button clicked', { housingRequestId, listingId });
    
    // Check Stripe Connect setup BEFORE opening file picker to avoid dialog interference
    try {
      setUploadPhase('checking');
      setIsUploadingLease(true);
      
      const hasStripeAccount = await checkStripeConnectSetup();
      if (!hasStripeAccount) {
        logger.warn('Stripe account not set up, showing dialog', { housingRequestId });
        setUploadPhase('idle');
        setIsUploadingLease(false);
        setIsStripeDialogOpen(true);
        return;
      }

      // Only open file picker if Stripe is set up
      logger.debug('Stripe account verified, opening file picker');
      setUploadPhase('selecting');
      // Keep isUploadingLease true to show the selecting state
      
      // Add debugging for Mac file picker issues
      logger.info('Attempting to open file picker', {
        fileInputExists: !!fileInputRef.current,
        fileInputType: fileInputRef.current?.type,
        fileInputAccept: fileInputRef.current?.accept,
        userAgent: navigator.userAgent
      });
      
      // Try multiple approaches for Mac compatibility
      if (fileInputRef.current) {
        try {
          // Set a timeout to detect if file picker doesn't open
          logger.debug('Setting file picker timeout');
          selectTimeoutRef.current = setTimeout(() => {
            logger.warn('File picker timeout - no interaction detected, showing fallback');
            setUploadPhase('idle');
            setIsUploadingLease(false);
            setShowFallbackPicker(true);
            toast.error('File picker did not open automatically. Please use the file selector below.');
          }, 3000); // 3 second timeout
          
          // Approach 1: Direct click
          fileInputRef.current.click();
          logger.debug('File input click executed', { timeoutSet: !!selectTimeoutRef.current });
        } catch (error) {
          logger.error('File input click failed', { error: error instanceof Error ? error.message : 'Unknown error' });
          // Clear timeout and reset state if click fails
          if (selectTimeoutRef.current) {
            clearTimeout(selectTimeoutRef.current);
            selectTimeoutRef.current = null;
          }
          setUploadPhase('idle');
          setIsUploadingLease(false);
          toast.error('Unable to open file picker. Please try again.');
        }
      } else {
        logger.error('File input ref is null');
        setUploadPhase('idle');
        setIsUploadingLease(false);
        toast.error('File picker not available. Please refresh the page.');
      }
    } catch (error) {
      logger.error('Error checking Stripe setup', { error: error instanceof Error ? error.message : 'Unknown error' });
      setUploadPhase('idle');
      setIsUploadingLease(false);
      toast.error('Failed to verify payment setup. Please try again.');
    }
  };

  // Handler for file selection and template creation
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('File input change event fired', { 
      hasFiles: !!event.target.files?.length,
      filesLength: event.target.files?.length,
      timeoutExists: !!selectTimeoutRef.current
    });
    
    // Clear the timeout since user interacted with file picker
    if (selectTimeoutRef.current) {
      logger.debug('Clearing file picker timeout');
      clearTimeout(selectTimeoutRef.current);
      selectTimeoutRef.current = null;
    }
    
    // Hide fallback picker since file selection worked
    setShowFallbackPicker(false);
    
    const file = event.target.files?.[0];
    logger.info('File selected for upload', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      housingRequestId 
    });

    if (!file) {
      logger.debug('No file selected, user cancelled');
      setUploadPhase('idle');
      setIsUploadingLease(false);
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      logger.warn('Invalid file type selected', { fileType: file.type, allowedTypes });
      setUploadPhase('idle');
      setIsUploadingLease(false);
      toast.error('Please upload a PDF document');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      logger.warn('File size too large', { fileSize: file.size, maxSize: 10 * 1024 * 1024 });
      setUploadPhase('idle');
      setIsUploadingLease(false);
      toast.error('File size must be less than 10MB');
      return;
    }

    // Proceed with file upload (Stripe already verified)
    await processFileUpload(file);
  };

  // Extracted file upload logic
  const processFileUpload = async (file: File) => {
    setUploadPhase('uploading');
    setIsUploadingLease(true);
    logger.info('Starting file upload process', { fileName: file.name, fileSize: file.size, housingRequestId });
    
    // Use fetch to call API route instead of server action to avoid React hydration issues
    try {
      logger.debug('Creating FormData for upload');
      const formData = new FormData();
      formData.append('housingRequestId', housingRequestId);
      formData.append('listingId', listingId);
      formData.append('leaseFile', file);

      logger.info('Sending file upload request to API', { endpoint: '/api/leases/create-from-upload' });
      const response = await fetch('/api/leases/create-from-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Upload API returned error', { status: response.status, error: errorData });
        throw new Error(errorData.error || 'Failed to create document');
      }

      // File upload complete, now creating editable document
      setUploadPhase('creating');
      logger.debug('File uploaded successfully, creating editable document');

      const result = await response.json();
      logger.info('Upload API success response', { 
        success: result.success, 
        documentId: result.documentId,
        matchId: result.matchId,
        hasEmbedUrl: !!result.embedUrl 
      });
      
      if (result.success) {
        toast.success('Lease document created! Configure your fields.');
        
        // Notify tenant about the lease (if matchId is available)
        if (result.matchId) {
          logger.info('Match created for tenant lease signing', { 
            matchId: result.matchId, 
            tenantUrl: `/app/match/${result.matchId}` 
          });
        }
        
        // Redirect to lease editing page with the embed URL
        if (result.embedUrl && result.documentId) {
          const redirectUrl = `/app/host/${listingId}/applications/${housingRequestId}/lease-editor?embedUrl=${encodeURIComponent(result.embedUrl)}&documentId=${result.documentId}`;
          logger.info('Redirecting to lease editor', { redirectUrl });
          router.push(redirectUrl);
        } else {
          logger.error('Missing embedUrl or documentId in success response', result);
          toast.error('Document created but missing redirect data');
        }
      } else {
        logger.error('Upload API returned success=false', { error: result.error });
        toast.error(result.error || 'Failed to create document');
      }
    } catch (clientError) {
      logger.error('Client-side error during file upload', { 
        error: clientError instanceof Error ? clientError.message : 'Unknown client error',
        stack: clientError instanceof Error ? clientError.stack : undefined
      });
      toast.error(`Failed to create document: ${clientError instanceof Error ? clientError.message : 'Unknown client error'}`);
    } finally {
      logger.debug('File upload process completed');
      setUploadPhase('idle');
      setIsUploadingLease(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // Handler for removing BoldSign lease
  const handleRemoveLease = async () => {
    if (!confirm('Are you sure you want to remove this lease? This will delete the lease document and cannot be undone.')) {
      return;
    }

    setIsRemovingLease(true);
    try {
      // Use server action for lease removal
      const result = await removeBoldSignLease(housingRequestId);
      
      if (result.success) {
        toast.success('Lease removed successfully. Application status reset to pending.');
        // Update local state
        setBoldSignLeaseId(null);
        setCurrentStatus('pending');
        // Refresh the page to ensure UI is in sync
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to remove lease');
      }
    } catch (error) {
      console.error('Error removing lease:', error);
      toast.error('Failed to remove lease. Please try again.');
    } finally {
      setIsRemovingLease(false);
    }
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full">
      <div className={`bg-white w-full max-w-[1920px] relative ${APP_PAGE_MARGIN} py-4`}>
        {/* Back Navigation */}
        <Link 
          href={
            from === 'dashboard' 
              ? '/app/host/dashboard/applications'
              : `/app/host/${listingId}/applications`
          } 
          className="hover:underline flex items-center gap-2 mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Lease Signing and Payment Status - for approved applications */}
        {currentStatus === 'approved' && housingRequest.match && (
          <section className="mb-8">
            <h2 className="text-xl font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mb-4">
              Lease & Payment Status
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Signature Status */}
                <div className="flex items-center gap-3">
                  {housingRequest.match.BoldSignLease?.tenantSigned ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {housingRequest.match.BoldSignLease?.tenantSigned ? 'Tenant Signed' : 'Awaiting Tenant Signature'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {housingRequest.match.BoldSignLease?.tenantSigned 
                        ? 'Lease has been signed by tenant' 
                        : 'Tenant needs to sign the lease agreement'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment Authorization Status */}
                <div className="flex items-center gap-3">
                  {housingRequest.match.paymentAuthorizedAt ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {housingRequest.match.paymentAuthorizedAt ? 'Payment Authorized' : 'Awaiting Payment Authorization'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {housingRequest.match.paymentAuthorizedAt 
                        ? `$${housingRequest.match.paymentAmount?.toLocaleString()} pre-authorized` 
                        : 'Tenant needs to authorize payment method'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Ready for Host Action */}
              {housingRequest.match.BoldSignLease?.tenantSigned && housingRequest.match.paymentAuthorizedAt && !housingRequest.match.BoldSignLease?.landlordSigned && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Ready for Your Signature!</p>
                      <p className="text-sm text-green-800">
                        The tenant has signed the lease and authorized payment. Complete the process by signing the lease to collect the deposit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Captured Status */}
              {housingRequest.match.paymentCapturedAt && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Payment Collected!</p>
                      <p className="text-sm text-blue-800">
                        Deposit and rent have been successfully processed and transferred to your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-12">
          {currentStatus === 'approved' && (
            <>
              <div className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#39b54a] bg-[#39b54a] text-white flex items-center justify-center [font-family:'Poppins',Helvetica] font-medium">
                ✓ Approved
              </div>
              {boldSignLeaseId ? (
                <>
                  {/* Show Sign Lease button if tenant has signed and payment is authorized but landlord hasn't signed */}
                  {housingRequest.match?.BoldSignLease?.tenantSigned && 
                   housingRequest.match?.paymentAuthorizedAt && 
                   !housingRequest.match?.BoldSignLease?.landlordSigned ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (housingRequest.match?.BoldSignLease?.embedUrl) {
                          window.open(housingRequest.match.BoldSignLease.embedUrl, '_blank', 'width=1200,height=800');
                        } else {
                          toast.error('Lease signing URL not available');
                        }
                      }}
                      className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-[#39b54a] text-[#39b54a] [font-family:'Poppins',Helvetica] font-medium hover:bg-green-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Sign & Collect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (boldSignLeaseId) {
                          // Use the new view endpoint for signed documents
                          window.open(`/api/leases/view?documentId=${boldSignLeaseId}`, '_blank');
                        } else {
                          toast.error('No lease document available');
                        }
                      }}
                      className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] [font-family:'Poppins',Helvetica] font-medium hover:bg-blue-50 flex items-center gap-2"
                    >
                      View Lease
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleRemoveLease}
                    disabled={isRemovingLease}
                    className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-red-200 text-red-600 [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isRemovingLease ? 'Removing...' : 'Remove Lease'}
                  </Button>
                </>
              ) : (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleUploadLease}
                      disabled={isUploadingLease}
                      className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {getUploadButtonText('Upload Lease')}
                    </Button>
                    {uploadPhase === 'selecting' && (
                      <Button
                        variant="outline"
                        onClick={showFallbackManually}
                        className="h-[63px] px-4 rounded-[5px] border-[1.5px] border-[#f39c12] text-[#f39c12] [font-family:'Poppins',Helvetica] font-medium hover:bg-orange-50 text-sm"
                      >
                        Try Alternative
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="outline"
                        onClick={handleUndoApproval}
                        disabled={isUndoing || housingRequest.hasBooking}
                        className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-[#666666] text-[#666666] [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        {isUndoing ? 'Undoing...' : 'Undo'}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {housingRequest.hasBooking && (
                    <TooltipContent>
                      <p>Cannot undo: A booking has been made</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {currentStatus === 'declined' && (
            <>
              <div className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#ff3b30] bg-[#ff3b30] text-white flex items-center justify-center [font-family:'Poppins',Helvetica] font-medium">
                ✗ Declined
              </div>
              <Button
                variant="outline"
                onClick={handleUndoDecline}
                disabled={isUndoingDecline}
                className="w-[140px] h-[63px] rounded-[5px] border-[1.5px] border-[#666666] text-[#666666] [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                {isUndoingDecline ? 'Undoing...' : 'Undo'}
              </Button>
            </>
          )}
          {currentStatus === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={isDeclining || isApproving}
                className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#ff3b30] text-[#ff3b30] [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50"
              >
                {isDeclining ? 'Declining...' : 'Decline'}
              </Button>
              <Button
                variant="outline"
                className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] [font-family:'Poppins',Helvetica] font-medium"
              >
                Message Guest
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleUploadLease}
                  disabled={isUploadingLease || isDeclining}
                  className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#39b54a] text-[#39b54a] [font-family:'Poppins',Helvetica] font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {isUploadingLease && <Loader2 className="w-4 h-4 animate-spin" />}
                  {getUploadButtonText('Approve and Create Lease')}
                </Button>
                {uploadPhase === 'selecting' && (
                  <Button
                    variant="outline"
                    onClick={showFallbackManually}
                    className="h-[63px] px-4 rounded-[5px] border-[1.5px] border-[#f39c12] text-[#f39c12] [font-family:'Poppins',Helvetica] font-medium hover:bg-orange-50 text-sm"
                  >
                    Try Alternative
                  </Button>
                )}
              </div>
            </>
          )}
          
          {/* Hidden file input for lease upload - always available */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Fallback file picker for Mac compatibility */}
          {showFallbackPicker && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                File Picker Alternative
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                The automatic file picker didn&apos;t open. Please select your PDF lease document below:
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={isUploadingLease}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Earnings Section */}
        <section className="mb-8">
          <h2 className="text-xl font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mb-4">
            Earnings
          </h2>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatCurrency(getMonthlyRent())}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Monthly Rent
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatCurrency(housingRequest.listing?.depositSize || 0)}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Deposit
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatCurrency(getTotalBookingEarnings())}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Total Booking Earnings
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </section>

        {/* Dates Section */}
        <section className="mb-8">
          <h2 className="text-xl font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mb-4">
            Dates
          </h2>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatDate(housingRequest.startDate)}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Move in
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatDate(housingRequest.endDate)}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Move out
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {calculateLengthOfStay()}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Length of stay
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </section>

        {/* Guests Summary Section */}
        <section className="mb-8">
          <h2 className="text-xl font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mb-4">
            Guests Summary
          </h2>
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {user.averageRating || 'N/A'}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Average Rating
              </p>
            </div>
            <div>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  {isEditingIncome ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={testIncome || getTotalMonthlyIncome()}
                        onChange={(e) => setTestIncome(Number(e.target.value) || 0)}
                        className="text-[20px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] border border-gray-300 rounded px-2 py-1 w-32"
                        min="0"
                        step="100"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingIncome(false)}
                        className="text-xs"
                      >
                        Done
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingIncome(true)}
                      className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] hover:text-blue-600 cursor-pointer border-b border-dashed border-gray-400 hover:border-blue-600"
                    >
                      {formatCurrency(getTotalMonthlyIncome())}
                    </button>
                  )}
                  {testIncome !== null && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Test Mode
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                  {formatCurrency(getTotalMonthlyIncome())}
                </p>
              )}
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Household income
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Helvetica-Regular',Helvetica]">
                  {getRentToIncomeRatio().percentage}
                </p>
                {getRentToIncomeRatio().classification && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="px-3 py-1 rounded border bg-background cursor-help"
                          style={{
                            borderColor: getRentToIncomeRatio().classification?.color,
                            color: getRentToIncomeRatio().classification?.color,
                            backgroundColor: getRentToIncomeRatio().classification?.bgColor
                          }}
                        >
                          <p className="text-sm font-medium [font-family:'Poppins',Helvetica]">
                            {getRentToIncomeRatio().status}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">
                            {getRentToIncomeRatio().status} (≤{getRentToIncomeRatio().rawRatio <= 30 ? '30' : getRentToIncomeRatio().rawRatio <= 35 ? '35' : getRentToIncomeRatio().rawRatio <= 40 ? '40' : getRentToIncomeRatio().rawRatio <= 50 ? '50' : '>50'}%)
                          </p>
                          <p className="text-sm">
                            {getRentToIncomeRatio().classification?.description}
                          </p>
                          <p className="text-sm font-medium">
                            {getRentToIncomeRatio().classification?.recommendation}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                Rent to income ratio
              </p>
            </div>
          </div>

          <div className="flex gap-12 mt-8 mb-4">
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Adults
              </p>
              <p className="text-[28px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {application?.numberOfAdults || 1}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Kids
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {application?.numberOfChildren || 0}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Dogs
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {application?.numberOfDogs || 0}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Cats
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {application?.numberOfCats || 0}
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </section>

        {/* Guest Details Section */}
        <section className="mb-8">
          <h2 className="text-xl font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mb-4">
            Guest Details
          </h2>

          <div className="flex gap-6 mb-4">
            <button
              className="text-base font-normal text-black underline [font-family:'Poppins',Helvetica]"
            >
              {getUserName()}
            </button>
          </div>

          <div className="flex gap-16 mt-4">
            <div>
              <p className="text-[15px] font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Rating
              </p>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mt-2">
                {user.averageRating || 'NO RATING'}
              </p>
            </div>
            <div>
              <p className="text-[15px] font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Identification
              </p>
              {application?.identifications && application.identifications.length > 0 && application.identifications[0].idPhotos.length > 0 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-[31px] mt-2 rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] text-xs font-medium [font-family:'Poppins',Helvetica]"
                    >
                      View ID
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-center">Identification Document - {application.identifications[0].idType}</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img 
                        src={application.identifications[0].idPhotos[0].url} 
                        alt="Identification document"
                        className="max-w-full max-h-[70vh] object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="h-[31px] mt-2 rounded-[5px] border-[1.5px] border-gray-300 text-gray-300 text-xs font-medium [font-family:'Poppins',Helvetica]"
                >
                  No ID Available
                </Button>
              )}
            </div>
            <div>
              <p className="text-[15px] font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Matchbook Verification
              </p>
              <Button
                variant="outline"
                className="h-[31px] mt-2 rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] text-xs font-medium [font-family:'Poppins',Helvetica]"
              >
                View Guest Screening
              </Button>
            </div>
          </div>
        </section>

        {/* Residential History Card */}
        <Card className="mb-8 border border-solid border-[#b4b3b4] rounded-[5px]">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Residential History
              </h2>
              <ChevronDownIcon className="w-6 h-6" />
            </div>

{(application?.residentialHistories && application.residentialHistories.length > 0 ? application.residentialHistories : []).map((residence, index) => (
              <div key={index} className="mt-6">
                <h3 className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                  {index === 0 ? 'Current Residence' : `Past Residence ${index}`}
                </h3>
                <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                  {residence.isOwned ? 'Applicant owns this residence' : 'Applicant rents this residence'}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Address
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {`${residence.street} ${residence.city}, ${residence.state} ${residence.zipCode}` || 'NO ADDRESS PROVIDED'}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Monthly Payment
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {residence.monthlyPayment ? formatCurrency(+residence.monthlyPayment) : 'NO PAYMENT INFO'}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Length of residence
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {residence.durationOfTenancy + ' months' || 'NO DURATION PROVIDED'}
                    </p>
                  </div>
                </div>

                {residence.landlordFirstName && residence.landlordLastName && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Property Manager Name
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.landlordFirstName + ' ' + residence.landlordLastName || 'NO NAME PROVIDED'}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Phone Number
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.landlordPhoneNumber || 'NO PHONE PROVIDED'}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Email
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.landlordEmail || 'NO EMAIL PROVIDED'}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {index < (application?.residentialHistories?.length || 0) - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
            
            {(!application?.residentialHistories || application.residentialHistories.length === 0) && (
              <div className="mt-6">
                <p className="text-lg font-bold text-red-500 [font-family:'Poppins',Helvetica]">
                  NO RESIDENTIAL HISTORY PROVIDED
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="mb-8 border border-solid border-[#b4b3b4] rounded-[5px]">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Income
              </h2>
              <ChevronDownIcon className="w-6 h-6" />
            </div>

{(application?.incomes && application.incomes.length > 0 ? application.incomes : incomeDetails).map((income, index) => (
              <React.Fragment key={index}>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      {application?.incomes ? `Source ${index + 1}` : income.source}
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {application?.incomes ? (income.source || 'No description provided') : income.source}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Monthly Amount
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {application?.incomes ? formatCurrency(income.monthlyAmount || 0) : income.monthlyAmount}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {application?.incomes && income.imageUrl ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-[41px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] text-xs font-medium [font-family:'Poppins',Helvetica]"
                          >
                            View Proof of income
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-center">Proof of Income - {application?.incomes ? `Source ${index + 1}` : income.source}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img 
                              src={income.imageUrl} 
                              alt="Proof of income document"
                              className="max-w-full max-h-[70vh] object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="h-[41px] rounded-[5px] border-[1.5px] border-gray-300 text-gray-300 text-xs font-medium [font-family:'Poppins',Helvetica]"
                      >
                        No Proof Available
                      </Button>
                    )}
                  </div>
                </div>
                {index < (application?.incomes?.length || incomeDetails.length) - 1 && (
                  <Separator className="my-4" />
                )}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* Guest Self-Reporting Questionaire Card */}
        <Card className="mb-8 border border-solid border-[#b4b3b4] rounded-[5px]">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Guest Self-Reporting Questionaire
              </h2>
              <ChevronDownIcon className="w-6 h-6" />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                Criminal Record
              </h3>
              <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                Have you been convicted of a felony or misdemeanor offense in the past 7 years?
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {application?.felony !== undefined ? (application.felony ? 'Yes' : 'No') : 'NO ANSWER PROVIDED'}
              </p>

              {application?.felony && (
                <>
                  <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                    Please provide the date, and nature of the conviction.
                  </p>
                  <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                    {application?.felony || 'NO DETAILS PROVIDED'}
                  </p>
                </>
              )}
            </div>

            <Separator className="my-6" />

            <div className="mt-6">
              <h3 className="text-lg font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                Eviction History
              </h3>
              <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                Have you been evicted from a rental property in the past 7 years?
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {application?.evicted !== undefined ? (application.evicted ? 'Yes' : 'No') : 'NO ANSWER PROVIDED'}
              </p>

              {application?.evicted && (
                <>
                  <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                    Please explain the circumstances surrounding the eviction, including the reason for the eviction, and the outcome.
                  </p>
                  <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                    {application?.evictedExplanation || 'NO DETAILS PROVIDED'}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stripe Connect Verification Dialog */}
        <StripeConnectVerificationDialog
          isOpen={isStripeDialogOpen}
          onClose={handleStripeDialogClose}
          onContinue={handleStripeDialogContinue}
        />
      </div>
    </main>
  );
};
