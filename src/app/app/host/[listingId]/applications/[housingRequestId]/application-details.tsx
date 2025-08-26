"use client";

import { 
  ChevronDownIcon, 
  Upload, 
  Trash2, 
  Loader2,
  MoreHorizontalIcon,
  BabyIcon,
  CatIcon,
  DogIcon,
  UsersIcon,
  Check
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { HousingRequest, User, Application, Income, ResidentialHistory, Listing, Identification, IDPhoto } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateRent, calculateLengthOfStay as calculateStayLength } from "@/lib/calculate-rent";
import { approveHousingRequest, declineHousingRequest, undoApprovalHousingRequest, undoDeclineHousingRequest } from "@/app/actions/housing-requests";
import { createBoldSignLeaseFromHousingRequest, removeBoldSignLease } from "@/app/actions/documents";
import { toast } from "sonner";
import { StripeConnectVerificationDialog } from "@/components/brandDialog";
import { LeaseSelectionDialog } from "@/components/LeaseSelectionDialog";
import { useClientLogger } from "@/hooks/useClientLogger";
import { useUser } from "@clerk/nextjs";

// Centralized styles for consistent text formatting
const STYLES = {
  headerText: "[font-family:'Poppins',Helvetica] font-medium text-neutralneutral-900 text-xl tracking-[0] leading-[normal] text-left",
  labelText: "font-['Poppins'] text-base font-normal leading-normal text-[#5D606D]",
  valueText: "font-text-label-medium-medium font-[number:var(--text-label-medium-medium-font-weight)] text-neutralneutral-900 text-[length:var(--text-label-medium-medium-font-size)] tracking-[var(--text-label-medium-medium-letter-spacing)] leading-[var(--text-label-medium-medium-line-height)] [font-style:var(--text-label-medium-medium-font-style)]"
} as const;

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

// Hardcoded data for the new design sections (keeping other sections)




const currentResidenceData = {
  type: "Applicant owns this residence",
  address: "3024 N 1400 E North Ogden, UT 84414",
  monthlyPayment: "$5,500",
  lengthOfResidence: "12 Months",
};

const pastResidenceData = {
  type: "Applicant rents this residence",
  address: "3024 N 1400 E North Ogden, UT 84414",
  monthlyPayment: "$5,500",
  lengthOfResidence: "12 Months",
  propertyManagerName: "Mr Cooper Resner",
  phoneNumber: "317-908-7302",
  email: "daniel.resner@matchbookrentals.com",
};

