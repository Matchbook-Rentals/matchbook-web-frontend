"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Check, XCircle, User, Home, DollarSign, Search, MoreHorizontalIcon, Loader2, CreditCard, CheckCircle } from "lucide-react";
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
import TabLayout from "../../components/cards-with-filter-layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { markMoveInComplete } from "@/app/actions/bookings";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

// Sample bookings data for when no real data exists
const generateSampleBookings = (listingId: string): BookingWithRelations[] => [
  {
    id: `sample-booking-${listingId}-1`,
    userId: "sample-user-1",
    listingId: listingId,
    tripId: "sample-trip-1",
    matchId: "sample-match-1",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    totalPrice: 10800,
    monthlyRent: 3600,
    createdAt: new Date("2024-12-20"),
    status: "ongoing",
    user: {
      firstName: "Taylor eeee",
      lastName: "Johnson",
      email: "taylor.j@example.com"
    },
    trip: {
      numAdults: 1,
      numPets: 1,
      numChildren: 0
    },
    match: {
      id: "sample-match-1",
      tenantSignedAt: new Date("2024-12-18"),
      landlordSignedAt: new Date("2024-12-19"),
      paymentAuthorizedAt: new Date("2024-12-20"),
      BoldSignLease: {
        id: "sample-lease-1",
        landlordSigned: true,
        tenantSigned: true
      },
      Lease: null
    }
  },
  {
    id: `sample-booking-${listingId}-2`,
    userId: "sample-user-2",
    listingId: listingId,
    tripId: "sample-trip-2",
    matchId: "sample-match-2",
    startDate: new Date("2025-02-28"),
    endDate: new Date("2025-08-31"),
    totalPrice: 21600,
    monthlyRent: 3600,
    createdAt: new Date("2024-12-25"),
    status: "upcoming",
    user: {
      firstName: "Morgan",
      lastName: "Smith",
      email: "morgan.s@example.com"
    },
    trip: {
      numAdults: 2,
      numPets: 0,
      numChildren: 1
    },
    match: {
      id: "sample-match-2",
      tenantSignedAt: new Date("2024-12-23"),
      landlordSignedAt: new Date("2024-12-24"),
      paymentAuthorizedAt: new Date("2024-12-25"),
      BoldSignLease: {
        id: "sample-lease-2",
        landlordSigned: true,
        tenantSigned: true
      },
      Lease: null
    }
  }
];

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
  moveInCompletedAt?: Date | null;
};

interface ListingBookingsTabProps {
  bookings: BookingWithRelations[];
  listingId: string;
}

