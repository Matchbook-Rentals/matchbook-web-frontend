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
import { useUser } from "@clerk/nextjs";
import { HostBookingCard } from "./components/host-booking-card";

// RentPayment type
type RentPayment = {
  id: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
};

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
  rentPayments?: RentPayment[];
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
    status: "pending",
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
  },
  {
    id: "match-005",
    userId: "user-005",
    listingId: "listing-004",
    tripId: "trip-005",
    matchId: "match-005",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-06-01"),
    totalPrice: null,
    monthlyRent: 3800,
    createdAt: new Date("2024-12-18"),
    status: "awaiting_signature",
    listing: {
      title: "Garden View Apartment",
      streetAddress1: "321 Pine Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94108"
    },
    user: {
      firstName: "Lisa",
      lastName: "Chen",
      email: "lisa.chen@example.com"
    },
    trip: {
      numAdults: 1,
      numPets: 1,
      numChildren: 0
    },
    match: {
      id: "match-005",
      tenantSignedAt: null,
      landlordSignedAt: null,
      paymentAuthorizedAt: null,
      BoldSignLease: {
        id: "lease-005",
        landlordSigned: false,
        tenantSigned: false,
      },
      Lease: null,
    }
  }
];

interface HostDashboardBookingsTabProps {
  bookings?: any[]; // Using any for now since we need to define the proper type
  matches?: any[];  // nearly complete matches from getAllHostBookings readyMatches
}

