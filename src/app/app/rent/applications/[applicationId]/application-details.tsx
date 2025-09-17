"use client";

import { 
  ChevronDownIcon, 
  BabyIcon,
  DogIcon,
  UsersIcon,
  MapPinIcon,
  CalendarIcon,
  MessageSquareIcon,
  ExternalLinkIcon
} from "lucide-react";
import React, { useState } from "react";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { HousingRequest, User, Application, Income, ResidentialHistory, Listing, Identification, IDPhoto } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateRent } from "@/lib/calculate-rent";
import { SecureFileViewer } from "@/components/secure-file-viewer";
import BrandModal from "@/components/BrandModal";
import { getOrCreateListingConversation } from "@/app/actions/housing-requests";

// Centralized styles for consistent text formatting
const STYLES = {
  headerText: "[font-family:'Poppins',Helvetica] font-medium text-neutralneutral-900 text-xl tracking-[0] leading-[normal] text-left",
  labelText: "font-['Poppins'] text-base font-normal leading-normal text-[#5D606D]",
  valueText: "font-text-label-medium-medium font-[number:var(--text-label-medium-medium-font-weight)] text-neutralneutral-900 text-[length:var(--text-label-medium-medium-font-size)] tracking-[var(--text-label-medium-medium-letter-spacing)] leading-[var(--text-label-medium-medium-line-height)] [font-style:var(--text-label-medium-medium-font-style)]"
} as const;

