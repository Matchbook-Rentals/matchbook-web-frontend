import { ChevronDownIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { APP_PAGE_MARGIN } from "@/constants/styles";
import { HousingRequest, User, Application, Income, ResidentialHistory, Listing, Identification, IDPhoto } from "@prisma/client";
import Link from "next/link";
import { calculateRent, calculateLengthOfStay as calculateStayLength } from "@/lib/calculate-rent";

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
    return application?.incomes?.reduce((acc, cur) => acc + Number(cur.monthlyAmount || 0), 0) || 0;
  };

  // Helper function to calculate rent-to-income ratio
  const getRentToIncomeRatio = () => {
    const monthlyRent = getMonthlyRent();
    const monthlyIncome = getTotalMonthlyIncome();
    
    if (monthlyIncome === 0) return { percentage: 'N/A', status: 'Unknown' };
    
    const ratio = (monthlyRent / monthlyIncome) * 100;
    const percentage = Math.round(ratio);
    
    let status = 'Poor';
    if (ratio <= 30) status = 'Great';
    else if (ratio <= 40) status = 'Good';
    
    return { percentage: `${percentage}%`, status };
  };

  return (
    <main className="bg-white flex flex-row justify-center w-full">
      <div className={`bg-white w-full max-w-[1920px] relative ${APP_PAGE_MARGIN} py-4`}>
        {/* Back Navigation */}
        <Link 
          href={
            from === 'dashboard' 
              ? '/platform/host/dashboard/applications'
              : `/platform/host/${listingId}/applications`
          } 
          className="hover:underline flex items-center gap-2 mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-12">
          <Button
            variant="outline"
            className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#ff3b30] text-[#ff3b30] [font-family:'Poppins',Helvetica] font-medium"
          >
            Decline
          </Button>
          <Button
            variant="outline"
            className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] [font-family:'Poppins',Helvetica] font-medium"
          >
            Message Guest
          </Button>
          <Button
            variant="outline"
            className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#39b54a] text-[#39b54a] [font-family:'Poppins',Helvetica] font-medium"
          >
            Approve
          </Button>
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
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {formatCurrency(getTotalMonthlyIncome())}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Household income
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Helvetica-Regular',Helvetica]">
                  {getRentToIncomeRatio().percentage}
                </p>
                <div className={`px-3 py-1 rounded border bg-background ${
                  getRentToIncomeRatio().status === 'Great' ? 'border-[#39b54a] text-[#39b54a]' : 
                  getRentToIncomeRatio().status === 'Good' ? 'border-[#f39c12] text-[#f39c12]' : 
                  'border-[#e74c3c] text-[#e74c3c]'
                }`}>
                  <p className="text-sm font-normal [font-family:'Poppins',Helvetica]">
                    {getRentToIncomeRatio().status}
                  </p>
                </div>
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
      </div>
    </main>
  );
};
