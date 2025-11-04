'use client';
import { Booking } from '@prisma/client';
import React, { useState } from 'react';
import { MapPinIcon, MoreVertical, Trash, X, Calendar, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import BookingDateModificationModal from '@/components/BookingDateModificationModal';
import BrandModal from '@/components/BrandModal';
import BookingModificationsView from '@/components/BookingModificationsView';
import { getOrCreateListingConversation } from '@/app/actions/housing-requests';

// Extended booking type with included relations
type BookingWithRelations = Booking & {
  listing?: {
    title: string;
    imageSrc?: string;
    userId?: string;
    locationString?: string;
  };
  trip?: {
    numAdults: number;
    numPets: number;
    numChildren: number;
  };
  rentPayments?: {
    id: string;
    amount: number;
    dueDate: Date;
    paidAt?: Date | null;
    paymentModifications?: {
      id: string;
      status: string;
    }[];
  }[];
  bookingModifications?: {
    id: string;
    originalStartDate: Date;
    originalEndDate: Date;
    newStartDate: Date;
    newEndDate: Date;
    reason?: string;
    status: string;
    requestedAt: Date;
    viewedAt?: Date | null;
    approvedAt?: Date | null;
    rejectedAt?: Date | null;
    rejectionReason?: string | null;
    requestor: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
    };
    recipient: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
    };
  }[];
};

