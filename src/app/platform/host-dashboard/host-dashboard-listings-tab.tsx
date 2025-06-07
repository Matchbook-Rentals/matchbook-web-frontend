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
import { ListingAndImages } from "@/types";
import { PAGE_MARGIN } from "@/constants/styles";

interface HostDashboardListingsTabProps {
  listings: ListingAndImages[] | null;
}

export default function HostDashboardListingsTab({ listings }: HostDashboardListingsTabProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search term change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, searchTerm]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
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
          <div className="mt-6">
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
        {filteredListings.length === 0 && (
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
                    <div className="[font-family:'Poppins',Helvetica] font-normal text-[#6e5049] text-[15px] leading-5 mt-1">
                      {listing.title}
                    </div>
                  )}

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
        
        {/* Pagination */}
        {filteredListings.length > itemsPerPage && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredListings.length)} of {filteredListings.length} listings
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                          setCurrentPage(pageNum as number);
                        }}
                        isActive={currentPage === pageNum}
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
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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