"use client";

import { MoreHorizontalIcon, Search, Home, Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListingAndImages, RequestWithUser } from '@/types';
import MessageGuestDialog from "@/components/ui/message-guest-dialog";
import TabLayout from "../../components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationContent } from '../useNavigationContent';
import { useUser } from "@clerk/nextjs";

// Sample housing requests for when no real data exists
const generateSampleHousingRequests = (listingId: string): RequestWithUser[] => [
  {
    id: `sample-request-${listingId}-1`,
    userId: "sample-user-1",
    listingId: listingId,
    tripId: "sample-trip-1",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    status: "pending",
    createdAt: new Date("2025-01-06"),
    updatedAt: new Date("2025-01-06"),
    user: {
      id: "sample-user-1",
      email: "alex.chen@example.com",
      firstName: "Alex",
      lastName: "Chen",
      profileImageSrc: null,
      emailVerified: null,
      isAdmin: false,
      isHost: false,
      isBeta: false,
      isSeeded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeAccountId: null,
      stripeAccountStatus: null,
      stripeCustomerId: null,
      showRentEasyFlow: false,
      notificationPreferences: null,
      preferredPropertyTypes: [],
      phoneNumber: null,
      role: "renter"
    },
    trip: {
      id: "sample-trip-1",
      locationString: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-05-01"),
      numAdults: 2,
      numPets: 0,
      numChildren: 0,
      minPrice: 3000,
      maxPrice: 4000,
      userId: "sample-user-1"
    }
  },
  {
    id: `sample-request-${listingId}-2`,
    userId: "sample-user-2",
    listingId: listingId,
    tripId: "sample-trip-2",
    startDate: new Date("2025-03-15"),
    endDate: new Date("2025-06-15"),
    status: "approved",
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
    user: {
      id: "sample-user-2",
      email: "jordan.m@example.com",
      firstName: "Jordan",
      lastName: "Martinez",
      profileImageSrc: null,
      emailVerified: null,
      isAdmin: false,
      isHost: false,
      isBeta: false,
      isSeeded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeAccountId: null,
      stripeAccountStatus: null,
      stripeCustomerId: null,
      showRentEasyFlow: false,
      notificationPreferences: null,
      preferredPropertyTypes: [],
      phoneNumber: null,
      role: "renter"
    },
    trip: {
      id: "sample-trip-2",
      locationString: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      city: "San Francisco",
      state: "CA",
      postalCode: "94117",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-03-15"),
      endDate: new Date("2025-06-15"),
      numAdults: 1,
      numPets: 1,
      numChildren: 0,
      minPrice: 2800,
      maxPrice: 3500,
      userId: "sample-user-2"
    }
  }
];

// Base filter options
const baseFilterOptions = [
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
  { id: "approved", label: "Approved" },
];

// Admin-only filter option
const adminFilterOption = { id: "mock_data", label: "Mock Data" };

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
    userId: request.userId,
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
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingApplicationId, setLoadingApplicationId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isAdmin = user?.sessionClaims?.metadata?.role === 'admin';
  
  // Get filter options based on user role
  const filterOptions = isAdmin ? [...baseFilterOptions, adminFilterOption] : baseFilterOptions;
  
  // Create a wrapper component that passes the onNavigate callback
  const MobileNavigationContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    const { NavigationContent } = useNavigationContent({ 
      listingId: listing.id,
      onNavigate
    });
    return <NavigationContent />;
  };

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingApplicationId(null);
  }, [pathname]);

  const handleViewApplicationDetails = (applicationId: string) => {
    setLoadingApplicationId(applicationId);
    router.push(`/app/host/${listing.id}/applications/${applicationId}?from=listing`);
  };

  // Determine which data to use based on filters and user role
  const requestsToUse = useMemo(() => {
    // If admin has selected "Mock Data" filter, always show sample data
    if (isAdmin && selectedFilters.includes('mock_data')) {
      return generateSampleHousingRequests(listing.id);
    }
    // Otherwise, use real data if available, otherwise generate sample data
    return housingRequests.length > 0 ? housingRequests : generateSampleHousingRequests(listing.id);
  }, [housingRequests, selectedFilters, isAdmin, listing.id]);
  
  // Convert housing requests to the format the UI expects
  const applications = requestsToUse.map(formatHousingRequestForDisplay);

  // Filter applications based on selected filters and search term
  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Apply status filters (exclude mock_data filter from status filtering)
    const statusFilters = selectedFilters.filter(filter => filter !== 'mock_data');
    if (statusFilters.length > 0) {
      filtered = filtered.filter(app => {
        return statusFilters.includes(app.status.toLowerCase());
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        // Search in applicant name
        if (app.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in period/dates
        if (app.period.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [applications, selectedFilters, searchTerm]);

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
        placeholder="Search by name or dates"
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
                    checked={selectedFilters.includes(option.id)}
                    onCheckedChange={() => toggleFilter(option.id)}
                  />
                  <label
                    htmlFor={`filter-mobile-${index}`}
                    className="flex-1 [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFilter(option.id);
                    }}
                  >
                    {option.label}
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
                checked={selectedFilters.includes(option.id)}
                onCheckedChange={() => toggleFilter(option.id)}
              />
              <label
                htmlFor={`filter-desktop-${index}`}
                className="[font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[14px] leading-5 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFilter(option.id);
                }}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <TabLayout
      title="Applications"
      subtitle={`Applications for ${listing.title || listing.streetAddress1 || 'this listing'}`}
      searchPlaceholder="Search by name or dates"
      filterLabel="Filter by status"
      filterOptions={filterOptions.map(opt => ({ value: opt.id, label: opt.label }))}
      onSearchChange={setSearchTerm}
      onFilterChange={(value) => {
        if (filterOptions.find(opt => opt.id === value)) {
          toggleFilter(value);
        }
      }}
      noMargin={true}
      emptyStateMessage={housingRequests.length === 0 ? "No applications yet for this listing." : "No applications match the selected filters."}
    >
      {filteredApplications.map((app) => {
        const addressDisplay = isMobile 
          ? (listing.streetAddress1 || `Property in ${listing.state || 'Unknown Location'}`)
          : `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`;

        return (
          <Card
            key={app.id}
            className="mb-8 rounded-[5px] border border-solid border-[#6e504933]"
          >
            <CardContent className="p-4">
              <div className="mb-2">
                <div className="flex justify-between">
                  <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                    {addressDisplay}
                  </h2>
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl text-right leading-4">
                    {app.price}
                  </div>
                </div>

                <div className="flex justify-between mt-1">
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[16px] leading-5">
                    Applicant: {app.name}
                  </div>
                  <div
                    className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${getStatusColor(app.status)}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </div>
                </div>

                <div className="mt-1">
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                    {app.occupants} • {app.period}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handleViewApplicationDetails(app.id)}
                  disabled={loadingApplicationId === app.id}
                  className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] flex items-center gap-2"
                >
                  Application Details
                  {loadingApplicationId === app.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>

                <MessageGuestDialog
                  listingId={listing.id}
                  guestName={app.name}
                  guestUserId={app.userId}
                  className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                >
                  <Button
                    variant="outline"
                    className="rounded-lg border border-solid border-[#6e504933] [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] leading-5"
                  >
                    Message Applicant
                  </Button>
                </MessageGuestDialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg border-[1.5px] border-solid border-[#6e4f4933] h-10 w-10 p-2"
                    >
                      <MoreHorizontalIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/app/host/${listing.id}`} className="cursor-pointer flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Manage Listing
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </TabLayout>
  );
};

export default ApplicationsTab;