interface BookingCardProps {
  booking: BookingWithRelations;
  onDelete: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDelete }) => {
  const router = useRouter();
  const { user } = useUser();
  const [isDateModificationModalOpen, setIsDateModificationModalOpen] = useState(false);
  const [isModificationsModalOpen, setIsModificationsModalOpen] = useState(false);
  
  // Determine recipient ID (host in this case, since renter is requesting)
  const recipientId = booking.listing?.userId || ''; // This should come from the booking relations

  // Check if there are booking modifications or payment modifications
  const hasBookingModifications = booking.bookingModifications && booking.bookingModifications.length > 0;
  const hasPaymentModifications = booking.rentPayments && booking.rentPayments.some(payment => 
    payment.paymentModifications && payment.paymentModifications.length > 0
  );
  const hasModifications = hasBookingModifications || hasPaymentModifications;

  // Format date range for display
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  const dateRangeText = booking.startDate && booking.endDate ?
    `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` :
    'No dates selected';

  // Get status badge style
  const getStatusBadgeStyle = () => {
    switch (booking.status) {
      // Green (success): confirmed, completed, active
      case 'confirmed':
      case 'completed':
      case 'active':
      case 'approved':
        return 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]';

      // Red (failure): payment_failed, cancelled, issue_reported, move_in_issue
      case 'payment_failed':
      case 'cancelled':
      case 'declined':
      case 'issue_reported':
      case 'move_in_issue':
        return 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]';

      // Gray (pending): reserved, pending_payment, pending, payment_processing
      case 'reserved':
      case 'pending':
      case 'pending_payment':
      case 'payment_processing':
        return 'bg-gray-100 text-gray-600 border-gray-400';

      // Yellow/Orange for upcoming (keeping for any edge cases)
      case 'upcoming':
        return 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]';

      default:
        return 'bg-gray-100 text-gray-600 border-gray-400';
    }
  };

  // Format booking status for display
  const formatBookingStatus = (status: string): string => {
    switch (status) {
      case 'payment_processing': return 'Payment Processing';
      case 'pending_payment': return 'Pending Payment';
      case 'payment_failed': return 'Payment Failed';
      case 'reserved': return 'Reserved';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'issue_reported': return 'Issue Reported';
      case 'move_in_issue': return 'Move-In Issue';
      default:
        // Convert snake_case to Title Case
        return status
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  // Get status label
  const getStatusLabel = () => {
    return formatBookingStatus(booking.status);
  };

  // Format guest/occupant details
  const getOccupants = () => {
    if (!booking.trip) return [];
    const occupants = [];
    
    if (booking.trip.numAdults > 0) {
      occupants.push({
        type: booking.trip.numAdults === 1 ? 'Adult' : 'Adults',
        count: booking.trip.numAdults,
        icon: '/icons/user.svg' // You'll need to add appropriate icons
      });
    }
    
    if (booking.trip.numChildren > 0) {
      occupants.push({
        type: booking.trip.numChildren === 1 ? 'Child' : 'Children',
        count: booking.trip.numChildren,
        icon: '/icons/child.svg'
      });
    }
    
    if (booking.trip.numPets > 0) {
      occupants.push({
        type: booking.trip.numPets === 1 ? 'Pet' : 'Pets',
        count: booking.trip.numPets,
        icon: '/icons/pet.svg'
      });
    }
    
    return occupants;
  };

  // Calculate price display - use largest rent payment if available
  const getLargestRentPayment = () => {
    if (!booking.rentPayments || booking.rentPayments.length === 0) return null;
    return booking.rentPayments[0]; // Already sorted by amount desc from the query
  };

  const calculatePriceDisplay = () => {
    const largestPayment = getLargestRentPayment();
    if (largestPayment) {
      return `$${(largestPayment.amount / 100).toFixed(2)}/mo`;
    }
    if (booking.totalPrice) {
      return `$${(booking.totalPrice / 100).toFixed(2)}`;
    }
    if (booking.monthlyRent) {
      return `$${(booking.monthlyRent / 100).toFixed(2)}/mo`;
    }
    return '$0.00';
  };

  const priceDisplay = calculatePriceDisplay();

  // Log pricing details when card is clicked
  const handleCardClick = () => {
    console.log('=== Booking Card Pricing Details ===');
    console.log('Booking ID:', booking.id);
    console.log('Total Price:', booking.totalPrice);
    console.log('Monthly Rent:', booking.monthlyRent);
    console.log('Rent Payments:', booking.rentPayments);
    if (booking.rentPayments && booking.rentPayments.length > 0) {
      console.log('Largest Payment Amount:', booking.rentPayments[0].amount);
      console.log('Largest Payment (formatted):', `$${(booking.rentPayments[0].amount / 100).toFixed(2)}`);
    }
    console.log('Final Display Price:', priceDisplay);
    console.log('===================================');
  };

  // Handle messaging the host
  const handleMessageHost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!booking.listing?.userId) return;

    try {
      const result = await getOrCreateListingConversation(
        booking.listingId,
        booking.listing.userId
      );

      if (result.success && result.conversationId) {
        router.push(`/app/rent/messages?convo=${result.conversationId}`);
      } else {
        console.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      console.error('Error messaging host:', error);
    }
  };

  // Get listing details
  const listingTitle = booking.listing?.title || 'Unnamed Property';
  const listingAddress = booking.listing?.locationString || 'Address not available';
  const listingImage = booking.listing?.imageSrc || '/placeholderImages/image_1.jpg';

  const occupants = getOccupants();
  
  return (
    <Card className="w-full p-4 sm:p-6 rounded-xl cursor-pointer" onClick={handleCardClick}>
      <CardContent className="p-0">
        {/* Mobile Layout - Column with rows */}
        <div className="flex flex-col gap-4 sm:hidden">
          {/* Row 1: Image | Menu Button */}
          <div className="flex flex-row items-start justify-between gap-4">
            <div 
              className="relative w-[105px] h-[70px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
              style={{ backgroundImage: `url(${listingImage})` }}
            />
<Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="p-2 rounded-lg border-[#3c8787] text-[#3c8787]"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDateModificationModalOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Modify Dates
                </Button>
                {process.env.NODE_ENV === 'development' ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(booking.id)}
                  >
                    <Trash className="w-4 h-4" />
                    Delete Booking (Dev)
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <X className="w-4 h-4" />
                    Cancel Booking
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 2: Title | Badge */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="font-medium text-[#484a54] text-base flex-1 min-w-0 truncate">
              {listingTitle}
            </div>
            {booking.status === 'payment_processing' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadgeStyle()}`}>
                      {getStatusLabel()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your payment is on its way, this can take up to 5 days.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadgeStyle()}`}>
                {getStatusLabel()}
              </Badge>
            )}
          </div>

          {/* Row 3: Address | Dates */}
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <MapPinIcon className="w-4 h-4 text-[#777b8b] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#777b8b] truncate">
                {listingAddress}
              </div>
            </div>
            <div className="text-xs text-[#777b8b] flex-shrink-0">
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Row 4: Guest Types | Price */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {occupants.map((occupant, index) => (
                <div
                  key={index}
                  className="text-xs text-[#344054]"
                >
                  {occupant.count} {occupant.type}
                </div>
              ))}
            </div>
            <div className="font-semibold text-[#484a54] text-lg flex-shrink-0">
              {priceDisplay}
            </div>
          </div>

          {/* Row 5: Action Buttons */}
          <div className="flex flex-col gap-2 w-full">
            <BrandButton
              variant="outline"
              onClick={() => router.push(`/app/rent/bookings/${booking.id}`)}
              className="w-full"
            >
              View Details
            </BrandButton>
            {hasModifications && (
              <BrandModal
                isOpen={isModificationsModalOpen}
                onOpenChange={setIsModificationsModalOpen}
                className="!max-w-[1050px] w-full max-h-[85vh] overflow-y-auto !p-3 sm:!p-6"
                heightStyle="!top-[10vh] md:!top-[25vh]"
                triggerButton={
                  <BrandButton
                    variant="outline"
                    className="w-full"
                  >
                    View Changes
                  </BrandButton>
                }
              >
                <div className="min-w-full sm:min-w-[600px] md:min-w-[700px] lg:min-w-[800px] w-full">
                  <BookingModificationsView
                    bookingId={booking.id}
                    bookingTitle={booking.listing?.title || 'Booking'}
                    isMobile={true}
                  />
                </div>
              </BrandModal>
            )}
            <BrandButton
              variant="default"
              onClick={handleMessageHost}
              className="w-full"
            >
              Message Host
            </BrandButton>
          </div>
        </div>

        {/* Desktop/Tablet Layout - Keep existing */}
        <div className="hidden sm:flex flex-col md:flex-row items-start gap-4 md:gap-6 w-full">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 flex-1 w-full min-w-0">
            {/* Listing Image */}
            <div 
              className="relative w-[157px] h-[105px] lg:w-[209px] lg:h-[140px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
              style={{ backgroundImage: `url(${listingImage})` }}
            />

            {/* Booking Details */}
            <div className="flex flex-col items-start gap-2.5 flex-1 min-w-0">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start items-start gap-2 w-full">
                  <div className="font-medium text-[#484a54] text-lg">
                    {listingTitle}
                  </div>

                  {booking.status === 'payment_processing' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={`px-2.5 py-1 font-medium rounded-full flex-shrink-0 ${getStatusBadgeStyle()}`}>
                            {getStatusLabel()}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your payment is on its way, this can take up to 5 days.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Badge className={`px-2.5 py-1 font-medium rounded-full flex-shrink-0 ${getStatusBadgeStyle()}`}>
                      {getStatusLabel()}
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-[#777b8b]">
                  {dateRangeText}
                </div>
              </div>

              <div className="flex items-start gap-2 w-full">
                <MapPinIcon className="w-5 h-5 text-[#777b8b] flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-[#777b8b] min-w-0">
                  <span className="block break-words">
                    {listingAddress}
                  </span>
                </div>
              </div>

              {occupants.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full">
                  {occupants.map((occupant, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full"
                    >
                      <div className="font-medium text-[#344054] text-sm leading-5 whitespace-nowrap">
                        {occupant.count} {occupant.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Price and Actions */}
          <div className="flex flex-col md:items-end items-start justify-start gap-4 w-full md:w-auto md:min-w-[280px] flex-shrink-0">
            <div className="flex w-full md:justify-end justify-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="p-2.5 rounded-lg border-[#3c8787] text-[#3c8787]"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDateModificationModalOpen(true);
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    Modify Dates
                  </Button>
                  {process.env.NODE_ENV === 'development' ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(booking.id)}
                    >
                      <Trash className="w-4 h-4" />
                      Delete Booking
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col md:items-end items-start justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl md:text-right text-left">
                {priceDisplay}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 w-full">
                <BrandButton
                  variant="outline"
                  onClick={() => router.push(`/app/rent/bookings/${booking.id}`)}
                  className="w-full md:w-auto whitespace-nowrap"
                >
                  View Details
                </BrandButton>

                {hasModifications && (
                  <BrandModal
                    isOpen={isModificationsModalOpen}
                    onOpenChange={setIsModificationsModalOpen}
                    className="!max-w-[1050px] w-full max-h-[85vh] overflow-y-auto !p-3 sm:!p-6"
                    heightStyle="!top-[10vh] md:!top-[25vh]"
                    triggerButton={
                      <BrandButton
                        variant="outline"
                        className="w-full md:w-auto whitespace-nowrap"
                      >
                        View Changes
                      </BrandButton>
                    }
                  >
                    <div className="min-w-full sm:min-w-[600px] md:min-w-[700px] lg:min-w-[800px] w-full">
                      <BookingModificationsView
                        bookingId={booking.id}
                        bookingTitle={booking.listing?.title || 'Booking'}
                        isMobile={false}
                      />
                    </div>
                  </BrandModal>
                )}

                <BrandButton
                  variant="default"
                  onClick={handleMessageHost}
                  className="w-full md:w-auto whitespace-nowrap"
                >
                  Message Host
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Date Modification Modal */}
      <BookingDateModificationModal
        isOpen={isDateModificationModalOpen}
        onOpenChange={setIsDateModificationModalOpen}
        booking={{
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          listing: booking.listing
        }}
        recipientId={recipientId}
      />

    </Card>
  )
}

export default BookingCard;