export default function ListingBookingsTab({ bookings, listingId }: ListingBookingsTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
  const [markingMoveInBookingId, setMarkingMoveInBookingId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata.role === 'admin';

  // Determine which data to use based on filters and user role
  const bookingsToUse = useMemo(() => {
    // If admin has selected "Mock Data" filter, always show sample data
    if (isAdmin && selectedFilters.includes('mock_data')) {
      return generateSampleBookings(listingId);
    }
    // Otherwise, use real data if available, otherwise generate sample data
    return bookings.length > 0 ? bookings : generateSampleBookings(listingId);
  }, [bookings, selectedFilters, isAdmin, listingId]);

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingBookingId(null);
  }, [pathname]);

  const handleViewBookingDetails = (booking: BookingWithRelations) => {
    setLoadingBookingId(booking.id);
    
    // If this is a match awaiting signature (not a real booking yet), go to host match page
    if (booking.status === "awaiting_signature" || booking.id.startsWith("match-")) {
      router.push(`/app/host/match/${booking.matchId}`);
    } else {
      // Navigate to regular booking details page
      router.push(`/app/host/bookings/${booking.id}`);
    }
  };

  const handleMarkMoveInComplete = async (bookingId: string) => {
    try {
      setMarkingMoveInBookingId(bookingId);
      const result = await markMoveInComplete(bookingId);
      
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking move-in complete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark move-in complete');
    } finally {
      setMarkingMoveInBookingId(null);
    }
  };

  // Base filter options for booking status
  const baseFilterOptions = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "active", label: "Active" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "cancelled", label: "Cancelled" },
  ];
  
  // Get filter options based on user role
  const filterOptions = isAdmin ? [...baseFilterOptions, { id: "mock_data", label: "Mock Data" }] : baseFilterOptions;

  // Get booking status info
  const getBookingStatusInfo = (booking: BookingWithRelations) => {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    // Handle special awaiting_signature status (from matches without bookings)
    if (booking.status === "awaiting_signature") {
      return { 
        status: "Awaiting Signature", 
        className: "text-[#d97706]",
        icon: <Clock className="h-4 w-4" />
      };
    }

    // Check if awaiting signature (match has BoldSignLease but not fully signed or no payment authorized)
    if (booking.match?.BoldSignLease && 
        ((!booking.match.BoldSignLease.tenantSigned || !booking.match.BoldSignLease.landlordSigned) || 
         !booking.match.paymentAuthorizedAt)) {
      return { 
        status: "Awaiting Signature", 
        className: "text-[#d97706]",
        icon: <Clock className="h-4 w-4" />
      };
    }

    if (booking.status === "cancelled") {
      return { 
        status: "Cancelled", 
        className: "text-[#c68087]",
        icon: <XCircle className="h-4 w-4" />
      };
    } else if (now < startDate) {
      return { 
        status: "Upcoming", 
        className: "text-[#5c9ac5]",
        icon: <Calendar className="h-4 w-4" />
      };
    } else if (now >= startDate && now <= endDate) {
      return { 
        status: "Ongoing", 
        className: "text-[#24742f]",
        icon: <Clock className="h-4 w-4" />
      };
    } else {
      return { 
        status: "Completed", 
        className: "text-gray-600",
        icon: <Check className="h-4 w-4" />
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

  // Format guest information
  const formatGuestInfo = (trip?: { numAdults: number; numPets: number; numChildren: number }) => {
    if (!trip) return "1 Adult";
    const parts = [];
    if (trip.numAdults > 0) parts.push(`${trip.numAdults} Adult${trip.numAdults !== 1 ? 's' : ''}`);
    if (trip.numChildren > 0) parts.push(`${trip.numChildren} Child${trip.numChildren !== 1 ? 'ren' : ''}`);
    if (trip.numPets > 0) parts.push(`${trip.numPets} Pet${trip.numPets !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : "1 Adult";
  };

  // Format renter name with fallback
  const formatGuestName = (user?: { firstName?: string; lastName?: string; email?: string }) => {
    if (!user) return "Guest";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.email) return user.email;
    return "Guest";
  };

  // Format date range with fallback
  const formatDateRangeWithFallback = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return "Dates not available";
    return formatDateRange(startDate, endDate);
  };

  // Format date range
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Filter bookings based on selected filters and search term
  const filteredBookings = useMemo(() => {
    let filtered = bookingsToUse;
    
    // Apply status filters (exclude mock_data and all filters from status filtering)
    const statusFilters = selectedFilters.filter(filter => filter !== 'mock_data' && filter !== 'all');
    if (statusFilters.length > 0) {
      filtered = filtered.filter(booking => {
        const statusInfo = getBookingStatusInfo(booking);
        
        // Map filter values to status labels
        return statusFilters.some(filter => {
          if (filter === "pending") {
            return statusInfo.status === "Awaiting Signature";
          }
          if (filter === "active") {
            return statusInfo.status === "Ongoing";
          }
          if (filter === "past") {
            return statusInfo.status === "Completed";
          }
          // Direct matches for upcoming and cancelled
          return statusInfo.status.toLowerCase() === filter;
        });
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        // Search in renter name
        const guestName = booking.user ? `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase() : '';
        if (guestName.includes(searchLower)) return true;
        
        // Search in guest email
        if (booking.user?.email?.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [bookingsToUse, selectedFilters, searchTerm]);

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
        placeholder="Search by renter name or email"
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
      title="Bookings"
      subtitle={`Bookings for ${listingId}`}
      searchPlaceholder="Search by renter name or email"
      filterLabel="Filter by status"
      filterOptions={filterOptions.map(opt => ({ value: opt.id, label: opt.label }))}
      onSearchChange={setSearchTerm}
      onFilterChange={(value) => {
        if (filterOptions.find(opt => opt.id === value)) {
          toggleFilter(value);
        }
      }}
      noMargin={true}
      emptyStateMessage={bookings.length === 0 ? "No bookings found for this listing." : "No bookings match the selected filters."}
    >
      {filteredBookings.map((booking) => {
        const statusInfo = getBookingStatusInfo(booking);
        const fullAddress = `${booking.listing?.streetAddress1 || 'Street'} ${booking.listing?.city || ' City'}, ${booking.listing?.state || 'ST'} ${booking.listing?.postalCode || '91910'}`;
        const displayAddress = isMobile 
          ? (booking.listing?.streetAddress1 || `Property in ${booking.listing?.state || 'Unknown Location'}`)
          : fullAddress;
        
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
                    <div className="flex items-center gap-2">
                      <div
                        className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${statusInfo.className}`}
                      >
                        {statusInfo.status === "Awaiting Signature" ? getSignatureStatusText(booking) : statusInfo.status}
                      </div>
                      {booking.moveInCompletedAt && (
                        <div className="flex items-center gap-1 text-[#24742f] text-sm">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Move-in Complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-1">
                  <div className="[font-family:'Poppins',Helvetica] font-normal text-[#271c1a] text-[15px] leading-5 break-words">
                    Guest: {formatGuestName(booking.user)} • {formatGuestInfo(booking.trip)} • {formatDateRangeWithFallback(booking.startDate, booking.endDate)}
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

                {statusInfo.status === "Upcoming" && (
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
                      <Link href={`/app/host/${listingId}`} className="cursor-pointer flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Manage Listing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/app/host/bookings/${booking.id}/payment-schedule`} className="cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        View Payment Schedule
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && statusInfo.status === "Upcoming" && !booking.moveInCompletedAt && (
                      <DropdownMenuItem 
                        onClick={() => handleMarkMoveInComplete(booking.id)}
                        disabled={markingMoveInBookingId === booking.id}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Move-in Complete
                        {markingMoveInBookingId === booking.id && (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        )}
                      </DropdownMenuItem>
                    )}
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
