import { MoreHorizontalIcon } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ListingAndImages, RequestWithUser } from '@/types';

// Filter options
const filterOptions = [
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
  { id: "approved", label: "Approved" },
];

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
    case "Pending":
      return "text-[#5c9ac5]";
    case "declined":
    case "Declined":
      return "text-[#c68087]";
    case "approved":
    case "Approved":
      return "text-[#24742f]";
    default:
      return "";
  }
};

// Helper function to format housing request data for display
const formatHousingRequestForDisplay = (request: RequestWithUser) => {
  const user = request.user;
  const trip = request.trip;
  
  const name = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Unknown User';
    
  const period = request.startDate && request.endDate
    ? `${request.startDate.toLocaleDateString()} - ${request.endDate.toLocaleDateString()}`
    : 'Flexible dates';
    
  const occupants = trip 
    ? `${trip.numAdults || 0} adults, ${trip.numChildren || 0} kids, ${trip.numPets || 0} pets`
    : 'Not specified';
    
  // You'll need to calculate this based on your pricing logic
  const price = "$2,800 / Month"; // TODO: Calculate actual price
  
  return {
    id: request.id,
    name,
    period,
    occupants,
    price,
    status: request.status || 'pending',
  };
};

interface ApplicationsTabProps {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ listing, housingRequests }) => {
  // Convert housing requests to the format the UI expects
  const applications = housingRequests.map(formatHousingRequestForDisplay);

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
        {applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No applications yet for this listing.
          </div>
        ) : (
          applications.map((app) => (
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
                  <Link href={`/platform/host-dashboard/${listing.id}/${app.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-lg border border-solid border-[#6e504933] [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] leading-5"
                    >
                      Application Details
                    </Button>
                  </Link>
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
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationsTab;