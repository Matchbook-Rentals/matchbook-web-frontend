"use client";

import { MoreHorizontalIcon, Home, Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RequestWithUser } from '@/types';
import TabLayout from "./components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationContent } from "./[listingId]/useNavigationContent";
import { useUser } from "@clerk/nextjs";
import HostApplicationCards from "./host-application-cards";
import { calculateRent } from "@/lib/calculate-rent";

// Base filter options
const baseFilterOptions = [
  { id: "all", label: "All" },
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

// Sample housing requests data across all listings
const sampleHousingRequests: RequestWithUser[] = [
  {
    id: "request-001",
    userId: "user-001",
    listingId: "listing-001",
    tripId: "trip-001",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    status: "pending",
    createdAt: new Date("2025-01-06"),
    updatedAt: new Date("2025-01-06"),
    user: {
      id: "user-001",
      email: "john.smith@example.com",
      firstName: "John",
      lastName: "Smith",
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=JS",
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
      id: "trip-001",
      locationString: "New York, NY",
      latitude: 40.7128,
      longitude: -74.0060,
      city: "New York",
      state: "NY",
      postalCode: "10001",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-05-01"),
      numAdults: 2,
      numPets: 1,
      numChildren: 0,
      minPrice: 3000,
      maxPrice: 5000,
      userId: "user-001"
    },
    listing: {
      title: "Modern Downtown Loft",
      streetAddress1: "123 Broadway",
      city: "New York",
      state: "NY",
      postalCode: "10001"
    }
  },
  {
    id: "request-002",
    userId: "user-002",
    listingId: "listing-002",
    tripId: "trip-002",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-06-01"),
    status: "approved",
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
    user: {
      id: "user-002",
      email: "sarah.j@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=SJ",
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
      id: "trip-002",
      locationString: "Los Angeles, CA",
      latitude: 34.0522,
      longitude: -118.2437,
      city: "Los Angeles",
      state: "CA",
      postalCode: "90210",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-06-01"),
      numAdults: 1,
      numPets: 0,
      numChildren: 0,
      minPrice: 2500,
      maxPrice: 3500,
      userId: "user-002"
    },
    listing: {
      title: "Cozy Studio Near Beach",
      streetAddress1: "456 Sunset Boulevard",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90210"
    }
  },
  {
    id: "request-003",
    userId: "user-003",
    listingId: "listing-003",
    tripId: "trip-003",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    status: "declined",
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
    user: {
      id: "user-003",
      email: "m.davis@example.com",
      firstName: "Michael",
      lastName: "Davis",
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=MD",
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
      id: "trip-003",
      locationString: "Chicago, IL",
      latitude: 41.8781,
      longitude: -87.6298,
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-04-15"),
      numAdults: 2,
      numPets: 0,
      numChildren: 1,
      minPrice: 4000,
      maxPrice: 6000,
      userId: "user-003"
    },
    listing: {
      title: "Spacious 2BR Apartment",
      streetAddress1: "789 Michigan Avenue",
      city: "Chicago",
      state: "IL",
      postalCode: "60601"
    }
  }
];

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
    
  // Calculate actual monthly rent using the calculateRent function
  let price = "$77,777 / Month"; // Default fallback
  
  if (request.listing && request.startDate && request.endDate) {
    const tripData = {
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate)
    };
    
    const monthlyRent = calculateRent({
      listing: request.listing as any, // listing includes monthlyPricing
      trip: tripData as any
    });
    
    if (monthlyRent && monthlyRent !== 77777) {
      price = `$${monthlyRent.toLocaleString()} / Month`;
    }
  }
  
  return {
    id: request.id,
    userId: request.userId,
    name,
    period,
    occupants,
    price,
    status: request.status || 'pending',
    user, // Pass the user object directly
    listing: request.listing,
    listingId: request.listingId
  };
};


interface HostDashboardApplicationsTabProps {
  housingRequests?: RequestWithUser[];
  hostUserData: any;
  isAdminDev?: boolean;
}

