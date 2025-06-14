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
import TabLayout from "../../components/cards-with-filter-layout";
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
  const isMobile = useIsMobile();

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingBookingId(null);
  }, [pathname]);

  const handleViewBookingDetails = (bookingId: string) => {
    setLoadingBookingId(bookingId);
    // Navigate to booking details page (adjust route as needed)
    router.push(`/platform/host/bookings/${bookingId}`);
  };

  // Filter options for booking status
  const filterOptions = [
    { id: "confirmed", label: "Confirmed" },
    { id: "upcoming", label: "Upcoming" },
    { id: "ongoing", label: "Ongoing" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  // Get booking status info
  const getBookingStatusInfo = (booking: BookingWithRelations) => {
    const now = new Date();
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

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

  // Format guest information
  const formatGuestInfo = (trip?: { numAdults: number; numPets: number; numChildren: number }) => {
    if (!trip) return "1 Adult";
    const parts = [];
    if (trip.numAdults > 0) parts.push(`${trip.numAdults} Adult${trip.numAdults !== 1 ? 's' : ''}`);
    if (trip.numChildren > 0) parts.push(`${trip.numChildren} Child${trip.numChildren !== 1 ? 'ren' : ''}`);
    if (trip.numPets > 0) parts.push(`${trip.numPets} Pet${trip.numPets !== 1 ? 's' : ''}`);
    return parts.join(', ') || "1 Adult";
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
    let filtered = bookings;
    
    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(booking => {
        const statusInfo = getBookingStatusInfo(booking);
        return selectedFilters.includes(statusInfo.status.toLowerCase());
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        // Search in guest name
        const guestName = booking.user ? `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase() : '';
        if (guestName.includes(searchLower)) return true;
        
        // Search in guest email
        if (booking.user?.email?.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [bookings, selectedFilters, searchTerm]);

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
        placeholder="Search by guest name or email"
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
      sidebarContent={sidebarContent}
      searchBar={searchBarComponent}
      noMargin={true}
      emptyStateMessage={bookings.length === 0 ? "No bookings found for this listing." : "No bookings match the selected filters."}
    >
      {filteredBookings.map((booking) => {
        const statusInfo = getBookingStatusInfo(booking);
        const fullAddress = `${booking.listing?.streetAddress1 || ''} ${booking.listing?.city || ''}, ${booking.listing?.state || ''} ${booking.listing?.postalCode || ''}`;
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
                    <div
                      className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] leading-5 ${statusInfo.className}`}
                    >
                      {statusInfo.status}
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
                  onClick={() => handleViewBookingDetails(booking.id)}
                  disabled={loadingBookingId === booking.id}
                  className="rounded-lg border border-solid border-[#6e504933] h-10 px-4 py-2 [font-family:'Poppins',Helvetica] font-medium text-[#050000] text-[15px] flex items-center gap-2"
                >
                  View Booking Details
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
                      <Link href={`/platform/host/${listingId}`} className="cursor-pointer flex items-center gap-2">
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