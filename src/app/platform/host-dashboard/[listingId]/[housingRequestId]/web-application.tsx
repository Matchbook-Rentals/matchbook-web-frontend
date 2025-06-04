import { ChevronDownIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export const WebApplication = (): JSX.Element => {
  return (
    <main className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full max-w-[1920px] relative px-6 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 mb-8 text-sm font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
          <span>Applications</span>
          <img
            className="w-2.5 h-[9px]"
            alt="Breadcrumb separator"
            src="/polygon-1.svg"
          />
          <span>{guestDetails.name}</span>
        </nav>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-12">
          <Button
            variant="outline"
            className="w-[290px] h-[63px] rounded-[5px] border-[1.5px] border-[#ff3b30] text-colorsred [font-family:'Poppins',Helvetica] font-medium"
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
                {financialDetails.earnings.monthlyRent}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Monthly Rent
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {financialDetails.earnings.deposit}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Deposit
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {financialDetails.earnings.totalBookingEarnings}
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
                {financialDetails.dates.moveIn}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Move in
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {financialDetails.dates.moveOut}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Move out
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {financialDetails.dates.lengthOfStay}
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
                {guestDetails.rating}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {guestDetails.averageRating}
              </p>
            </div>
            <div>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {guestDetails.household.income}
              </p>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                {guestDetails.household.incomeLabel}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Helvetica-Regular',Helvetica]">
                  {guestDetails.household.rentToIncomeRatio}
                </p>
                <img
                  className="w-[89px] h-[30px]"
                  alt="Vector"
                  src="/vector.svg"
                />
                <p className="text-sm font-normal text-[#39b54a] [font-family:'Poppins',Helvetica]">
                  {guestDetails.household.rentToIncomeStatus}
                </p>
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
                {guestDetails.household_members.adults}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Kids
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {guestDetails.household_members.kids}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Dogs
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {guestDetails.household_members.dogs}
              </p>
            </div>
            <div>
              <p className="text-base font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica]">
                Cats
              </p>
              <p className="text-[28px] font-medium text-[#3f3f3f] [font-family:'Montserrat',Helvetica]">
                {guestDetails.household_members.cats}
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
            {guestDetails.guests.map((guest, index) => (
              <button
                key={index}
                className={`text-base font-normal ${guest.active ? "text-black underline" : "text-[#b3b2b3]"} [font-family:'Poppins',Helvetica]`}
              >
                {guest.name}
              </button>
            ))}
          </div>

          <div className="flex gap-16 mt-4">
            <div>
              <p className="text-[15px] font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Rating
              </p>
              <p className="text-[26px] font-normal text-[#3f3f3f] [font-family:'Poppins',Helvetica] mt-2">
                {guestDetails.rating}
              </p>
            </div>
            <div>
              <p className="text-[15px] font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                Identification
              </p>
              <Button
                variant="outline"
                className="h-[31px] mt-2 rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] text-xs font-medium [font-family:'Poppins',Helvetica]"
              >
                View ID
              </Button>
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

            {residentialHistory.map((residence, index) => (
              <div key={index} className="mt-6">
                <h3 className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                  {residence.type}
                </h3>
                <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                  {residence.ownership}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Address
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {residence.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Monthly Payment
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {residence.monthlyPayment}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Length of residence
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {residence.lengthOfResidence}
                    </p>
                  </div>
                </div>

                {residence.propertyManager && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Property Manager Name
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.propertyManager.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Phone Number
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.propertyManager.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                          Email
                        </p>
                        <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                          {residence.propertyManager.email}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {index < residentialHistory.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
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

            {incomeDetails.map((income, index) => (
              <React.Fragment key={index}>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      {income.source}
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {income.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-light text-[#4f4f4f] [font-family:'Poppins',Helvetica]">
                      Monthly Amount
                    </p>
                    <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mt-1">
                      {income.monthlyAmount}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      className="h-[41px] rounded-[5px] border-[1.5px] border-[#5c9ac5] text-[#5c9ac5] text-xs font-medium [font-family:'Poppins',Helvetica]"
                    >
                      View Proof of income
                    </Button>
                  </div>
                </div>
                {index < incomeDetails.length - 1 && (
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
                {questionnaire.criminal.question}
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {questionnaire.criminal.answer}
              </p>

              <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                {questionnaire.criminal.followUp}
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {questionnaire.criminal.followUpAnswer}
              </p>
            </div>

            <Separator className="my-6" />

            <div className="mt-6">
              <h3 className="text-lg font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                Eviction History
              </h3>
              <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                {questionnaire.eviction.question}
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {questionnaire.eviction.answer}
              </p>

              <p className="text-lg font-normal text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-2">
                {questionnaire.eviction.followUp}
              </p>
              <p className="text-base font-medium text-[#4f4f4f] [font-family:'Poppins',Helvetica] mb-4">
                {questionnaire.eviction.followUpAnswer}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};