export default function HostDashboardBookingsTab({ bookings: propBookings, matches }: HostDashboardBookingsTabProps) {
  
  const router = useRouter();
  const pathname = usePathname();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const itemsPerPage = 10;
  const isMobile = useIsMobile();

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingBookingId(null);
  }, [pathname]);

  const handleViewBookingDetails = (booking: BookingWithRelations) => {
    // Debug log for payment calculations
    console.log('🔍 Booking Details Click - Payment Calculation:', {
      bookingId: booking.id,
      monthlyRent: booking.monthlyRent,
      rentPayments: booking.rentPayments,
      rentPaymentAmounts: booking.rentPayments?.map(p => p.amount),
      largestPayment: getLargestPayment(booking.rentPayments),
      displayAmount: getLargestPayment(booking.rentPayments) > 0 ? getLargestPayment(booking.rentPayments) : booking.monthlyRent,
      formattedPrice: getLargestPayment(booking.rentPayments) > 0 
        ? `$${getLargestPayment(booking.rentPayments).toLocaleString()} / Month`
        : booking.monthlyRent 
          ? `$${booking.monthlyRent.toLocaleString()} / Month`
          : "$0 / Month"
    });
    
    setLoadingBookingId(booking.id);
    
    // If this is a match awaiting signature (not a real booking yet), go to host match page
    if (booking.status === "awaiting_signature" || booking.id.startsWith("match-")) {
      router.push(`/app/host/match/${booking.matchId}`);
    } else {
      // Navigate to listing-specific booking details page
      router.push(`/app/host/${booking.listingId}/bookings/${booking.id}`);
    }
  };

  // Base filter options
  const baseFilterOptions = ["All", "Upcoming", "Active", "Awaiting Signature", "Past", "Cancelled"];
  
  // Get filter options based on user role
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const filterOptions = baseFilterOptions;

  // Toggle filter selection - exclusive mode (only one filter at a time)
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? [] // If clicking the current filter, deselect all
        : [filter] // Otherwise, select only this filter
    );
  };

  // Get status info for display
  const getStatusInfo = (booking: BookingWithRelations) => {
    // Handle special awaiting_signature status (from matches without bookings)
    if (booking.status === "awaiting_signature") {
      return {
        label: "Awaiting Your Signature",
        icon: <Clock className="h-4 w-4" />,
        className: "text-[#d97706]"
      };
    }

    // Check if awaiting signature (match has BoldSignLease but not fully signed or no payment authorized)
    if (booking.match?.BoldSignLease &&
        ((!booking.match.BoldSignLease.tenantSigned || !booking.match.BoldSignLease.landlordSigned) ||
         !booking.match.paymentAuthorizedAt)) {
      return {
        label: "Awaiting Your Signature",
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
      case "pending":
        // DB pending status should show as "Upcoming"
        return {
          label: "Upcoming",
          icon: <Calendar className="h-4 w-4" />,
          className: "text-blue-600"
        };
      case "pending_payment":
        return {
          label: "Processing",
          icon: <Clock className="h-4 w-4" />,
          className: "text-[#d97706]"
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
          label: "Upcoming",
          icon: <Calendar className="h-4 w-4" />,
          className: "text-blue-600"
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
    if (!trip) return "1 Adult";
    
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
    
    return parts.length > 0 ? parts.join(", ") : "1 Adult";
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

  // Helper function to get the largest payment from rentPayments
  const getLargestPayment = (rentPayments?: RentPayment[]): number => {
    if (!rentPayments || rentPayments.length === 0) return 0;
    return Math.max(...rentPayments.map(payment => payment.amount));
  };
  
  // Helper function to format amount as currency (amount is in cents)
  const formatCurrency = (amountInCents: number): string => {
    const amountInDollars = amountInCents / 100;
    return amountInDollars.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Helper function to transform booking data for the HostBookingCard component
  const transformBookingForCard = (booking: BookingWithRelations, isMobile: boolean) => {
    const listing = booking.listing;
    const addressDisplay = isMobile 
      ? (listing?.streetAddress1 || `Property in ${listing?.state || 'Unknown Location'}`)
      : `${listing?.streetAddress1 || ''} ${listing?.city || ''}, ${listing?.state || ''} ${listing?.postalCode || ''}`;

    // Create occupant objects from trip data
    const occupants = [
      { type: "Adult", count: booking.trip?.numAdults || 0, icon: "/host-dashboard/svg/adult.svg" },
      { type: "Kid", count: booking.trip?.numChildren || 0, icon: "/host-dashboard/svg/kid.svg" },
      { type: "pet", count: booking.trip?.numPets || 0, icon: "/host-dashboard/svg/pet.svg" },
    ];

    const statusInfo = getStatusInfo(booking);
    
    // Get the largest payment amount, fallback to monthlyRent if no payments
    const largestPaymentAmount = getLargestPayment(booking.rentPayments);
    const displayAmount = largestPaymentAmount > 0 ? largestPaymentAmount : booking.monthlyRent;
    
    // Log payment calculation for debugging
    console.log('💰 Payment Calculation for booking:', {
      bookingId: booking.id,
      monthlyRent: booking.monthlyRent,
      monthlyRentInDollars: booking.monthlyRent ? booking.monthlyRent / 100 : 0,
      rentPayments: booking.rentPayments,
      rentPaymentAmounts: booking.rentPayments?.map(p => p.amount),
      rentPaymentAmountsInDollars: booking.rentPayments?.map(p => p.amount / 100),
      largestPayment: largestPaymentAmount,
      largestPaymentInDollars: largestPaymentAmount / 100,
      displayAmount: displayAmount,
      displayAmountInDollars: displayAmount ? displayAmount / 100 : 0,
      formattedPrice: displayAmount ? `$${formatCurrency(displayAmount)} / Month` : "$0 / Month"
    });
    
    const price = displayAmount 
      ? `$${formatCurrency(displayAmount)} / Month`
      : "$0 / Month";

    return {
      name: formatGuestName(booking.user),
      status: statusInfo.label === "Awaiting Signature" ? getSignatureStatusText(booking) : statusInfo.label,
      dates: formatDateRangeWithFallback(booking.startDate, booking.endDate),
      address: addressDisplay,
      description: `for ${listing?.title || 'this property'}`,
      price,
      occupants,
      profileImage: booking.user?.imageUrl,
    };
  };

  // Format date range with fallback
  const formatDateRangeWithFallback = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return "Dates not available";
    return formatDateRange(startDate, endDate);
  };

  // Combine actual bookings with matches that are ready to be converted to bookings
  const allBookingsData = useMemo(() => {
    // If admin has enabled mock data toggle, always show sample data
    if (isAdmin && useMockData) {
      console.log('HostDashboardBookingsTab: Admin enabled mock data, using sample data');
      return sampleBookings;
    }
    
    // Otherwise, use real data (even if empty)
    if (!propBookings) {
      console.log('HostDashboardBookingsTab: Missing bookings data, returning empty array');
      return [];
    }

    const existingBookings = propBookings || [];
    const readyMatches = matches || [];
    
    console.log('HostDashboardBookingsTab: Processing', existingBookings.length, 'bookings and', readyMatches.length, 'ready matches');
    
    // Convert ready matches to booking-like structures
    const matchesAsBookings = readyMatches.map(match => ({
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
      status: "awaiting_signature", // Special status for ready matches
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
    
    const combined = [...existingBookings, ...matchesAsBookings];
    console.log('HostDashboardBookingsTab: Combined bookings:', existingBookings.length, 'ready matches:', matchesAsBookings.length, 'total:', combined.length);
    
    return combined;
  }, [propBookings, matches, useMockData, isAdmin]);

  const bookingsToUse = allBookingsData;

  // Filter bookings based on selected filters and search term
  const filteredBookings = useMemo(() => {
    let filtered = bookingsToUse;
    
    // Debug: Count statuses before filtering
    const statusCounts = {
      "Upcoming": 0,
      "Awaiting Your Signature": 0,
      "Active": 0,
      "Past": 0,
      "Cancelled": 0
    };
    
    bookingsToUse.forEach(booking => {
      const statusInfo = getStatusInfo(booking);
      if (statusCounts.hasOwnProperty(statusInfo.label)) {
        statusCounts[statusInfo.label]++;
      } else {
        statusCounts[statusInfo.label] = (statusCounts[statusInfo.label] || 0) + 1;
      }
    });
    
    console.log("🔍 FILTER DEBUG - Before filtering:");
    console.log("- Total bookings:", bookingsToUse.length);
    console.log("- Selected filters:", selectedFilters);
    console.log("- Status counts:", statusCounts);
    
    // Apply status filters - EXCLUSIVE filtering (only one filter should survive)
    const statusFilters = selectedFilters;
    if (statusFilters.length === 1 && !statusFilters.includes("All")) {
      const selectedFilter = statusFilters[0];
      filtered = filtered.filter(booking => {
        const statusInfo = getStatusInfo(booking);
        
        if (selectedFilter === "Upcoming") {
          // Upcoming should only show "Upcoming" status
          return statusInfo.label === "Upcoming";
        }
        if (selectedFilter === "Active") {
          // Active should only show "Active" status
          return statusInfo.label === "Active";
        }
        if (selectedFilter === "Awaiting Signature") {
          // Awaiting Signature should only show readyMatches
          return statusInfo.label === "Awaiting Your Signature";
        }
        if (selectedFilter === "Past") {
          // Past should only show "Past" status
          return statusInfo.label === "Past";
        }
        if (selectedFilter === "Cancelled") {
          // Cancelled should only show "Cancelled" status
          return statusInfo.label === "Cancelled";
        }
        // Fallback for exact match
        return statusInfo.label === selectedFilter;
      });
    }
    
    // Debug: Count statuses after filtering
    const filteredStatusCounts = {
      "Upcoming": 0,
      "Awaiting Your Signature": 0,
      "Active": 0,
      "Past": 0,
      "Cancelled": 0
    };
    
    filtered.forEach(booking => {
      const statusInfo = getStatusInfo(booking);
      if (filteredStatusCounts.hasOwnProperty(statusInfo.label)) {
        filteredStatusCounts[statusInfo.label]++;
      } else {
        filteredStatusCounts[statusInfo.label] = (filteredStatusCounts[statusInfo.label] || 0) + 1;
      }
    });
    
    console.log("🔍 FILTER DEBUG - After filtering:");
    console.log("- Total bookings:", filtered.length);
    console.log("- Status counts:", filteredStatusCounts);
    
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
        
        // Search in renter name
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
        placeholder="Search by title, address, or renter name"
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
      title="Bookings"
      subtitle="Bookings for all your listings"
      searchPlaceholder="Search by title, address, or renter name"
      filterLabel="Filter by status"
      filterOptions={filterOptions.map(label => ({ value: label.toLowerCase().replace(' ', '_'), label }))}
      onSearchChange={setSearchTerm}
      onFilterChange={(value) => {
        const label = filterOptions.find(opt => opt.toLowerCase().replace(' ', '_') === value);
        if (label) {
          toggleFilter(label);
        }
      }}
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
      showMockDataToggle={true}
      useMockData={useMockData}
      onMockDataToggle={setUseMockData}
      noMargin={true}
    >
      {paginatedBookings.map((booking) => {
        const cardData = transformBookingForCard(booking, isMobile);
        
        return (
          <div key={booking.id} className="mb-8 w-full">
            <HostBookingCard
              {...cardData}
              onBookingDetails={() => handleViewBookingDetails(booking)}
              onMessageGuest={() => {
                // Handle message guest action - you may need to implement this
                console.log('Message guest:', formatGuestName(booking.user));
              }}
              onManageListing={() => router.push(`/app/host/${booking.listingId}/summary`)}
              className="border border-solid border-[#6e504933]"
              // Pass booking data for date modification
              bookingId={booking.id}
              bookingStartDate={booking.startDate}
              bookingEndDate={booking.endDate}
              listingId={booking.listingId}
              guestUserId={booking.userId}
              bookingModifications={booking.bookingModifications}
              rentPayments={booking.rentPayments}
            />
          </div>
        );
      })}
    </TabLayout>
  );
}
