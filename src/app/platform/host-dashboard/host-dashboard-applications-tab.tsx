"use client";

import { MoreHorizontalIcon, Search } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RequestWithUser } from '@/types';
import { useHostProperties } from "@/contexts/host-properties-provider";

// Filter options
const filterOptions = [
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
      id: "trip-001",
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
      numPets: 1,
      numChildren: 0,
      minPrice: 3000,
      maxPrice: 5000,
      userId: "user-001"
    },
    listing: {
      title: "Modern Downtown Loft",
      streetAddress1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102"
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
      id: "trip-002",
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
      title: "Cozy Studio Near Park",
      streetAddress1: "456 Oak Avenue",
      city: "San Francisco",
      state: "CA",
      postalCode: "94117"
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
      id: "trip-003",
      locationString: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
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
      streetAddress1: "789 Market Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103"
    }
  },
  {
    id: "request-004",
    userId: "user-004",
    listingId: "listing-001",
    tripId: "trip-004",
    startDate: new Date("2025-02-15"),
    endDate: new Date("2025-08-15"),
    status: "pending",
    createdAt: new Date("2025-01-07"),
    updatedAt: new Date("2025-01-07"),
    user: {
      id: "user-004",
      email: "emily.w@example.com",
      firstName: "Emily",
      lastName: "Wilson",
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
      id: "trip-004",
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
      startDate: new Date("2025-02-15"),
      endDate: new Date("2025-08-15"),
      numAdults: 2,
      numPets: 2,
      numChildren: 0,
      minPrice: 3500,
      maxPrice: 4500,
      userId: "user-004"
    },
    listing: {
      title: "Modern Downtown Loft",
      streetAddress1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102"
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
    
  // Calculate price based on trip budget
  const price = trip && trip.minPrice && trip.maxPrice
    ? `$${trip.minPrice.toLocaleString()} - $${trip.maxPrice.toLocaleString()} / Month`
    : "$2,800 / Month"; // Default fallback
  
  return {
    id: request.id,
    name,
    period,
    occupants,
    price,
    status: request.status || 'pending',
    listingTitle: request.listing?.title || 'Unknown Property',
    listingAddress: request.listing ? 
      `${request.listing.streetAddress1 || ''} ${request.listing.city || ''}, ${request.listing.state || ''} ${request.listing.postalCode || ''}` : 
      'Address not available',
    listingId: request.listingId
  };
};

export default function HostDashboardApplicationsTab() {
  const { listings, getListingHousingRequests } = useHostProperties();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [realHousingRequests, setRealHousingRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Fetch housing requests for all listings
  useEffect(() => {
    const fetchAllHousingRequests = async () => {
      if (!listings || listings.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const allRequests: RequestWithUser[] = [];
        
        // Fetch housing requests for each listing
        for (const listing of listings) {
          try {
            const requests = await getListingHousingRequests(listing.id);
            if (requests && Array.isArray(requests)) {
              // Add listing info to each request for display purposes
              const requestsWithListing = requests.map((request: RequestWithUser) => ({
                ...request,
                listing: {
                  title: listing.title,
                  streetAddress1: listing.streetAddress1,
                  city: listing.city,
                  state: listing.state,
                  postalCode: listing.postalCode
                }
              }));
              allRequests.push(...requestsWithListing);
            }
          } catch (error) {
            console.error(`Error fetching housing requests for listing ${listing.id}:`, error);
          }
        }
        
        setRealHousingRequests(allRequests);
      } catch (error) {
        console.error('Error fetching housing requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHousingRequests();
  }, [listings, getListingHousingRequests]);

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  // Use real data if available, otherwise fall back to sample data
  const housingRequestsToUse = realHousingRequests.length > 0 ? realHousingRequests : sampleHousingRequests;
  
  // Convert housing requests to display format
  const applications = housingRequestsToUse.map(formatHousingRequestForDisplay);

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(app => 
        selectedFilters.includes(app.status.toLowerCase())
      );
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        // Search in applicant name
        if (app.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in listing title
        if (app.listingTitle.toLowerCase().includes(searchLower)) return true;
        
        // Search in listing address
        if (app.listingAddress.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [applications, selectedFilters, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search term change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, searchTerm]);

  return (
    <div className="flex mt-8">
      {/* Left sidebar */}
      <div className="w-[201px] mr-8">
        <h1 className="font-medium text-[#3f3f3f] text-[32px] [font-family:'Poppins',Helvetica]">
          Review your Applications
        </h1>

        {/* Filter section */}
        <div className="mt-2">
          <div className="py-6">
            <div className="flex flex-col items-start gap-4">
              <div className="self-stretch [font-family:'Outfit',Helvetica] font-medium text-[#271c1a] text-[15px] leading-5">
                Filter by Status
              </div>

              <div className="flex flex-col w-60 items-start gap-2">
                {filterOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2 w-full">
                    <Checkbox
                      id={option.id}
                      className="w-6 h-6 rounded-sm"
                      checked={selectedFilters.includes(option.id)}
                      onCheckedChange={() => toggleFilter(option.id)}
                    />
                    <label
                      htmlFor={option.id}
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
          
          {/* Search bar */}
          <div className="mt-6 px-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-solid border-[#6e504933] [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Application cards */}
      <div className="flex flex-col gap-5 flex-1">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
          </div>
        ) : (
          paginatedApplications.map((app) => (
            <Card
              key={app.id}
              className="rounded-[5px] border border-solid border-[#6e504933]"
            >
              <CardContent className="p-4">
                <div className="flex justify-between mb-1">
                  <div>
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                      {app.name}
                    </h3>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#6e5049] text-[14px] leading-5 mt-1">
                      for {app.listingTitle}
                    </p>
                  </div>
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl leading-4">
                    {app.price}
                  </div>
                </div>

                <div className="flex justify-between mb-2">
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                    {app.period}
                  </div>
                  <div
                    className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${getStatusColor(app.status)}`}
                  >
                    {app.status}
                  </div>
                </div>

                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5 mb-1">
                  {app.occupants}
                </div>

                <div className="[font-family:'Poppins',Helvetica] font-normal text-[#6e5049] text-[14px] leading-5 mb-8">
                  {app.listingAddress}
                </div>

                <div className="flex gap-4">
                  <Link href={`/platform/host-dashboard/${app.listingId}/${app.id}`}>
                    <Button
                      variant="outline"
                      className="rounded-lg border border-solid border-[#6e504933] [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] leading-5"
                    >
                      Application Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="rounded-lg border border-solid border-[#6e504933] [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] leading-5"
                  >
                    Message Applicant
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg border-[1.5px] border-solid border-[#6e4f4933] p-2 h-auto w-auto"
                  >
                    <MoreHorizontalIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {filteredApplications.length > itemsPerPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="mr-2"
            >
              Previous
            </Button>
            <span className="mx-4 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="ml-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}