export default function HostDashboardApplicationsTab({
  housingRequests: propHousingRequests,
  hostUserData,
  isAdminDev = false
}: HostDashboardApplicationsTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilter, setSelectedFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingApplicationId, setLoadingApplicationId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  // Get filter options
  const filterOptions = baseFilterOptions;
  
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
    setLoadingApplicationId(null);
  }, [pathname]);

  const handleViewApplicationDetails = async (listingId: string, applicationId: string) => {
    try {
      setLoadingApplicationId(applicationId);
      
      // Set a timeout to clear loading state if navigation takes too long
      const timeoutId = setTimeout(() => {
        setLoadingApplicationId(null);
      }, 10000); // 10 second timeout
      
      router.push(`/app/host/${listingId}/applications/${applicationId}?from=dashboard`);
      
      // Clear timeout if navigation is successful
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error navigating to application details:', error);
      setLoadingApplicationId(null);
      // You could add a toast notification here for user feedback
    }
  };

  // Debug logging
  console.log('HostDashboardApplicationsTab received propHousingRequests:', propHousingRequests);
  console.log('propHousingRequests length:', propHousingRequests?.length || 0);


  // Determine which data to use based on mock data toggle
  const requestsToUse = useMemo(() => {
    console.log('Debug - isAdmin:', isAdmin, 'useMockData:', useMockData, 'propHousingRequests.length:', propHousingRequests?.length || 0);
    
    // If admin has enabled mock data toggle, always show sample data
    if (isAdmin && useMockData) {
      const sampleData = sampleHousingRequests;
      console.log('Debug - returning sample data:', sampleData.length);
      return sampleData;
    }
    // Otherwise, use real data (even if empty)
    console.log('Debug - returning real data:', propHousingRequests?.length || 0);
    return propHousingRequests || [];
  }, [propHousingRequests, useMockData, isAdmin]);
  
  // Convert housing requests to the format the UI expects and sort them
  const applications = useMemo(() => {
    console.log('RQU', requestsToUse)
    const formattedApplications = requestsToUse.map(formatHousingRequestForDisplay);
    
    // Sort by status priority (pending -> approved -> denied) and then by oldest createdAt
    return formattedApplications.sort((a, b) => {
      // Define status priority order
      const statusPriority = { pending: 0, approved: 1, declined: 2 };
      const aStatus = a.status.toLowerCase() as keyof typeof statusPriority;
      const bStatus = b.status.toLowerCase() as keyof typeof statusPriority;
      
      // First sort by status priority
      const statusDiff = (statusPriority[aStatus] ?? 999) - (statusPriority[bStatus] ?? 999);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by oldest createdAt (ascending)
      const aRequest = requestsToUse.find(r => r.id === a.id);
      const bRequest = requestsToUse.find(r => r.id === b.id);
      const aDate = aRequest?.createdAt?.getTime() ?? 0;
      const bDate = bRequest?.createdAt?.getTime() ?? 0;
      return aDate - bDate;
    });
  }, [requestsToUse]);

  // Filter applications based on selected filter and search term
  const filteredApplications = useMemo(() => {
    console.log('🔍 FILTERING DEBUG - Starting filter process');
    console.log('🔍 - applications.length:', applications.length);
    console.log('🔍 - selectedFilter:', selectedFilter);
    console.log('🔍 - searchTerm:', searchTerm);
    
    let filtered = applications;
    
    // Apply status filter (exclude "all" from filtering)
    if (selectedFilter !== 'all') {
      console.log('🔍 - Applying status filter for:', selectedFilter);
      const beforeFilter = filtered.length;
      filtered = filtered.filter(app => {
        return app.status.toLowerCase() === selectedFilter;
      });
      console.log('🔍 - After status filter:', beforeFilter, '→', filtered.length);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      console.log('🔍 - Applying search filter for:', searchTerm);
      const beforeSearch = filtered.length;
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        // Search in applicant name
        if (app.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in period/dates
        if (app.period.toLowerCase().includes(searchLower)) return true;
        
        // Search in listing title
        if (app.listing?.title?.toLowerCase().includes(searchLower)) return true;
        
        // Search in listing address
        if (app.listing?.streetAddress1?.toLowerCase().includes(searchLower)) return true;
        if (app.listing?.city?.toLowerCase().includes(searchLower)) return true;
        if (app.listing?.state?.toLowerCase().includes(searchLower)) return true;
        if (app.listing?.postalCode?.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
      console.log('🔍 - After search filter:', beforeSearch, '→', filtered.length);
    }
    
    console.log('🔍 FILTERING DEBUG - Final filtered.length:', filtered.length);
    console.log('🔍 FILTERING DEBUG - Will pass children to TabLayout:', filtered.length > 0);
    
    return filtered;
  }, [applications, selectedFilter, searchTerm]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  console.log('🎯 RENDER DEBUG - About to render TabLayout');
  console.log('🎯 - requestsToUse.length:', requestsToUse.length);
  console.log('🎯 - filteredApplications.length:', filteredApplications.length);
  console.log('🎯 - Will render children:', filteredApplications.length > 0);

  return (
    <TabLayout
      title="Applications"
      subtitle="Applications for all your listings"
      searchPlaceholder="Search by renter name or address"
      filterLabel="Filter by status"
      filterOptions={filterOptions.map(opt => ({ value: opt.id, label: opt.label }))}
      defaultFilter="pending"
      onSearchChange={setSearchTerm}
      onFilterChange={handleFilterChange}
      noMargin={true}
      emptyStateMessage={
        (() => {
          // If there's no raw data at all
          if (requestsToUse.length === 0) {
            console.log('📝 Empty state: No applications yet');
            return "No applications yet for your listings.";
          }
          // If there's data but filtered results are empty
          if (filteredApplications.length === 0) {
            console.log('📝 Empty state: No applications match filters');
            return "No applications match the selected filters.";
          }
          // This shouldn't happen since we only render this when no children
          console.log('📝 Empty state: Fallback message');
          return "No applications found.";
        })()
      }
      showMockDataToggle={true}
      useMockData={useMockData}
      onMockDataToggle={setUseMockData}
    >
      {filteredApplications.length > 0 ? (
        <HostApplicationCards
          applications={filteredApplications}
          onViewApplicationDetails={handleViewApplicationDetails}
          loadingApplicationId={loadingApplicationId}
          hostUserData={hostUserData}
          isAdminDev={isAdminDev}
        />
      ) : null}
    </TabLayout>
  );
}
