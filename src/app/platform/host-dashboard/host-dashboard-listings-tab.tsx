"use client";

import { MoreHorizontalIcon, Search } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingAndImages } from "@/types";
import CalendarDialog from "@/components/ui/calendar-dialog";
import TabLayout from "./components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface HostDashboardListingsTabProps {
  listings: ListingAndImages[] | null;
  paginationInfo?: PaginationInfo;
}

export default function HostDashboardListingsTab({ listings, paginationInfo }: HostDashboardListingsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const isMobile = useIsMobile();
  
  // Client-side pagination settings
  const clientItemsPerPage = 10; // Always paginate by 10 on client side
  
  // Server pagination info
  const serverItemsPerPage = paginationInfo?.itemsPerPage || 100;
  const serverPage = paginationInfo?.currentPage || 1;

  // Filter options
  const filterOptions = ["Rented", "Inactive", "Active"];

  // Map listing status to display status and color
  const getStatusInfo = (listing: ListingAndImages) => {
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
  const formatPrice = (listing: ListingAndImages) => {
    if (listing.longestLeasePrice && listing.shortestLeasePrice) {
      // If both prices are the same, display only one
      if (listing.longestLeasePrice === listing.shortestLeasePrice) {
        return `$${listing.longestLeasePrice.toLocaleString()} / Month`;
      }
      // Ensure lower price is always first (in case they were inverted)
      const lowerPrice = Math.min(listing.longestLeasePrice, listing.shortestLeasePrice);
      const higherPrice = Math.max(listing.longestLeasePrice, listing.shortestLeasePrice);
      return `$${lowerPrice.toLocaleString()} - $${higherPrice.toLocaleString()} / Month`;
    } else if (listing.shortestLeasePrice) {
      return `$${listing.shortestLeasePrice.toLocaleString()} / Month`;
    } else if (listing.longestLeasePrice) {
      return `$${listing.longestLeasePrice.toLocaleString()} / Month`;
    }
    return "Price not set";
  };

  // Format property details
  const formatDetails = (listing: ListingAndImages) => {
    const beds = listing.bedrooms?.length || listing.bedroomCount || 0;
    const baths = listing.bathroomCount || 0;
    const sqft = listing.squareFeet || "N/A";
    return `${beds} Bedroom, ${baths} Bathroom${baths !== 1 ? 's' : ''}, ${sqft} Sqft`;
  };

  // Filter listings based on selected filters and search term
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    
    let filtered = listings;
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(listing => {
        const { status } = getStatusInfo(listing);
        return selectedFilters.includes(status);
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(listing => {
        // Search in title
        if (listing.title?.toLowerCase().includes(searchLower)) return true;
        
        // Search in address fields
        const addressFields = [
          listing.streetAddress1,
          listing.streetAddress2,
          listing.city,
          listing.state,
          listing.postalCode
        ];
        
        return addressFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return filtered;
  }, [listings, selectedFilters, searchTerm]);

  // Calculate pagination
  const totalCount = paginationInfo?.totalCount || filteredListings.length;
  const totalClientPages = Math.ceil(filteredListings.length / clientItemsPerPage);
  const totalServerPages = paginationInfo?.totalPages || 1;
  
  // Calculate which items to show based on client-side pagination
  const startIndex = (clientPage - 1) * clientItemsPerPage;
  const endIndex = startIndex + clientItemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setClientPage(newPage);
    
    // Check if we need to fetch more data from server
    const totalItemsNeeded = newPage * clientItemsPerPage;
    const currentServerOffset = (serverPage - 1) * serverItemsPerPage;
    const currentServerEnd = currentServerOffset + (listings?.length || 0);
    
    if (totalItemsNeeded > currentServerEnd && serverPage < totalServerPages) {
      // Need to fetch next batch from server
      const url = new URL(window.location.href);
      url.searchParams.set('page', (serverPage + 1).toString());
      router.push(url.toString());
    }
  };

  // Reset to page 1 when filters or search term change
  React.useEffect(() => {
    setClientPage(1);
  }, [selectedFilters, searchTerm]);


  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Search bar component
  const searchBarComponent = (
    <div className="relative w-full md:w-80">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search by title or address"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4 py-2 w-full rounded-lg border border-solid border-[#6e504933] [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[14px]"
      />
    </div>
  );

  // Sidebar content - filters only
  const sidebarContent = (
    <>
      {/* Mobile vertical layout - shown on small screens only */}
      <div className="block md:hidden">
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
                    id={`filter-mobile-${index}`}
                    className="w-6 h-6 rounded-sm"
                    checked={selectedFilters.includes(option)}
                    onCheckedChange={() => toggleFilter(option)}
                  />
                  <label
                    htmlFor={`filter-mobile-${index}`}
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

      {/* Desktop/tablet horizontal layout - shown on medium screens and up */}
      <div className="hidden md:flex items-center flex-wrap gap-4">
        <span className="[font-family:'Outfit',Helvetica] font-medium text-[#271c1a] text-[15px] leading-5 whitespace-nowrap">
          Filter by Status:
        </span>
        <div className="flex items-center flex-wrap gap-3">
          {filterOptions.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Checkbox
                id={`filter-desktop-${index}`}
                className="w-4 h-4 rounded-sm"
                checked={selectedFilters.includes(option)}
                onCheckedChange={() => toggleFilter(option)}
              />
              <label
                htmlFor={`filter-desktop-${index}`}
                className="[font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[14px] leading-5 cursor-pointer"
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
    </>
  );

  // Add Property button component
  const addPropertyButton = (
    <Link href="/platform/host-dashboard/add-property">
      <Button
        className="bg-black text-white hover:bg-gray-800 rounded-lg px-6 py-2 [font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5"
      >
        Add Property
      </Button>
    </Link>
  );

  return (
    <TabLayout
      title="Your Listings"
      sidebarContent={sidebarContent}
      searchBar={searchBarComponent}
      actionButton={addPropertyButton}
      pagination={{
        currentPage: clientPage,
        totalPages: totalClientPages,
        totalItems: filteredListings.length,
        itemsPerPage: clientItemsPerPage,
        startIndex,
        endIndex,
        onPageChange: handlePageChange,
        itemLabel: "listings"
      }}
      emptyStateMessage={listings?.length === 0 ? "No properties found. Add your first property to get started!" : "No properties match the selected filters."}
      totalCount={totalCount}
    >
      {paginatedListings.map((listing) => {
          const { status, statusColor } = getStatusInfo(listing);
          const fullAddress = `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`;
          const displayAddress = isMobile 
            ? (listing.streetAddress1 || `Property in ${listing.state || 'Unknown Location'}`)
            : fullAddress;
          
          return (
            <Card
              key={listing.id}
              className="mb-8 rounded-[5px] border border-solid border-[#6e504933]"
            >
              <CardContent className="p-4">
                <div className="mb-2">
                  <div className="flex justify-between">
                    <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                      {displayAddress}
                    </h2>
                    <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl text-right leading-4">
                      {formatPrice(listing)}
                    </div>
                  </div>

                  {listing.title && (
                    <div className="flex justify-between mt-1">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[16px] leading-5">
                        {listing.title}
                      </div>
                      <div
                        className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${statusColor}`}
                      >
                        {status}
                      </div>
                    </div>
                  )}

                  <div className="mt-1">
                    <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                      {formatDetails(listing)}
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

                  <CalendarDialog 
                    bookings={listing.bookings || []}
                    unavailabilities={listing.unavailablePeriods || []}
                    triggerText="View Calendar"
                    listingId={listing.id}
                  />

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
    </TabLayout>
  );
}
