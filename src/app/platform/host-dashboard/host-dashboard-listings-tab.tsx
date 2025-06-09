"use client";

import { MoreHorizontalIcon, Search } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingAndImages } from "@/types";
import { PAGE_MARGIN } from "@/constants/styles";
import CalendarDialog from "@/components/ui/calendar-dialog";

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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const totalPages = totalClientPages;
    const currentPage = clientPage;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className={`${PAGE_MARGIN} flex`}>
      {/* Filter sidebar */}
      <div className="w-[201px] mr-8">
        <h1 className="font-medium text-[#3f3f3f] text-[32px] [font-family:'Poppins',Helvetica]">
          Your Listings
        </h1>

        <div className="mt-2">
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
          
          {/* Search bar */}
          <div className="mt-6 px-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by title or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-solid border-[#6e504933] [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="flex-1">
        {paginatedListings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {listings?.length === 0 ? "No properties found. Add your first property to get started!" : "No properties match the selected filters."}
          </div>
        )}
        {paginatedListings.map((listing) => {
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
        
        {/* Pagination */}
        {filteredListings.length > clientItemsPerPage && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredListings.length)} of {filteredListings.length} filtered listings
              {totalCount > filteredListings.length && ` (${totalCount} total)`}
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (clientPage > 1) handlePageChange(clientPage - 1);
                    }}
                    className={clientPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((pageNum, index) => (
                  <PaginationItem key={index}>
                    {pageNum === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum as number);
                        }}
                        isActive={clientPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (clientPage < totalClientPages) handlePageChange(clientPage + 1);
                    }}
                    className={clientPage === totalClientPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
