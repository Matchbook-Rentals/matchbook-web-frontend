"use client";

import { 
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
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { HousingRequest, User, Application, Income, ResidentialHistory, Listing, Identification, IDPhoto } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateRent } from "@/lib/calculate-rent";
import { SecureFileViewer } from "@/components/secure-file-viewer";
import BrandModal from "@/components/BrandModal";
import { getOrCreateListingConversation } from "@/app/actions/housing-requests";

// Centralized styles matching prototype design
const STYLES = {
  headerText: "[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-xl tracking-[0] leading-[normal]",
  labelText: "[font-family:'Poppins',Helvetica] font-normal text-[#5D606D] text-base tracking-[0] leading-[normal]",
  valueText: "[font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0] leading-[normal]"
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

  // Handle back navigation
  const handleBack = () => {
    if (from) {
      router.push(from);
    } else {
      router.back();
    }
  };
  
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
    <div className="flex w-full items-start bg-background">
      <div className="flex flex-col w-full items-start px-6 py-8 gap-[18px] max-w-[1200px]  mx-auto">
        {/* Header Section */}
        <section className="flex items-end gap-6 w-full">
          <div className="flex items-center gap-3">
            <BrandButton
              variant="outline"
              onClick={handleBack}
              className="flex items-center justify-center w-[77px] h-[44px] border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white [font-family:'Poppins',Helvetica] font-semibold text-sm"
            >
              Back
            </BrandButton>
          </div>
          
          <div className="flex-1 flex items-end justify-between">
            <h1 className="[font-family:'Poppins',Helvetica] font-medium text-[#020202] text-2xl leading-[28.8px]">
              Your Application to {listing.title}
            </h1>
            
            <Badge className={`${statusInfo.color} rounded-full px-2.5 py-1 [font-family:'Poppins',Helvetica] font-medium text-sm`}>
              {statusInfo.label}
            </Badge>
          </div>
        </section>


        {/* Dates Section */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Dates</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Applied on</div>
                <div className={STYLES.valueText}>
                  {formatDate(housingRequest.createdAt)}
                </div>
              </div>
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Move in</div>
                <div className={STYLES.valueText}>
                  {formatDate(housingRequest.startDate)}
                </div>
              </div>
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Move Out</div>
                <div className={STYLES.valueText}>
                  {formatDate(housingRequest.endDate)}
                </div>
              </div>
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Length of Stay</div>
                <div className={STYLES.valueText}>
                  {calculateLengthOfStay()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Summary Section */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Summary</h2>
            </div>
            
            <Separator className="w-full" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-[86px] w-full flex-wrap">
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
          </CardContent>
        </Card>

        {/* Personal Information Section */}
        <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between w-full">
              <h2 className={STYLES.headerText}>Renters</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Renter Name</div>
                <div 
                  className={`${STYLES.valueText} truncate`}
                  title={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                >
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
                <div className={STYLES.labelText}>Rating</div>
                <div className={STYLES.valueText}>4.0</div>
              </div>
              
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[242px]">
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
                        className="h-auto px-2 py-1 border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white [font-family:'Poppins',Helvetica] font-medium text-sm"
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
              
              <div className="flex flex-col items-start gap-1.5 w-full sm:w-[235px]">
                <div className={STYLES.labelText}>Renter Verification Report</div>
                <BrandButton
                  variant="outline"
                  size="sm"
                  className="h-auto px-2 py-1 border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white [font-family:'Poppins',Helvetica] font-medium text-sm"
                >
                  View Report
                </BrandButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Information Section */}
        {getIncomeData().length > 0 && (
          <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>Income</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
                <div className="flex flex-col items-start gap-1.5 w-full sm:w-[300px]">
                  <div className={STYLES.labelText}>Total Income</div>
                  <div className={STYLES.valueText}>{getTotalMonthlyIncome()}</div>
                </div>
                
                <div className="flex items-start gap-1.5 w-full sm:w-[235px]">
                  <div className="flex flex-col gap-1.5">
                    <div className={STYLES.labelText}>Rent to Income Ratio</div>
                    <div className="flex items-start gap-1.5">
                      <div className={STYLES.valueText}>
                        {(() => {
                          const totalIncomeStr = getTotalMonthlyIncome();
                          const totalIncomeNum = parseFloat(totalIncomeStr.replace(/[$\/month,]/g, '')) || 1;
                          return Math.round((monthlyRent / totalIncomeNum) * 100);
                        })()}%
                      </div>
                      <Badge className="flex w-[68px] px-2 py-0.5 items-center justify-center gap-1 rounded-md border-[#3c8787] text-[#3c8787] bg-transparent">
                        <div className="[font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-5 whitespace-nowrap">
                          Great
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {getIncomeData().map((income, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
                  <div className="flex flex-col items-start gap-1.5 w-full sm:w-[300px]">
                    <div className={STYLES.labelText}>{income.sourceLabel}</div>
                    <div className={STYLES.valueText}>{income.sourceName}</div>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1.5 w-full sm:w-[389px]">
                    <div className={STYLES.labelText}>Monthly Amount</div>
                    <div className={STYLES.valueText}>{income.formattedAmount}</div>
                  </div>
                  
                  <div className="flex items-start">
                    <BrandButton
                      variant="outline"
                      className="h-auto px-3.5 py-2.5 border-[#3c8787] text-[#3c8787] hover:bg-[#3c8787] hover:text-white [font-family:'Poppins',Helvetica] font-semibold text-sm"
                    >
                      View Proof of Income
                    </BrandButton>
                  </div>
                </div>
              ))}
              
              <Separator className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* Residential History Section */}
        {getResidentialHistory().length > 0 && (
          <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex items-center justify-between w-full">
                <h2 className={STYLES.headerText}>Residential History</h2>
              </div>
              
              {getResidentialHistory().map((residence, index) => (
                <div key={index} className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
                    <div className="flex flex-col items-start gap-1.5 w-full sm:w-[300px]">
                      <div className={STYLES.labelText}>{index === 0 ? 'Current Residence' : `Past Residence ${index}`}</div>
                      <div className={STYLES.valueText}>{residence.displayType}</div>
                    </div>
                    
                    <div className="flex flex-col items-start gap-1.5 w-full sm:w-[389px]">
                      <div className={STYLES.labelText}>Address</div>
                      <div className={STYLES.valueText}>{residence.fullAddress}</div>
                    </div>
                    
                    <div className="flex flex-col items-start gap-1.5 w-full sm:w-[235px]">
                      <div className={STYLES.labelText}>Monthly Payment</div>
                      <div className={STYLES.valueText}>{residence.formattedPayment}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
                    <div className="flex flex-col items-start gap-1.5 w-full sm:w-[300px]">
                      <div className={STYLES.labelText}>Length of Residence</div>
                      <div className={STYLES.valueText}>12 Months</div>
                    </div>
                    
                    {residence.housingStatus === 'rent' && (
                      <>
                        <div className="flex flex-col items-start gap-1.5 w-full sm:w-[389px]">
                          <div className={STYLES.labelText}>Property Manager Name</div>
                          <div className={STYLES.valueText}>{residence.landlordName}</div>
                        </div>
                        
                        <div className="flex flex-col items-start gap-1.5 w-full sm:w-[235px]">
                          <div className={STYLES.labelText}>Phone Number</div>
                          <div className={STYLES.valueText}>N/A</div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {residence.housingStatus === 'rent' && (
                    <div className="flex flex-col sm:flex-row items-start gap-6 w-full flex-wrap">
                      <div className="flex flex-col items-start gap-1.5 w-full sm:w-[348px]">
                        <div className={STYLES.labelText}>Email</div>
                        <div className={STYLES.valueText}>N/A</div>
                      </div>
                    </div>
                  )}
                  
                  {index < getResidentialHistory().length - 1 && (
                    <Separator className="w-full" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}
