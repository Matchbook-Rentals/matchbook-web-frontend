"use client";

import { MoreHorizontalIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useHostProperties } from "@/contexts/host-properties-provider";
import Link from "next/link";
import TabSelector from "@/components/ui/tab-selector";

export default function HostDashboard() {
  const { listings } = useHostProperties();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
  };

  // Filter options
  const filterOptions = ["Rented", "Inactive", "Active"];

  // Map listing status to display status and color
  const getStatusInfo = (listing: any) => {
    if (listing.status === "rented") {
      return { status: "Rented", statusColor: "text-[#24742f]" };
    } else if (listing.status === "booked") {
      return { status: "Active", statusColor: "text-[#5c9ac5]" };
    } else if (listing.status === "available") {
      return { status: "Active", statusColor: "text-[#5c9ac5]" };
    } else {
      return { status: "Inactive", statusColor: "text-[#c68087]" };
    }
  };

  // Format price range
  const formatPrice = (listing: any) => {
    if (listing.monthlyRent) {
      return `$${listing.monthlyRent.toLocaleString()} / Month`;
    } else if (listing.minPrice && listing.maxPrice) {
      return `$${listing.minPrice.toLocaleString()}-$${listing.maxPrice.toLocaleString()} / Month`;
    } else if (listing.minPrice) {
      return `$${listing.minPrice.toLocaleString()} / Month`;
    }
    return "Price not set";
  };

  // Format property details
  const formatDetails = (listing: any) => {
    const beds = listing.bedrooms?.length || listing.bedroomCount || 0;
    const baths = listing.bathroomCount || 0;
    const sqft = listing.squareFeet || "N/A";
    return `${beds} Bedroom, ${baths} Bathroom${baths !== 1 ? 's' : ''}, ${sqft} Sqft`;
  };

  // Filter listings based on selected filters
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    if (selectedFilters.length === 0) {
      return listings;
    }

    return listings.filter(listing => {
      const { status } = getStatusInfo(listing);
      return selectedFilters.includes(status);
    });
  }, [listings, selectedFilters]);

  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Your Listings tab content
  const yourListingsContent = (
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
                      checked={selectedFilters.includes(option)}
                      onCheckedChange={() => toggleFilter(option)}
                    />
                    <label
                      htmlFor={`filter-${index}`}
                      className="flex-1 [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFilter(option);
                      }}
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
        {filteredListings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {listings?.length === 0 ? "No properties found. Add your first property to get started!" : "No properties match the selected filters."}
          </div>
        )}
        {filteredListings.map((listing) => {
          const { status, statusColor } = getStatusInfo(listing);
          const address = `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`;
          
          return (
            <Card
              key={listing.id}
              className="mb-8 rounded-[5px] border border-solid border-[#6e504933]"
            >
              <CardContent className="p-4">
                <div className="mb-2">
                  <div className="flex justify-between">
                    <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                      {address}
                    </h2>
                    <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl text-right leading-4">
                      {formatPrice(listing)}
                    </div>
                  </div>

                  <div className="flex justify-between mt-2">
                    <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                      {formatDetails(listing)}
                    </div>
                    <div
                      className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${statusColor}`}
                    >
                      {status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                  <Link href={`/platform/host-dashboard/${listing.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                    >
                      View Listing Details
                    </Button>
                  </Link>

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
          );
        })}
      </div>
    </div>
  );

  // Your Bookings tab content (placeholder)
  const yourBookingsContent = (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center text-gray-500">
        <h3 className="text-lg font-semibold mb-2">Your Bookings</h3>
        <p>Your bookings will appear here</p>
      </div>
    </div>
  );

  // Your Applications tab content (placeholder)
  const yourApplicationsContent = (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center text-gray-500">
        <h3 className="text-lg font-semibold mb-2">Your Applications</h3>
        <p>Your tenant applications will appear here</p>
      </div>
    </div>
  );

  // Define tabs
  const tabs = [
    {
      value: 'listings',
      label: 'Your Listings',
      content: (
        <div key="listings-content">
          {yourListingsContent}
        </div>
      )
    },
    {
      value: 'bookings',
      label: 'Your Bookings',
      content: (
        <div key="bookings-content">
          {yourBookingsContent}
        </div>
      )
    },
    {
      value: 'applications',
      label: 'Your Applications',
      content: (
        <div key="applications-content">
          {yourApplicationsContent}
        </div>
      )
    }
  ];

  return (
    <div className="bg-background flex flex-row justify-center w-full">
      <div className="bg-background overflow-hidden w-full max-w-[1920px] relative py-24">
        <div className="max-w-[1373px] mx-auto">
          <TabSelector
            tabs={tabs}
            defaultTab="listings"
            useUrlParams={false}
            onTabChange={handleTabChange}
            tabsListClassName="border-0"
            className="border-0"
          />
        </div>
      </div>
    </div>
  );
}