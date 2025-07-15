"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BrandButton } from "@/components/ui/brandButton";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ListingAndImages } from "@/types";
import TabLayout from "./components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationContent } from "./[listingId]/useNavigationContent";
import AddPropertyModal from "@/app/admin/test/add-property-modal/AddPropertyModal";
import HostListingCard from "./components/host-listing-card";

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

interface HostDashboardListingsTabProps {
  listings: ListingAndImages[] | null;
  paginationInfo?: PaginationInfo;
  listingInCreation?: { id: string } | null;
}

export default function HostDashboardListingsTab({ listings, paginationInfo, listingInCreation }: HostDashboardListingsTabProps) {
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


  // Map listing status to display status and color (used for filtering)
  const getStatusInfo = (listing: ListingAndImages) => {
    // Check approval status first
    if (listing.approvalStatus === 'pending' || listing.approvalStatus === 'pendingReview') {
      return { status: "Pending Approval", statusColor: "text-[#c68087]" };
    } else if (listing.approvalStatus === 'rejected') {
      return { status: "Rejected", statusColor: "text-[#c68087]" };
    } else if (listing.approvalStatus === 'approved') {
      // For approved listings, check if marked active by user
      if (listing.markedActiveByUser) {
        // Check rental status for active listings
        if (listing.status === "rented") {
          return { status: "Rented", statusColor: "text-[#24742f]" };
        } else {
          return { status: "Active", statusColor: "text-[#5c9ac5]" };
        }
      } else {
        return { status: "Inactive", statusColor: "text-[#c68087]" };
      }
    } else {
      // Fallback to old logic if approval status is undefined
      if (listing.status === "rented") {
        return { status: "Rented", statusColor: "text-[#24742f]" };
      } else if (listing.status === "booked") {
        return { status: "Active", statusColor: "text-[#5c9ac5]" };
      } else if (listing.status === "available") {
        return { status: "Active", statusColor: "text-[#5c9ac5]" };
      } else {
        return { status: "Inactive", statusColor: "text-[#c68087]" };
      }
    }
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



  // Add Property modal component or direct link
  const addPropertyButton = listingInCreation ? (
    <AddPropertyModal listingInCreation={listingInCreation} />
  ) : (
    <Link href="/app/host/add-property?new=true">
      <BrandButton variant="default">
        Add Property
      </BrandButton>
    </Link>
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
        { value: "active", label: "Active" },
        { value: "pending", label: "Pending Approval" },
        { value: "rejected", label: "Rejected" }
      ]}
      onSearchChange={setSearchTerm}
      onFilterChange={(value) => {
        if (value === "all") {
          setSelectedFilters([]);
        } else {
          const filterMap: { [key: string]: string } = {
            "rented": "Rented",
            "inactive": "Inactive", 
            "active": "Active",
            "pending": "Pending Approval",
            "rejected": "Rejected"
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
      {paginatedListings.map((listing) => (
        <HostListingCard
          key={listing.id}
          listing={listing}
          loadingListingId={loadingListingId}
          onViewDetails={handleViewListingDetails}
        />
      ))}
    </TabLayout>
  );
}
