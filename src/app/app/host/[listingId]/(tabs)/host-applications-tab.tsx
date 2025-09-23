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
import { ListingAndImages, RequestWithUser } from '@/types';
import MessageGuestDialog from "@/components/ui/message-guest-dialog";
import TabLayout from "../../components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationContent } from '../useNavigationContent';
import { useUser } from "@clerk/nextjs";
import { getListingDisplayName } from "@/utils/listing-helpers";
import { HostApplicationCard } from "../../components/host-application-card";
import { calculateRent } from "@/lib/calculate-rent";
import { OnboardingModal } from "@/components/onboarding-modal";

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
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=AC",
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
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=JM",
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
  },
  {
    id: `sample-request-${listingId}-3`,
    userId: "sample-user-3",
    listingId: listingId,
    tripId: "sample-trip-3",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    status: "declined",
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
    user: {
      id: "sample-user-3",
      email: "taylor.smith@example.com",
      firstName: "Taylor",
      lastName: "Smith",
      imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=TS",
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
      id: "sample-trip-3",
      locationString: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      city: "San Francisco",
      state: "CA",
      postalCode: "94118",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSponsored: false,
      sponsorID: null,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-04-15"),
      numAdults: 1,
      numPets: 0,
      numChildren: 1,
      minPrice: 2500,
      maxPrice: 3200,
      userId: "sample-user-3"
    }
  }
];

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

// Helper function to format housing request data for display
const formatHousingRequestForDisplay = (request: RequestWithUser, listing?: ListingAndImages) => {
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
  
  if (listing && request.startDate && request.endDate) {
    const tripData = {
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate)
    };
    
    const monthlyRent = calculateRent({
      listing: listing as any, // listing includes monthlyPricing
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
  };
};

// Helper function to transform application data for the new card component
const transformApplicationForCard = (app: any, listing: ListingAndImages, isMobile: boolean) => {
  const addressDisplay = isMobile 
    ? (listing.streetAddress1 || `Property in ${listing.state || 'Unknown Location'}`)
    : `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`;

  // Parse occupants string to create occupant objects
  const occupantsParts = app.occupants.split(', ');
  const occupants = [
    { type: "Adult", count: parseInt(occupantsParts[0]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/adult.svg" },
    { type: "Kid", count: parseInt(occupantsParts[1]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/kid.svg" },
    { type: "pet", count: parseInt(occupantsParts[2]?.split(' ')[0] || '0'), icon: "/host-dashboard/svg/pet.svg" },
  ];

  return {
    name: app.name,
    status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
    dates: app.period,
    address: addressDisplay,
    description: `for ${listing.title || 'this property'} - ${listing.numBedrooms || 0} bed ${listing.numBathrooms || 0} bath ${listing.petsAllowed ? 'pet friendly' : ''}`,
    price: app.price,
    occupants,
    profileImage: app.user?.imageUrl, // Use the actual user profile image field
  };
};

interface ApplicationsTabProps {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  hostUserData: any;
  isAdminDev?: boolean;
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({
  listing,
  housingRequests,
  hostUserData,
  isAdminDev = false
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilter, setSelectedFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingApplicationId, setLoadingApplicationId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  // Get filter options (no longer need admin filter option)
  const filterOptions = baseFilterOptions;
  
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

  // Check if host onboarding is complete
  const isOnboardingComplete = (userData: any): boolean => {
    if (!userData) return false;

    const hasStripeAccount = !!userData.stripeAccountId;
    const stripeComplete = userData.stripeChargesEnabled && userData.stripeDetailsSubmitted;
    const hostTermsAgreed = !!userData.agreedToHostTerms;
    const identityVerified = !!userData.medallionIdentityVerified;

    return hasStripeAccount && stripeComplete && hostTermsAgreed && identityVerified;
  };

  const onboardingComplete = isOnboardingComplete(hostUserData);

  const handleViewApplicationDetails = async (applicationId: string) => {
    if (!onboardingComplete) {
      setShowOnboardingModal(true);
      return;
    }

    try {
      setLoadingApplicationId(applicationId);

      // Set a timeout to clear loading state if navigation takes too long
      const timeoutId = setTimeout(() => {
        setLoadingApplicationId(null);
      }, 10000); // 10 second timeout

      router.push(`/app/host/${listing.id}/applications/${applicationId}?from=listing`);

      // Clear timeout if navigation is successful
      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error navigating to application details:', error);
      setLoadingApplicationId(null);
      // You could add a toast notification here for user feedback
    }
  };

  // Determine which data to use based on mock data toggle
  const requestsToUse = useMemo(() => {
    console.log('Debug - isAdmin:', isAdmin, 'useMockData:', useMockData, 'housingRequests.length:', housingRequests.length);
    
    // If admin has enabled mock data toggle, always show sample data
    if (isAdmin && useMockData) {
      const sampleData = generateSampleHousingRequests(listing.id);
      console.log('Debug - returning sample data:', sampleData.length);
      return sampleData;
    }
    // Otherwise, use real data (even if empty)
    console.log('Debug - returning real data:', housingRequests.length);
    return housingRequests;
  }, [housingRequests, useMockData, isAdmin, listing.id]);
  
  // Convert housing requests to the format the UI expects and sort them
  const applications = useMemo(() => {
    const formattedApplications = requestsToUse.map(request => formatHousingRequestForDisplay(request, listing));
    
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
    let filtered = applications;
    
    // Apply status filter (exclude "all" from filtering)
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(app => {
        return app.status.toLowerCase() === selectedFilter;
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
  }, [applications, selectedFilter, searchTerm]);

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };


  return (
    <TabLayout
      title="Applications"
      subtitle={`Applications for ${getListingDisplayName(listing)}`}
      searchPlaceholder="Search by renter name"
      filterLabel="Filter by status"
      filterOptions={filterOptions.map(opt => ({ value: opt.id, label: opt.label }))}
      defaultFilter="pending"
      onSearchChange={setSearchTerm}
      onFilterChange={handleFilterChange}
      noMargin={true}
      emptyStateMessage={housingRequests.length === 0 ? "No applications yet for this listing." : "No applications match the selected filters."}
      showMockDataToggle={true}
      useMockData={useMockData}
      onMockDataToggle={setUseMockData}
    >
      {filteredApplications.map((app) => {
        const cardData = transformApplicationForCard(app, listing, isMobile);
        
        return (
          <div key={app.id} className="mb-8">
            <HostApplicationCard
              {...cardData}
              onApplicationDetails={() => handleViewApplicationDetails(app.id)}
              onMessageGuest={() => {
                // Handle message guest action - you may need to implement this
                console.log('Message guest:', app.name);
              }}
              onManageListing={() => router.push(`/app/host/${listing.id}/summary`)}
              className="border border-solid border-[#6e504933]"
              isLoading={loadingApplicationId === app.id}
            />
          </div>
        );
      })}

      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        hostUserData={hostUserData}
        isAdminDev={isAdminDev}
      />
    </TabLayout>
  );
};

export default ApplicationsTab;
