"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Check, XCircle, User, Home, DollarSign, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MessageGuestDialog from "@/components/ui/message-guest-dialog";
import TabLayout from "./components/tab-layout";
import { useIsMobile } from "@/hooks/useIsMobile";

// Extended booking type with included relations
type BookingWithRelations = {
  id: string;
  userId: string;
  listingId: string;
  tripId?: string;
  matchId: string;
  startDate: Date;
  endDate: Date;
  totalPrice?: number;
  monthlyRent?: number;
  createdAt: Date;
  status: string;
  listing?: {
    title: string;
    streetAddress1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  trip?: {
    numAdults: number;
    numPets: number;
    numChildren: number;
  };
};

// Sample bookings data for hosts
const sampleBookings: BookingWithRelations[] = [
  {
    id: "booking-001",
    userId: "user-001",
    listingId: "listing-001",
    tripId: "trip-001",
    matchId: "match-001",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    totalPrice: 12000,
    monthlyRent: 4000,
    createdAt: new Date("2024-12-20"),
    status: "active",
    listing: {
      title: "Modern Downtown Loft",
      streetAddress1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102"
    },
    user: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com"
    },
    trip: {
      numAdults: 2,
      numPets: 1,
      numChildren: 0
    }
  },
  {
    id: "booking-002",
    userId: "user-002",
    listingId: "listing-002",
    tripId: "trip-002",
    matchId: "match-002",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    totalPrice: 10500,
    monthlyRent: 3500,
    createdAt: new Date("2024-12-15"),
    status: "upcoming",
    listing: {
      title: "Cozy Studio Near Park",
      streetAddress1: "456 Oak Avenue",
      city: "San Francisco",
      state: "CA",
      postalCode: "94117"
    },
    user: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@example.com"
    },
    trip: {
      numAdults: 1,
      numPets: 0,
      numChildren: 0
    }
  },
  {
    id: "booking-003",
    userId: "user-003",
    listingId: "listing-003",
    tripId: "trip-003",
    matchId: "match-003",
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-12-31"),
    totalPrice: 13500,
    monthlyRent: 4500,
    createdAt: new Date("2024-09-15"),
    status: "completed",
    listing: {
      title: "Spacious 2BR Apartment",
      streetAddress1: "789 Market Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103"
    },
    user: {
      firstName: "Michael",
      lastName: "Davis",
      email: "m.davis@example.com"
    },
    trip: {
      numAdults: 2,
      numPets: 0,
      numChildren: 1
    }
  },
  {
    id: "booking-004",
    userId: "user-004",
    listingId: "listing-001",
    tripId: "trip-004",
    matchId: "match-004",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-01-31"),
    totalPrice: 4000,
    monthlyRent: 4000,
    createdAt: new Date("2024-12-10"),
    status: "cancelled",
    listing: {
      title: "Modern Downtown Loft",
      streetAddress1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102"
    },
    user: {
      firstName: "Emily",
      lastName: "Wilson",
      email: "emily.w@example.com"
    },
    trip: {
      numAdults: 2,
      numPets: 2,
      numChildren: 0
    }
  }
];

interface HostDashboardBookingsTabProps {
  bookings?: any[]; // Using any for now since we need to define the proper type
}