interface HousingRequestWithDetails extends HousingRequest {
  user: User & {
    applications: (Application & {
      incomes: Income[];
      residentialHistories: ResidentialHistory[];
      identifications: (Identification & {
        idPhotos: IDPhoto[];
      })[];
    })[];
  };
  listing: Listing & {
    listingImages?: Array<{
      id: string;
      url: string;
      category: string | null;
      rank: number | null;
    }>;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  trip?: any;
  hasBooking?: boolean;
  bookingId?: string | null;
  match?: {
    id: string;
    BoldSignLease?: {
      id: string;
      tenantSigned: boolean;
      landlordSigned: boolean;
      embedUrl?: string | null;
    } | null;
  } | null;
}

interface ApplicationDetailsProps {
  applicationId: string;
  housingRequest: HousingRequestWithDetails;
  from?: string;
}

export function ApplicationDetails({ applicationId, housingRequest, from }: ApplicationDetailsProps) {
  const router = useRouter();
  const [idModalOpen, setIdModalOpen] = useState(false);
  
  const user = housingRequest.user;
  const listing = housingRequest.listing;
  const application = user.applications?.[0];
  const trip = housingRequest.trip;

  // Helper function to format dates
  const formatDate = (date: string | Date) => {
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
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (months > 0) {
      return remainingDays > 0 ? `${months} Month${months !== 1 ? 's' : ''}, ${remainingDays} Day${remainingDays !== 1 ? 's' : ''}` : `${months} Month${months !== 1 ? 's' : ''}`;
    }
    return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
  };

  // Helper function to get trip summary
  const getTripSummary = () => {
    if (!trip) return [];
    
    const items = [];
    
    if (trip.numAdults > 0) {
      items.push({
        icon: UsersIcon,
        text: `${trip.numAdults} Adult${trip.numAdults !== 1 ? 's' : ''}`
      });
    }
    
    items.push({
      icon: BabyIcon,
      text: `${trip.numChildren} Kid${trip.numChildren !== 1 ? 's' : ''}`
    });
    
    items.push({
      icon: DogIcon,
      text: `${trip.numPets} Pet${trip.numPets !== 1 ? 's' : ''}`
    });
    
    return items;
  };

  // Helper function to get status color and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return { color: "bg-[#e6f6fd] text-[#00a6e8] border-[#00a6e8]", label: "Approved" };
      case "declined":
        return { color: "bg-[#fdeaea] text-[#e62e2e] border-[#e62e2e]", label: "Declined" };
      default:
        return { color: "bg-[#fff2cc] text-[#b7950b] border-[#b7950b]", label: "Pending" };
    }
  };

  // Helper function to get listing image
  const getListingImage = () => {
    if (listing.listingImages && listing.listingImages.length > 0) {
      const sortedImages = listing.listingImages.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      return sortedImages[0].url;
    }
    return listing.imageSrc || "/placeholder-property.jpg";
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
    const incomes = application?.incomes || [];
    const total = incomes.reduce((sum, income) => sum + (income.monthlyAmount || 0), 0);
    return total > 0 ? `$${total}/month` : 'N/A';
  };

  // Helper function to get residential history
  const getResidentialHistory = () => {
    const residences = application?.residentialHistories || [];
    const sortedResidences = residences.sort((a, b) => (a.index || 0) - (b.index || 0));
    
    return sortedResidences.map((residence, index) => ({
      ...residence,
      displayType: residence.housingStatus === 'own' ? 'You own this residence' : 'You rent this residence',
      fullAddress: [residence.street, residence.apt, residence.city, residence.state, residence.zipCode]
        .filter(Boolean)
        .join(', ') || 'N/A',
      formattedPayment: residence.monthlyPayment ? `$${residence.monthlyPayment}` : 'N/A',
      landlordName: [residence.landlordFirstName, residence.landlordLastName]
        .filter(Boolean)
        .join(' ') || 'N/A'
    }));
  };

  // Helper function to handle messaging host
  const handleMessageHost = async () => {
    if (!listing.user?.id) return;
    
    try {
      const result = await getOrCreateListingConversation(listing.id, listing.user.id);
      
      if (result.success && result.conversationId) {
        router.push(`/app/rent/messages?convo=${result.conversationId}`);
      } else {
        console.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      console.error('Error messaging host:', error);
    }
  };

  const statusInfo = getStatusInfo(housingRequest.status);
  const monthlyRent = listing && trip ? calculateRent({ listing, trip }) : 0;

  return (
    <div className={`flex flex-col items-start gap-6 px-6 py-8 ${APP_PAGE_MARGIN} max-w-6xl mx-auto`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Badge className={`${statusInfo.color} rounded-full px-2.5 py-1 text-sm font-medium`}>
              {statusInfo.label}
            </Badge>
            <h1 className="text-2xl font-semibold text-gray-900">
              Your Application
            </h1>
          </div>
          <p className="text-gray-600">
            Applied on {formatDate(housingRequest.createdAt)}
          </p>
        </div>
        
        <div className="flex gap-3">
          {from && (
            <BrandButton
              variant="outline"
              href={from}
              leftIcon={<ExternalLinkIcon className="w-4 h-4" />}
            >
              Back to Applications
            </BrandButton>
          )}
        </div>
      </div>

      {/* Property Details Card */}
      <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img
                  src={getListingImage()}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="lg:w-2/3 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h2>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{listing.city}, {listing.state}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${monthlyRent}/month
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <BrandButton
                  variant="outline"
                  href="/app/rent/applications/general"
                >
                  Edit General Application
                </BrandButton>
                
                {housingRequest.status === "approved" && (
                  <>
                    <BrandButton
                      variant="outline"
                      onClick={handleMessageHost}
                      leftIcon={<MessageSquareIcon className="w-4 h-4" />}
                    >
                      Message Host
                    </BrandButton>
                    
                    {housingRequest.hasBooking && housingRequest.bookingId && (
                      <BrandButton
                        variant="default"
                        href={`/app/rent/bookings/${housingRequest.bookingId}`}
                      >
                        Go to Booking
                      </BrandButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates Section */}
      <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
        <CardContent className="flex flex-col gap-6 p-6">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>
                <CalendarIcon className="w-5 h-5 inline mr-2" />
                Dates
              </h2>
              <ChevronDownIcon className="w-5 h-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col sm:flex-row items-start gap-6 mt-6 w-full">
                <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
                  <div className={STYLES.labelText}>Move in</div>
                  <div className={STYLES.valueText}>
                    {formatDate(housingRequest.startDate)}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
                  <div className={STYLES.labelText}>Move Out</div>
                  <div className={STYLES.valueText}>
                    {formatDate(housingRequest.endDate)}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-1.5 min-w-0 flex-1">
                  <div className={STYLES.labelText}>Length of Stay</div>
                  <div className={STYLES.valueText}>
                    {calculateLengthOfStay()}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Trip Summary Section */}
      <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
        <CardContent className="flex flex-col gap-6 p-6">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Trip Details</h2>
              <ChevronDownIcon className="w-5 h-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-6">
                <Separator className="w-full mb-6" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                  {getTripSummary().map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={index}
                        className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full"
                      >
                        <IconComponent className="w-5 h-5" />
                        <div className="[font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm">
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

      {/* Personal Information Section */}
      <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
        <CardContent className="flex flex-col gap-6 p-6">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Personal Information</h2>
              <ChevronDownIcon className="w-5 h-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-6 flex flex-col gap-6 w-full">
                <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
                  <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                    <div className={STYLES.labelText}>Name</div>
                    <div className={STYLES.valueText}>
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                    <div className={STYLES.labelText}>Email</div>
                    <div className={STYLES.valueText}>{user.email}</div>
                  </div>
                  
                  <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                    <div className={STYLES.labelText}>Identification</div>
                    {application?.identifications && application.identifications.length > 0 && application.identifications[0].idPhotos.length > 0 ? (
                      <BrandModal
                        className="max-w-3xl"
                        isOpen={idModalOpen}
                        onOpenChange={setIdModalOpen}
                        triggerButton={
                          <BrandButton
                            variant="outline"
                            size="sm"
                          >
                            View ID
                          </BrandButton>
                        }
                      >
                        <div className="flex flex-col gap-4">
                          <h2 className="text-center text-xl font-semibold">
                            Your ID Document
                          </h2>
                          <div className="flex justify-center">
                            <SecureFileViewer
                              fileKey={application.identifications[0].idPhotos[0].fileKey}
                              customId={application.identifications[0].idPhotos[0].customId}
                              fileName={application.identifications[0].idPhotos[0].fileName || 'ID Document'}
                              fileType="image"
                              className="max-w-full max-h-[70vh] object-contain"
                              fallbackUrl={application.identifications[0].idPhotos[0].url}
                            />
                          </div>
                          <div className="flex justify-end pt-4 border-t">
                            <BrandButton
                              onClick={() => setIdModalOpen(false)}
                              variant="default"
                              size="sm"
                            >
                              Close
                            </BrandButton>
                          </div>
                        </div>
                      </BrandModal>
                    ) : (
                      <div className={STYLES.valueText}>Not provided</div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Income Information Section */}
      {getIncomeData().length > 0 && (
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>Income Information</h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-6 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                      <div className={STYLES.labelText}>Total Monthly Income</div>
                      <div className={STYLES.valueText}>{getTotalMonthlyIncome()}</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    {getIncomeData().map((income, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start gap-6 p-4 bg-gray-50 rounded-lg">
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>{income.sourceLabel}</div>
                          <div className={STYLES.valueText}>{income.sourceName}</div>
                        </div>
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>Monthly Amount</div>
                          <div className={STYLES.valueText}>{income.formattedAmount}</div>
                        </div>
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>Employer</div>
                          <div className={STYLES.valueText}>{income.employer || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Residential History Section */}
      {getResidentialHistory().length > 0 && (
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>Residential History</h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-6 space-y-4">
                  {getResidentialHistory().map((residence, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>Type</div>
                          <div className={STYLES.valueText}>{residence.displayType}</div>
                        </div>
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>Monthly Payment</div>
                          <div className={STYLES.valueText}>{residence.formattedPayment}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                          <div className={STYLES.labelText}>Address</div>
                          <div className={STYLES.valueText}>{residence.fullAddress}</div>
                        </div>
                        {residence.housingStatus === 'rent' && (
                          <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                            <div className={STYLES.labelText}>Landlord</div>
                            <div className={STYLES.valueText}>{residence.landlordName}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Host Information Section */}
      {listing.user && (
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>Host Information</h2>
                <ChevronDownIcon className="w-5 h-5" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-6 flex flex-col sm:flex-row items-start gap-6 w-full">
                  <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                    <div className={STYLES.labelText}>Host Name</div>
                    <div className={STYLES.valueText}>
                      {listing.user.firstName && listing.user.lastName 
                        ? `${listing.user.firstName} ${listing.user.lastName}` 
                        : listing.user.email}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                    <div className={STYLES.labelText}>Contact</div>
                    <div className={STYLES.valueText}>{listing.user.email}</div>
                  </div>
                  {housingRequest.status === "approved" && (
                    <div className="min-w-0 flex-1 gap-1.5 flex flex-col items-start">
                      <div className={STYLES.labelText}>Actions</div>
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={handleMessageHost}
                        leftIcon={<MessageSquareIcon className="w-4 h-4" />}
                      >
                        Message Host
                      </BrandButton>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Application Status Timeline - Future Enhancement */}
      <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
        <CardContent className="flex flex-col gap-6 p-6">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Application Status</h2>
              <ChevronDownIcon className="w-5 h-5" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${statusInfo.color} rounded-full px-3 py-1`}>
                    {statusInfo.label}
                  </Badge>
                  <span className="text-gray-600">
                    {housingRequest.status === "approved" && "Congratulations! Your application has been approved."}
                    {housingRequest.status === "declined" && "Unfortunately, your application was not selected."}
                    {housingRequest.status === "pending" && "Your application is being reviewed by the host."}
                  </span>
                </div>
                
                <div className="mt-4">
                  <BrandButton
                    variant="outline"
                    href="/app/rent/applications/general"
                  >
                    Edit General Application
                  </BrandButton>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}