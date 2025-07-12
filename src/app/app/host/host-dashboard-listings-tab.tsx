"use client";

import { MoreVerticalIcon, MapPinIcon, Bed, Bath, Square } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListingAndImages } from "@/types";
import CalendarDialog from "@/components/ui/calendar-dialog";
import TabLayout from "./components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationContent } from "./[listingId]/useNavigationContent";
import AddPropertyModal from "@/app/admin/test/add-property-modal/AddPropertyModal";

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
  const pathname = usePathname();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [loadingListingId, setLoadingListingId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Create a wrapper component that passes the onNavigate callback
  const MobileNavigationContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    const { NavigationContent } = useNavigationContent({ 
      listingId: undefined, // No specific listing for the dashboard
      onNavigate
    });
    return <NavigationContent />;
  };

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingListingId(null);
  }, [pathname]);

  const handleViewListingDetails = (listingId: string) => {
    setLoadingListingId(listingId);
    router.push(`/app/host/${listingId}`);
  };
  
  // Client-side pagination settings
  const clientItemsPerPage = 10; // Always paginate by 10 on client side
  
  // Server pagination info
  const serverItemsPerPage = paginationInfo?.itemsPerPage || 100;
  const serverPage = paginationInfo?.currentPage || 1;


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



  // Add Property modal component
  const addPropertyButton = (
    <AddPropertyModal />
  );

  return (
    <TabLayout
      title="Your Listings"
      searchPlaceholder="Search by title or address"
      filterLabel="Filter by status"
      filterOptions={[
        { value: "all", label: "All" },
        { value: "rented", label: "Rented" },
        { value: "inactive", label: "Inactive" },
        { value: "active", label: "Active" }
      ]}
      onSearchChange={setSearchTerm}
      onFilterChange={(value) => {
        if (value === "all") {
          setSelectedFilters([]);
        } else {
          const filterMap: { [key: string]: string } = {
            "rented": "Rented",
            "inactive": "Inactive", 
            "active": "Active"
          };
          setSelectedFilters([filterMap[value]]);
        }
      }}
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
      noMargin={true}
    >
      {paginatedListings.map((listing) => {
          const { status, statusColor } = getStatusInfo(listing);
          const fullAddress = `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`;
          const displayAddress = isMobile 
            ? (listing.streetAddress1 || `Property in ${listing.state || 'Unknown Location'}`)
            : fullAddress;
          
          return (
            <Card className="w-full p-6 rounded-xl mb-8">
              <CardContent className="p-0">
                <div className="flex gap-6">
                  {/* Property Image */}
                  <div className="w-[209px] h-[140px] rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      alt="Property image"
                      src={listing.listingImages?.[0]?.url || "/image-35.png"}
                    />
                  </div>

                  {/* Property Details */}
                  <div className="flex flex-col gap-4 flex-grow">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2">
                        {/* Status Badge */}
                        <Badge className={`w-fit ${status === 'Active' ? 'bg-[#e9f7ee] text-[#1ca34e] border border-[#1ca34e] hover:bg-[#e9f7ee] hover:text-[#1ca34e]' : status === 'Rented' ? 'bg-blue-50 text-blue-600 border border-blue-600 hover:bg-blue-50 hover:text-blue-600' : 'bg-red-50 text-red-600 border border-red-600 hover:bg-red-50 hover:text-red-600'}`}>
                          {status}
                        </Badge>

                        {/* Property Name */}
                        <h3 className="font-text-label-large-medium text-[#484a54] text-[18px]">
                          {listing.title || displayAddress}
                        </h3>
                      </div>

                      {/* Property Address */}
                      <div className="flex items-center gap-2 w-full">
                        <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
                        <span className="font-text-label-small-regular text-[#777b8b] text-[14px]">
                          {displayAddress}
                        </span>
                      </div>
                    </div>

                    {/* Property Features */}
                    <div className="flex items-center gap-10">
                      {/* Bedroom */}
                      <div className="flex items-center gap-1.5 py-1.5">
                        <Bed className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-sm text-[#344054]">
                          {listing.bedrooms?.length || listing.bedroomCount || 0} Bedroom{(listing.bedrooms?.length || listing.bedroomCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Bathroom */}
                      <div className="flex items-center gap-1.5 py-1.5">
                        <Bath className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-sm text-[#344054]">
                          {listing.bathroomCount || 0} Bathroom{(listing.bathroomCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Square Footage */}
                      <div className="flex items-center gap-1.5 py-1.5">
                        <Square className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-sm text-[#344054]">
                          {listing.squareFeet || 'N/A'} Sqft
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Price and Actions */}
                  <div className="flex flex-col justify-between items-end">
                    {/* More Options Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg border-[#3c8787] h-10 w-10"
                    >
                      <MoreVerticalIcon className="h-5 w-5" />
                    </Button>

                    <div className="flex flex-col items-end gap-3">
                      {/* Price */}
                      <p className="font-semibold text-xl text-[#484a54]">
                        {formatPrice(listing)}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <CalendarDialog 
                          bookings={listing.bookings || []}
                          unavailabilities={listing.unavailablePeriods || []}
                          triggerText="View Calendar"
                          listingId={listing.id}
                          showIcon={false}
                          triggerClassName="!border-primaryBrand !text-primaryBrand hover:!bg-primaryBrand hover:!text-white !transition-all !duration-300 !h-[36px] !min-w-[156px] !rounded-lg !px-4 !py-3 !gap-1 !font-['Poppins'] !font-semibold !text-sm !leading-5 !tracking-normal"
                        />
                        <BrandButton 
                          variant="default"
                          size="sm"
                          href={`/app/host/${listing.id}/summary`}
                          spinOnClick={true}
                        >
                          Manage Listing
                        </BrandButton>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </TabLayout>
  );
}