export default function HostDashboardBookingsTab({ bookings: propBookings }: HostDashboardBookingsTabProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  // Filter options
  const filterOptions = ["Active", "Upcoming", "Past", "Cancelled"];

  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Get status info for display
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          icon: <Clock className="h-4 w-4" />,
          className: "text-green-600"
        };
      case "upcoming":
        return {
          label: "Upcoming",
          icon: <Calendar className="h-4 w-4" />,
          className: "text-blue-600"
        };
      case "completed":
        return {
          label: "Past",
          icon: <Check className="h-4 w-4" />,
          className: "text-gray-600"
        };
      case "cancelled":
        return {
          label: "Cancelled",
          icon: <XCircle className="h-4 w-4" />,
          className: "text-red-600"
        };
      default:
        return {
          label: "Pending",
          icon: <Clock className="h-4 w-4" />,
          className: "text-yellow-600"
        };
    }
  };

  // Format date range
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const end = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${start} - ${end} (${days} days)`;
  };

  // Format guest info
  const formatGuestInfo = (trip?: { numAdults: number; numPets: number; numChildren: number }) => {
    if (!trip) return "No guest info";
    
    const parts = [];
    if (trip.numAdults > 0) {
      parts.push(`${trip.numAdults} adult${trip.numAdults !== 1 ? "s" : ""}`);
    }
    if (trip.numChildren > 0) {
      parts.push(`${trip.numChildren} child${trip.numChildren !== 1 ? "ren" : ""}`);
    }
    if (trip.numPets > 0) {
      parts.push(`${trip.numPets} pet${trip.numPets !== 1 ? "s" : ""}`);
    }
    
    return parts.join(", ");
  };

  // Use real bookings if available, otherwise fall back to sample data
  const bookingsToUse = propBookings && propBookings.length > 0 ? propBookings : sampleBookings;

  // Filter bookings based on selected filters and search term
  const filteredBookings = useMemo(() => {
    let filtered = bookingsToUse;
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(booking => {
        const statusInfo = getStatusInfo(booking.status);
        return selectedFilters.includes(statusInfo.label);
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        // Search in listing title
        if (booking.listing?.title?.toLowerCase().includes(searchLower)) return true;
        
        // Search in address fields
        const addressFields = [
          booking.listing?.streetAddress1,
          booking.listing?.city,
          booking.listing?.state,
          booking.listing?.postalCode
        ];
        
        if (addressFields.some(field => field?.toLowerCase().includes(searchLower))) return true;
        
        // Search in guest name
        const guestName = booking.user ? 
          `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase() : "";
        if (guestName.includes(searchLower)) return true;
        
        // Search in guest email
        if (booking.user?.email?.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [bookingsToUse, selectedFilters, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search term change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, searchTerm]);

  // Sidebar content
  const sidebarContent = (
    <>
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
            placeholder="Search by property, address, or guest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-solid border-[#6e504933] [font-family:'Outfit',Helvetica] font-normal text-[#271c1a] text-[15px]"
          />
        </div>
      </div>
    </>
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <TabLayout
      title="Your Bookings"
      sidebarContent={sidebarContent}
      pagination={{
        currentPage,
        totalPages,
        totalItems: filteredBookings.length,
        itemsPerPage,
        startIndex,
        endIndex,
        onPageChange: handlePageChange,
        itemLabel: "bookings"
      }}
      emptyStateMessage={bookingsToUse.length === 0 ? "No bookings yet. Your confirmed bookings will appear here." : "No bookings match the selected filters."}
    >
      {paginatedBookings.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            const fullAddress = booking.listing ? 
              `${booking.listing.streetAddress1 || ""} ${booking.listing.city || ""}, ${booking.listing.state || ""} ${booking.listing.postalCode || ""}` : 
              "Address not available";
            const displayAddress = isMobile ? (booking.listing?.streetAddress1 || "Address not available") : fullAddress;
            
            return (
              <Card
                key={booking.id}
                className="mb-8 rounded-[5px] border border-solid border-[#6e504933]"
              >
                <CardContent className="p-4">
                  <div className="mb-2">
                    <div className="flex justify-between">
                      <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-[#271c1a] text-[17px] leading-6">
                        {displayAddress}
                      </h2>
                      <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-xl text-right leading-4">
                        ${booking.monthlyRent?.toLocaleString() || "0"} / Month
                      </div>
                    </div>

                    {booking.listing?.title && (
                      <div className="flex justify-between mt-1">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] pl-1 text-[16px] leading-5">
                          {booking.listing.title}
                        </div>
                        <div
                          className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </div>
                      </div>
                    )}

                    <div className="mt-1">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5">
                        Guest: {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "Guest Name"} • {formatGuestInfo(booking.trip)} • {formatDateRange(booking.startDate, booking.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                    >
                      View Booking Details
                    </Button>

                    <MessageGuestDialog
                      listingId={booking.listingId}
                      guestName={booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "Guest"}
                      guestUserId={booking.userId}
                      className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                    />

                    {booking.status === "upcoming" && (
                      <Button
                        variant="outline"
                        className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px]"
                      >
                        Send Check-in Info
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
    </TabLayout>
  );
}