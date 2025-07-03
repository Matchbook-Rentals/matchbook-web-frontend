"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Check, XCircle, User, Home, DollarSign, Search, MoreHorizontalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import MessageGuestDialog from "@/components/ui/message-guest-dialog";
import TabLayout from "./components/cards-with-filter-layout";
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
  match?: {
    id: string;
    tenantSignedAt?: Date | null;
    landlordSignedAt?: Date | null;
    paymentAuthorizedAt?: Date | null;
    BoldSignLease?: {
      id: string;
      landlordSigned: boolean;
      tenantSigned: boolean;
    } | null;
    Lease?: any | null;
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
  listings?: any[]; // Listings with matches data
}

export default function HostDashboardBookingsTab({ bookings: propBookings, listings: propListings }: HostDashboardBookingsTabProps) {
  // Debug logging
  console.log('HostDashboardBookingsTab: Received propBookings:', propBookings);
  console.log('HostDashboardBookingsTab: propBookings length:', propBookings?.length || 0);
  console.log('HostDashboardBookingsTab: Received propListings:', propListings);
  console.log('HostDashboardBookingsTab: propListings length:', propListings?.length || 0);
  
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingBookingId(null);
  }, [pathname]);

  const handleViewBookingDetails = (booking: BookingWithRelations) => {
    setLoadingBookingId(booking.id);
    
    // If this is a match awaiting signature (not a real booking yet), go to host match page
    if (booking.status === "awaiting_signature" || booking.id.startsWith("match-")) {
      router.push(`/platform/host/match/${booking.matchId}`);
    } else {
      // Navigate to regular booking details page
      router.push(`/platform/host/bookings/${booking.id}`);
    }
  };

  // Filter options
  const filterOptions = ["Active", "Upcoming", "Past", "Cancelled", "Awaiting Signature"];

  // Toggle filter selection
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Get status info for display
  const getStatusInfo = (booking: BookingWithRelations) => {
    // Handle special awaiting_signature status (from matches without bookings)
    if (booking.status === "awaiting_signature") {
      return {
        label: "Awaiting Signature",
        icon: <Clock className="h-4 w-4" />,
        className: "text-[#d97706]"
      };
    }

    // Check if awaiting signature (match has BoldSignLease but not fully signed or no payment authorized)
    if (booking.match?.BoldSignLease && 
        ((!booking.match.BoldSignLease.tenantSigned || !booking.match.BoldSignLease.landlordSigned) || 
         !booking.match.paymentAuthorizedAt)) {
      return {
        label: "Awaiting Signature",
        icon: <Clock className="h-4 w-4" />,
        className: "text-[#d97706]"
      };
    }

    switch (booking.status) {
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

  // Get signature status text for awaiting signature bookings
  const getSignatureStatusText = (booking: BookingWithRelations) => {
    if (!booking.match?.BoldSignLease) return booking.status;
    
    const { BoldSignLease } = booking.match;
    
    // If tenant hasn't signed yet
    if (!BoldSignLease.tenantSigned) {
      return "Awaiting Renter signature";
    }
    
    // If tenant signed but landlord hasn't
    if (BoldSignLease.tenantSigned && !BoldSignLease.landlordSigned) {
      return "Awaiting your signature";
    }
    
    // If both signed but no payment authorized
    if (BoldSignLease.tenantSigned && BoldSignLease.landlordSigned && !booking.match.paymentAuthorizedAt) {
      return "Awaiting payment authorization";
    }
    
    return booking.status;
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

  // Combine actual bookings with matches that don't have bookings yet (awaiting signature)
  // This mirrors the exact logic from the listing bookings page
  const allBookingsData = useMemo(() => {
    if (!propBookings || !propListings) {
      console.log('HostDashboardBookingsTab: Missing data, using sample data');
      return sampleBookings;
    }

    const existingBookings = propBookings || [];
    const existingBookingMatchIds = new Set(existingBookings.map(b => b.matchId));
    
    console.log('HostDashboardBookingsTab: Processing', propListings.length, 'listings for matches');
    
    // Find matches that have BoldSignLease (lease documents) but no booking yet
    // Only include matches that are NOT fully completed (still awaiting signature or payment)
    const matchesAwaitingSignature = propListings
      .flatMap(listing => (listing.matches || []).map(match => ({ ...match, listing })))
      .filter(match => {
        // Must have lease document
        if (!match.BoldSignLease) return false;
        
        // Must not already have a booking
        if (existingBookingMatchIds.has(match.id)) return false;
        
        // Must have valid trip and user data
        if (!match.trip || !match.trip.user) return false;
        
        // Must be incomplete - either not fully signed OR payment not authorized
        const isFullySigned = match.BoldSignLease.landlordSigned && match.BoldSignLease.tenantSigned;
        const isPaymentAuthorized = !!match.paymentAuthorizedAt;
        
        // Only include if it's NOT fully completed
        return !(isFullySigned && isPaymentAuthorized);
      })
      .map(match => ({
        // Convert match to booking-like structure
        id: `match-${match.id}`, // Prefix to distinguish from real bookings
        userId: match.trip.user.id,
        listingId: match.listingId,
        tripId: match.tripId,
        matchId: match.id,
        startDate: match.trip.startDate,
        endDate: match.trip.endDate,
        totalPrice: null,
        monthlyRent: match.monthlyRent,
        createdAt: new Date(match.trip.createdAt),
        status: "awaiting_signature", // Special status
        listing: {
          title: match.listing.title,
          streetAddress1: match.listing.streetAddress1,
          city: match.listing.city,
          state: match.listing.state,
          postalCode: match.listing.postalCode,
        },
        user: match.trip.user,
        trip: {
          numAdults: match.trip.numAdults,
          numPets: match.trip.numPets,
          numChildren: match.trip.numChildren,
        },
        match: {
          id: match.id,
          tenantSignedAt: match.tenantSignedAt,
          landlordSignedAt: match.landlordSignedAt,
          paymentAuthorizedAt: match.paymentAuthorizedAt,
          BoldSignLease: match.BoldSignLease,
          Lease: match.Lease,
        }
      }));
    
    const combined = [...existingBookings, ...matchesAwaitingSignature];
    console.log('HostDashboardBookingsTab: Combined bookings:', existingBookings.length, 'matches:', matchesAwaitingSignature.length, 'total:', combined.length);
    
    return combined;
  }, [propBookings, propListings]);

  const bookingsToUse = allBookingsData;

  // Filter bookings based on selected filters and search term
  const filteredBookings = useMemo(() => {
    let filtered = bookingsToUse;
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(booking => {
        const statusInfo = getStatusInfo(booking);
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

  // Search bar component
  const searchBarComponent = (
    <div className="relative w-full md:w-80">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search by title, address, or guest name"
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <TabLayout
      title="Your Bookings"
      sidebarContent={sidebarContent}
      searchBar={searchBarComponent}
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
      noMargin={true}
    >
      {paginatedBookings.map((booking) => {
            const statusInfo = getStatusInfo(booking);
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
                          {statusInfo.label === "Awaiting Signature" ? getSignatureStatusText(booking) : statusInfo.label}
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
                      onClick={() => handleViewBookingDetails(booking)}
                      disabled={loadingBookingId === booking.id}
                      className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] flex items-center gap-2"
                    >
                      {booking.status === "awaiting_signature" || booking.id.startsWith("match-") ? "View Match Details" : "View Booking Details"}
                      {loadingBookingId === booking.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
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
                          <Link href={`/platform/host/${booking.listingId}`} className="cursor-pointer flex items-center gap-2">
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
}
