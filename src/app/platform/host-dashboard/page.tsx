import { MoreHorizontalIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function HostDashboard() {
  // Property listings data
  const listings = [
    {
      id: 1,
      address: "2155 Quincy Ave Ogden, UT 84401",
      details: "3 Bedroom, 2 Bathroom, 2100 Sqft",
      price: "$2,800- $3,200 / Month",
      status: "Active",
      statusColor: "text-[#5c9ac5]",
    },
    {
      id: 2,
      address: "1234 St st",
      details: "3 Bedroom, 2 Bathroom, 2100 Sqft",
      price: "$2,800 / Month",
      status: "Inactive",
      statusColor: "text-[#c68087]",
    },
    {
      id: 3,
      address: "Isabelle Resner",
      details: "3 Bedroom, 2 Bathroom, 2100 Sqft",
      price: "$2,000 -$2,300/ Month",
      status: "Rented",
      statusColor: "text-[#24742f]",
    },
  ];

  // Filter options
  const filterOptions = ["Rented", "Inactive", "Active"];

  return (
    <div className="bg-background flex flex-row justify-center w-full">
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-24">
        <div className="max-w-[1373px] mx-auto">
          <div className="flex">
            {/* Filter sidebar */}
            <div className="w-[201px] mr-8">
              <h1 className="font-medium text-[#3f3f3f] text-[32px] [font-family:'Poppins',Helvetica]">
                Your Listings
              </h1>

              <div className="mt-[45px]">
                <div className="py-6">
                  <div className="flex flex-col items-start gap-4">
                    <div className="self-stretch [font-family:'Outfit',Helvetica] font-medium text-[#271c1a] text-[15px] leading-5">
                      Filter by Status
                    </div>

                    <div className="flex flex-col w-60 items-start gap-2">
                      {filterOptions.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 w-full"
                        >
                          <Checkbox
                            id={`filter-${index}`}
                            className="w-6 h-6 rounded-sm"
                          />
                          <label
                            htmlFor={`filter-${index}`}
                            className="flex-1 [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listings */}
            <div className="flex-1">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="mb-8 rounded-[5px] border border-solid border-[#6e504933]"
                >
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <div className="flex justify-between">
                        <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                          {listing.address}
                        </h2>
                        <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl text-right leading-4">
                          {listing.price}
                        </div>
                      </div>

                      <div className="flex justify-between mt-2">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                          {listing.details}
                        </div>
                        <div
                          className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${listing.statusColor}`}
                        >
                          {listing.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                      <Button
                        variant="outline"
                        className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                      >
                        View Listing Details
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                      >
                        Manage Calendar
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg border-[1.5px] border-solid border-[#6e4f4933] h-10 w-10 p-2"
                      >
                        <MoreHorizontalIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
