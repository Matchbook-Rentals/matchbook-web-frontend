import { MoreHorizontalIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getListingById } from '@/app/actions/listings';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PAGE_MARGIN } from "@/constants/styles";
import TabSelector from "@/components/ui/tab-selector";

// Application data for mapping
const applications = [
  {
    id: 1,
    name: "Isabelle Resner",
    period: "26 Jan 2025 - 28 Jan 2026, 367 days",
    occupants: "2 adults, 3 kids, 1 dog, 3 cats",
    price: "$2,800 / Month",
    status: "Pending",
  },
  {
    id: 2,
    name: "Isabelle Resner",
    period: "26 Jan 2025 - 28 Jan 2026, 367 days",
    occupants: "2 adults, 3 kids, 1 dog, 3 cats",
    price: "$2,800 / Month",
    status: "Pending",
  },
  {
    id: 3,
    name: "Isabelle Resner",
    period: "26 Jan 2025 - 28 Jan 2026, 367 days",
    occupants: "2 adults, 3 kids, 1 dog, 3 cats",
    price: "$2,800 / Month",
    status: "Declined",
  },
  {
    id: 4,
    name: "Isabelle Resner",
    period: "26 Jan 2025 - 28 Jan 2026, 367 days",
    occupants: "2 adults, 3 kids, 1 dog, 3 cats",
    price: "$2,800 / Month",
    status: "Approved",
  },
];

// Filter options
const filterOptions = [
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
  { id: "approved", label: "Approved" },
];

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "text-[#5c9ac5]";
    case "Declined":
      return "text-[#c68087]";
    case "Approved":
      return "text-[#24742f]";
    default:
      return "";
  }
};

const ApplicationsContent = (): JSX.Element => {
  return (
    <div className="flex mt-8">
      {/* Left sidebar - using 15% width */}
      <div className="w-[15%] mr-6">
        <h1 className="text-[32px] text-[#3f3f3f] font-medium [font-family:'Poppins',Helvetica] mb-[45px]">
          Review your Applications
        </h1>

        {/* Filter section */}
        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-6 py-6">
            <div className="flex flex-col gap-4">
              <div className="[font-family:'Outfit',Helvetica] font-medium text-[#271c1a] text-[15px] leading-5">
                Filter by Status
              </div>

              <div className="flex flex-col w-full gap-2">
                {filterOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      className="w-6 h-6 rounded-sm"
                    />
                    <label
                      htmlFor={option.id}
                      className="[font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application cards */}
      <div className="flex flex-col gap-5 flex-1">
        {applications.map((app) => (
          <Card
            key={app.id}
            className="rounded-[5px] border border-solid border-[#6e504933]"
          >
            <CardContent className="p-4">
              <div className="flex justify-between mb-1">
                <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                  {app.name}
                </h3>
                <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl leading-4">
                  {app.price}
                </div>
              </div>

              <div className="flex justify-between mb-2">
                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                  {app.period}
                </div>
                <div
                  className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${getStatusColor(app.status)}`}
                >
                  {app.status}
                </div>
              </div>

              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5 mb-8">
                {app.occupants}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="rounded-lg border border-solid border-[#6e504933] [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] leading-5"
                >
                  Application Details
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg border-[1.5px] border-solid border-[#6e4f4933] p-2 h-auto w-auto"
                >
                  <MoreHorizontalIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const BookingsContent = (): JSX.Element => {
  return <div className="mt-8">Bookings Content</div>;
};

const ReviewsContent = (): JSX.Element => {
  return <div className="mt-8">Reviews Content</div>;
};

const ListingContent = (): JSX.Element => {
  return <div className="mt-8">Listing Content</div>;
};

const Box = (): JSX.Element => {
  const tabs = [
    {
      value: "applications",
      label: "Applications",
      content: <ApplicationsContent />,
    },
    {
      value: "bookings",
      label: "Bookings",
      content: <BookingsContent />,
    },
    {
      value: "reviews",
      label: "Reviews",
      content: <ReviewsContent />,
    },
    {
      value: "listing",
      label: "Listing",
      content: <ListingContent />,
    },
  ];

  return (
    <div className={`${PAGE_MARGIN} min-h-screen pt-6`}>
      <div className="w-full">
        <TabSelector
          tabs={tabs}
          defaultTab="applications"
          tabsListClassName="mb-0"
        />
      </div>
    </div>
  );
};

interface PropertyDashboardPageProps {
  params: { listingId: string }
}

const PropertyDashboardPage = async ({ params }: PropertyDashboardPageProps) => {
  const { listingId } = params;
  const listing = await getListingById(listingId);
  if (!listing) return notFound();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Box />
    </Suspense>
  );
};

export default PropertyDashboardPage;