const incomeSources = [
  {
    sourceLabel: "Source 1",
    sourceName: "Government Moochery",
    monthlyAmount: "$5,500",
  },
  {
    sourceLabel: "Source 2",
    sourceName: "Social Security",
    monthlyAmount: "$5,500",
  },
];

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
  const [isUnapproving, setIsUnapproving] = useState(false);
  const [isUploadingLease, setIsUploadingLease] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'checking' | 'selecting' | 'uploading' | 'creating'>('idle');
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFallbackPicker, setShowFallbackPicker] = useState(false);
  const [isRemovingLease, setIsRemovingLease] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(housingRequest.status);
  const [leaseDocumentId, setLeaseDocumentId] = useState(housingRequest.leaseDocumentId);
  const [boldSignLeaseId, setBoldSignLeaseId] = useState(housingRequest.boldSignLeaseId);
  const [isStripeDialogOpen, setIsStripeDialogOpen] = useState(false);
  const [isLeaseSelectionOpen, setIsLeaseSelectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Admin detection and editable income state
  const [testIncome, setTestIncome] = useState<number | null>(null);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  
  // Check if user is admin
  const isAdmin = clerkUser?.publicMetadata?.role === 'admin';

  // Helper function to format currency
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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

  // Helper function to format dates
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(new Date(date));
  };

  // Helper function to calculate length of stay
  const calculateLengthOfStay = () => {
    if (!housingRequest.startDate || !housingRequest.endDate) return 'N/A';
    const start = new Date(housingRequest.startDate);
    const end = new Date(housingRequest.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Days`;
  };

  // Helper function to get summary items with live data
  const getSummaryItems = () => {
    const trip = housingRequest.trip;
    if (!trip) return [];
    
    const items = [];
    
    // Adults (only show if > 0)
    if (trip.numAdults > 0) {
      items.push({
        icon: UsersIcon,
        text: `${trip.numAdults} Adult${trip.numAdults !== 1 ? 's' : ''}`
      });
    }
    
    // Children (always show, even if 0)
    items.push({
      icon: BabyIcon,
      text: `${trip.numChildren} Kid${trip.numChildren !== 1 ? 's' : ''}`
    });
    
    // Pets (always show, even if 0, unified dogs and cats)
    items.push({
      icon: DogIcon, // Using dog icon for all pets as requested
      text: `${trip.numPets} Pet${trip.numPets !== 1 ? 's' : ''}`
    });
    
    return items;
  };

  // Helper function to get renter data with live information
  const getRenterData = () => {
    // Primary renter is the user who made the housing request
    const primaryRenter = {
      name: getUserName(),
      rating: "N/A", // We don't have rating data in the current schema
      hasId: application?.identifications && application.identifications.length > 0 && application.identifications[0].idPhotos.length > 0,
    };
    
    return [primaryRenter];
  };

  // Get user name from actual data
  const getUserName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Daniel Resner";
  };

  // Helper function to get residential history data
  const getResidentialHistoryData = () => {
    const residences = application?.residentialHistories || [];
    
    // Sort by most recent first (assuming index 0 is current residence)
    const sortedResidences = residences.sort((a, b) => (a.index || 0) - (b.index || 0));
    
    return sortedResidences.map((residence, index) => ({
      ...residence,
      displayType: residence.housingStatus === 'own' ? 'Applicant owns this residence' : 'Applicant rents this residence',
      fullAddress: [residence.street, residence.apt, residence.city, residence.state, residence.zipCode]
        .filter(Boolean)
        .join(', ') || 'N/A',
      formattedPayment: residence.monthlyPayment ? `$${residence.monthlyPayment}` : 'N/A',
      landlordName: [residence.landlordFirstName, residence.landlordLastName]
        .filter(Boolean)
        .join(' ') || 'N/A'
    }));
  };


  // Helper function to get income data
  const getIncomeData = () => {
    const incomes = application?.incomes || [];
    
    return incomes.map((income, index) => ({
      ...income,
      sourceLabel: `Source ${index + 1}`,
      formattedAmount: income.monthlyAmount ? `$${income.monthlyAmount}/month` : 'N/A',
      sourceName: income.source || 'N/A'
    }));
  };

  // Helper function to calculate total monthly income
  const getTotalMonthlyIncome = () => {
    const incomes = getIncomeData();
    const total = incomes.reduce((sum, income) => {
      const amount = parseFloat(income.monthlyAmount) || 0;
      return sum + amount;
    }, 0);
    
    return total;
  };

  // Helper function to calculate rent to income ratio
  const getRentToIncomeRatio = () => {
    const totalIncome = getTotalMonthlyIncome();
    const monthlyRent = getMonthlyRent();
    
    if (totalIncome <= 0) return { ratio: 'N/A', badge: 'Unknown', color: 'gray' };
    
    const ratio = (monthlyRent / totalIncome) * 100;
    const percentage = Math.round(ratio);
    
    let badge = 'Unknown';
    let color = 'gray';
    
    if (percentage <= 30) {
      badge = 'Great';
      color = '#3c8787';
    } else if (percentage <= 40) {
      badge = 'Good';
      color = '#4ade80';
    } else if (percentage <= 50) {
      badge = 'Fair';
      color = '#fbbf24';
    } else {
      badge = 'High';
      color = '#ef4444';
    }
    
    return { ratio: `${percentage}%`, badge, color };
  };

  // Get questionnaire data from application
  const getQuestionnaireData = () => {
    const questionsData = [
      {
        title: "Criminal Record",
        questions: [
          {
            question: "Have you been convicted of a felony or misdemeanor offense in the past 7 years?",
            answer: application?.felony === null ? "Not answered" : application?.felony ? "Yes" : "No",
          },
          {
            question: "Please provide the date and nature of the conviction.",
            answer: application?.felony && application?.felonyExplanation ? application.felonyExplanation : "N/A",
          },
        ],
      },
      {
        title: "Eviction History",
        questions: [
          {
            question: "Have you been evicted in the past 7 years?",
            answer: application?.evicted === null ? "Not answered" : application?.evicted ? "Yes" : "No",
          },
          {
            question: "Please explain the circumstances surrounding the eviction, including the reason for the eviction and the outcome.",
            answer: application?.evicted && application?.evictedExplanation ? application.evictedExplanation : "N/A",
          },
        ],
      },
    ];
    return questionsData;
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

  // Handler for unapproving housing request
  const handleUnapprove = async () => {
    setIsUnapproving(true);
    try {
      const result = await undoApprovalHousingRequest(housingRequestId);
      if (result.success) {
        setCurrentStatus('pending');
        toast.success('Application unapproved successfully.');
      }
    } catch (error) {
      console.error('Error unapproving application:', error);
      toast.error('Failed to unapprove application. Please try again.');
    } finally {
      setIsUnapproving(false);
    }
  };

  // Open lease selection dialog instead of direct approval
  const handleUploadLease = () => {
    setIsLeaseSelectionOpen(true);
  };

  // Handle when lease documents are selected
  const handleDocumentsSelected = (selectedTemplates: any[]) => {
    const templateIds = selectedTemplates.map(t => t.id).join(',');
    // Navigate to document creation page with selected templates
    router.push(`/app/host/${listingId}/applications/${housingRequestId}/create-lease?templates=${templateIds}`);
  };

  // Get upload button text based on phase
  const getUploadButtonText = (baseText: string) => {
    if (uploadPhase === 'checking') return 'Checking onboard status...';
    if (uploadPhase === 'selecting') return 'Selecting file...';
    if (uploadPhase === 'uploading') return 'Uploading file...';
    if (uploadPhase === 'creating') return 'Creating editable document...';
    return baseText;
  };

  return (
    <main className="flex flex-col items-start gap-6 px-4 sm:px-6 py-8 relative bg-[#f9f9f9] min-h-screen">
      <div className="w-full max-w-[1920px] relative">
        {/* Back Navigation */}
      <Link 
        href={
          from === 'dashboard' 
            ? '/app/host/dashboard/applications'
            : `/app/host/${listingId}/applications`
        } 
        className="hover:underline pl-2 flex items-center gap-2 mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Application Title Section */}
      <header className="flex items-end pb-4 pl-2 gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-2 relative flex-1 grow">
          <h1 className="relative w-[430px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-transparent text-2xl tracking-[0] leading-[28.8px]">
            <span className="font-medium text-[#020202]">Application </span>
            <span className="text-[#5d606d] text-base leading-[19.2px]">
              / {getUserName()}
            </span>
          </h1>
        </div>

        <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
          {currentStatus === 'pending' && (
            <>
              <Button
                variant="ghost"
                onClick={handleDecline}
                disabled={isDeclining || isApproving}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 flex-[0_0_auto] rounded-lg overflow-hidden h-auto hover:bg-transparent"
              >
                <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#e62e2e] text-sm tracking-[0] leading-5 hover:underline whitespace-nowrap">
                  {isDeclining ? 'Declining...' : 'Decline'}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handleUploadLease}
                disabled={isUploadingLease || isDeclining}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-[#3c8787] h-auto hover:bg-transparent"
              >
                <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-sm tracking-[0] leading-5 whitespace-nowrap">
                  {getUploadButtonText('Approve')}
                </span>
              </Button>
            </>
          )}

          {currentStatus === 'approved' && (
            <>
              <div className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-secondaryBrand h-auto">
                <Check className="h-4 w-4 text-secondaryBrand" />
                <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-secondaryBrand text-sm tracking-[0] leading-5 whitespace-nowrap">
                  Approved
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-[0_0_auto] relative h-auto w-auto p-2"
                  >
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!housingRequest.hasBooking ? (
                    <DropdownMenuItem
                      onClick={handleUnapprove}
                      disabled={isUnapproving}
                      className="text-[#e62e2e] focus:text-[#e62e2e] cursor-pointer"
                    >
                      {isUnapproving ? 'Unapproving...' : 'Unapprove Application'}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      disabled 
                      className="text-gray-400 cursor-pointer"
                      onClick={() => toast.error('Cannot unapprove application with active booking')}
                    >
                      Cannot unapprove - has active booking
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {currentStatus === 'declined' && (
            <Button
              variant="outline"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-[#e62e2e] h-auto hover:bg-transparent"
            >
              <span className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#e62e2e] text-sm tracking-[0] leading-5 whitespace-nowrap">
                ✗ Declined
              </span>
            </Button>
          )}

        </div>
      </header>

      {/* Main Content Sections */}
      <section className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
        
        {/* Income Section - Earnings (Now with live data - Green border) */}
        <Card className="relative self-stretch w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] ">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Earnings
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col sm:flex-row items-start gap-6 mt-6 w-full">
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Monthly Rent
                    </div>
                    <div className={`relative self-stretch ${STYLES.valueText}`}>
                      {formatCurrency(getMonthlyRent())}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Rent Due at Booking
                    </div>
                    <div className={`relative self-stretch ${STYLES.valueText}`}>
                      {formatCurrency(getMonthlyRent())}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Deposit
                    </div>
                    <div className={`relative self-stretch ${STYLES.valueText}`}>
                      {formatCurrency(housingRequest.listing?.depositSize || 0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Total Bookings
                    </div>
                    <div className={`relative self-stretch ${STYLES.valueText}`}>
                      {formatCurrency(getTotalBookingEarnings())}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Guest Self Reporting Section - Dates (Now with live data - Green border) */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] ">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Dates
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col sm:flex-row items-start gap-6 mt-6 w-full">
                  <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1 sm:w-auto sm:min-w-[200px]">
                    <div className={STYLES.labelText}>
                      Move in
                    </div>
                    <div className={STYLES.valueText}>
                      {formatDate(housingRequest.startDate)}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1 sm:w-auto sm:min-w-[200px]">
                    <div className={STYLES.labelText}>
                      Move Out
                    </div>
                    <div className={STYLES.valueText}>
                      {formatDate(housingRequest.endDate)}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1 sm:w-auto sm:min-w-[200px]">
                    <div className={STYLES.labelText}>
                      Length of Stay
                    </div>
                    <div className={STYLES.valueText}>
                      {calculateLengthOfStay()}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Dates Section - Summary (Now with live data - Green border) */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] ">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Summary
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-6">
                  <Separator className="w-full mb-6" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-[86px] w-full">
                    {getSummaryItems().map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div
                          key={index}
                          className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full"
                        >
                          <IconComponent className="w-5 h-5" />
                          <div className="w-fit [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                            {item.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Earnings Section - Renters (Now with live data - Green border) */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] ">
          <CardContent className="flex flex-col items-end gap-6 p-6">
            <Collapsible defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Renters
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-6 flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
              <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                  Renter Name
                </div>
                <div className={`relative self-stretch ${STYLES.valueText}`}>
                  {getRenterData()[0].name}
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                  Rating
                </div>
                <div className={`relative self-stretch ${STYLES.valueText}`}>
                  {getRenterData()[0].rating}
                </div>
              </div>

              <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                  Identification
                </div>
                {application?.identifications && application.identifications.length > 0 && application.identifications[0].idPhotos.length > 0 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto h-auto items-center justify-center gap-1 px-2 py-1 rounded-md border border-solid border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white"
                      >
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap">
                          View ID
                        </span>
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
                    className="w-full sm:w-auto h-auto items-center justify-center gap-1 px-2 py-1 rounded-md border border-solid border-gray-300 text-gray-300"
                  >
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Request ID
                    </span>
                  </Button>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1 sm:w-auto sm:min-w-[200px] items-start gap-1.5 relative">
                <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                  Renter Verification Report
                </div>
                <Button
                  variant="outline"
                  disabled
                  className="w-full sm:w-auto h-auto items-center justify-center gap-1 px-2 py-1 rounded-md border border-solid border-gray-300 text-gray-300"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap">
                    Coming Soon
                  </span>
                </Button>
              </div>
            </div>

                  {/* Additional renters would go here if needed */}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Summary Section - Residential History (Now with live data) */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col items-end gap-6 p-6">
            <Collapsible defaultOpen className="w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Residential History
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="gap-6 mt-6 w-full flex flex-col items-start">
                  {(() => {
                    const residences = getResidentialHistoryData();
                    const currentResidence = residences[0];
                    
                    if (!currentResidence) {
                      return (
                        <div className="text-gray-500 text-center py-4 w-full">
                          No residential history available
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative self-stretch w-full pb-4">
                          {/* Row 1: Type, Address, Monthly Payment */}
                          <div className="gap-1.5 flex flex-col items-start">
                            <div className={`${STYLES.labelText}`}>
                              Current Residence
                            </div>
                            <div className={`${STYLES.valueText}`}>
                              {currentResidence.displayType}
                            </div>
                          </div>

                          <div className="gap-1.5 flex flex-col items-start">
                            <div className={`${STYLES.labelText}`}>
                              Address
                            </div>
                            <div className={`${STYLES.valueText} break-words max-w-xs`}>
                              {currentResidence.fullAddress}
                            </div>
                          </div>

                          <div className="gap-1.5 flex flex-col items-start">
                            <div className={`${STYLES.labelText}`}>
                              Monthly Payment
                            </div>
                            <div className={`${STYLES.valueText}`}>
                              {currentResidence.formattedPayment}
                            </div>
                          </div>

                          {/* Row 2: Length of Residence spans full width */}
                          <div className="gap-1.5 flex flex-col items-start sm:col-span-3">
                            <div className={`${STYLES.labelText}`}>
                              Length of Residence
                            </div>
                            <div className={`${STYLES.valueText}`}>
                              {currentResidence.durationOfTenancy ? `${currentResidence.durationOfTenancy} months` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  const residences = getResidentialHistoryData();
                  const pastResidences = residences.slice(1); // Skip current residence
                  
                  if (pastResidences.length === 0) {
                    return null; // No separator or past residences if none exist
                  }
                  
                  return (
                    <>
                      <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                        {pastResidences.map((residence, index) => (
                          <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative self-stretch w-full pb-4">
                            {/* Row 1: Type, Address, Monthly Payment */}
                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Past Residence {index + 1}
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.displayType}
                              </div>
                            </div>

                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Address
                              </div>
                              <div className={`${STYLES.valueText} break-words max-w-xs`}>
                                {residence.fullAddress}
                              </div>
                            </div>

                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Monthly Payment
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.formattedPayment}
                              </div>
                            </div>

                            {/* Row 2: Length, Property Manager, Phone */}
                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Length of Residence
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.durationOfTenancy ? `${residence.durationOfTenancy} months` : 'N/A'}
                              </div>
                            </div>

                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Property Manager Name
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.landlordName || 'N/A'}
                              </div>
                            </div>

                            <div className="gap-1.5 flex flex-col items-start">
                              <div className={`${STYLES.labelText}`}>
                                Phone Number
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.landlordPhoneNumber || 'N/A'}
                              </div>
                            </div>

                            {/* Row 3: Email spans full width */}
                            <div className="gap-1.5 flex flex-col items-start sm:col-span-3">
                              <div className={`${STYLES.labelText}`}>
                                Email
                              </div>
                              <div className={`${STYLES.valueText}`}>
                                {residence.landlordEmail || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

        {/* Renters Section - Income (Now with live data) */}
        <Card className="flex flex-col items-end gap-6 p-6 relative self-stretch w-full flex-[0_0_auto] bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <Collapsible defaultOpen className="w-full">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>
                Income
              </h2>
              <ChevronDownIcon className="w-5 h-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <section className="flex flex-col sm:flex-row items-start gap-6 mt-6 w-full">
                <div className="flex items-center gap-6 pb-4 relative flex-1 grow">
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Total Income
                    </div>
                    <div className={`relative self-stretch ${STYLES.valueText}`}>
                      {formatCurrency(getTotalMonthlyIncome())}/month
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                    <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                      Rent to Income Ratio
                    </div>
                    <div className="flex items-start gap-1.5 md:gap-6 relative self-stretch w-full flex-[0_0_auto]">
                      <div className={`relative w-fit mt-[-1.00px] ${STYLES.valueText}`}>
                        {getRentToIncomeRatio().ratio}
                      </div>
                      <Badge
                        variant="outline"
                        className="flex w-[68px] items-center justify-center gap-1 px-2 py-0.5 rounded-md overflow-hidden border border-solid"
                        style={{ borderColor: getRentToIncomeRatio().color }}
                      >
                        <div className="inline-flex items-center justify-center px-0.5 py-0 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap"
                               style={{ color: getRentToIncomeRatio().color }}>
                            {getRentToIncomeRatio().badge}
                          </div>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="w-[180px] flex items-center justify-end">
                  {/* Spacer to align with View Proof buttons below */}
                </div>
              </section>

              {(() => {
                const incomes = getIncomeData();
                if (incomes.length === 0) {
                  return (
                    <div className="text-gray-500 text-center py-4 w-full">
                      No income information available
                    </div>
                  );
                }
                
                return incomes.map((income, index) => (
                  <section key={`income-source-${index}`} className="flex flex-col sm:flex-row items-start gap-6 relative self-stretch w-full flex-[0_0_auto] pb-4">
                    <div className="flex items-center gap-6 relative flex-1 grow">
                      <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                        <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                          {income.sourceLabel}
                        </div>
                        <div className={`relative self-stretch ${STYLES.valueText}`}>
                          {income.sourceName}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 sm:w-auto sm:min-w-[200px] gap-1.5 flex flex-col items-start relative">
                        <div className={`relative self-stretch mt-[-1.00px] ${STYLES.labelText}`}>
                          Monthly Amount
                        </div>
                        <div className={`relative self-stretch ${STYLES.valueText}`}>
                          {income.formattedAmount}
                        </div>
                      </div>
                    </div>

                    {income.imageUrl ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-[#3c8787] h-auto"
                          >
                            <div className="inline-flex items-center justify-center px-0.5 py-0 relative flex-[0_0_auto]">
                              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#3c8787] text-sm tracking-[0] leading-5 whitespace-nowrap">
                                View Proof of Income
                              </div>
                            </div>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-center">Proof of Income - {income.sourceName}</DialogTitle>
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
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 relative flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-gray-300 h-auto"
                      >
                        <div className="inline-flex items-center justify-center px-0.5 py-0 relative flex-[0_0_auto]">
                          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-gray-300 text-sm tracking-[0] leading-5 whitespace-nowrap">
                            No Proof Available
                          </div>
                        </div>
                      </Button>
                    )}
                  </section>
                ));
              })()}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Guest Self-Reporting Questionnaire Section */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>
                  Guest Self-Reporting Questionaire
                </h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-6">
                <div className="flex flex-col gap-[19px]">
                  {getQuestionnaireData().map((section, sectionIndex) => (
                    <Card
                      key={sectionIndex}
                      className="bg-[#fcfcfd] border border-[#0000001a]"
                    >
                      <CardContent className="p-[18px]">
                        <h3 className="font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-neutralneutral-900 text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)] mb-[19px]">
                          {section.title}
                        </h3>

                        <div className="flex flex-col gap-4">
                          {section.questions.map((item, questionIndex) => (
                            <React.Fragment key={questionIndex}>
                              <div className="flex flex-col gap-1.5">
                                <div className={STYLES.labelText}>
                                  {item.question}
                                </div>
                                <div className={STYLES.valueText}>
                                  {item.answer}
                                </div>
                              </div>
                              {questionIndex < section.questions.length - 1 && (
                                <Separator className="h-px bg-[#0000001a]" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

      </section>

      {/* Lease Selection Dialog */}
      <LeaseSelectionDialog
        open={isLeaseSelectionOpen}
        onOpenChange={setIsLeaseSelectionOpen}
        listingId={listingId}
        onDocumentsSelected={handleDocumentsSelected}
      />
      </div>
    </main>
  );
};
