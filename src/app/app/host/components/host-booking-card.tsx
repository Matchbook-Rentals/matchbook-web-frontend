"use client";

import { MapPinIcon, MoreVertical, MoreVerticalIcon, Home, Loader2, Calendar, Clock } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { findConversationBetweenUsers, createListingConversation } from "@/app/actions/conversations";
import BookingDateModificationModal from '@/components/BookingDateModificationModal';
import BrandModal from '@/components/BrandModal';
import BookingModificationsView from '@/components/BookingModificationsView';

interface Occupant {
  type: string;
  count: number;
  icon: string;
}

interface HostBookingCardProps {
  name: string;
  status: string;
  dates: string;
  address: string;
  description: string;
  price: string;
  occupants: Occupant[];
  profileImage?: string;
  onBookingDetails?: () => void;
  onMessageGuest?: () => void;
  onManageListing?: () => void;
  className?: string;
  isLoading?: boolean;
  // New props for messaging functionality
  listingId?: string;
  guestUserId?: string;
  // Props for date modification
  bookingId?: string;
  bookingStartDate?: Date;
  bookingEndDate?: Date;
  // Props for booking modifications
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
  // Props for rent payments with payment modifications
  rentPayments?: {
    id: string;
    amount: number;
    dueDate: Date;
    isPaid: boolean;
    paymentModifications: {
      id: string;
      requestorId: string;
      recipientId: string;
      originalAmount: number;
      originalDueDate: Date;
      newAmount: number;
      newDueDate: Date;
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
  }[];
}

const HostBookingCardMobile: React.FC<HostBookingCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onBookingDetails,
  onMessageGuest,
  onManageListing,
  className = "",
  isLoading = false,
  listingId,
  guestUserId,
  bookingId,
  bookingStartDate,
  bookingEndDate,
  bookingModifications,
  rentPayments,
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [messagingLoading, setMessagingLoading] = React.useState(false);
  const [isDateModificationModalOpen, setIsDateModificationModalOpen] = React.useState(false);
  const [isModificationsModalOpen, setIsModificationsModalOpen] = React.useState(false);

  // Check if there are booking modifications or payment modifications
  const hasBookingModifications = bookingModifications && bookingModifications.length > 0;
  const hasPaymentModifications = rentPayments && rentPayments.some(payment => 
    payment.paymentModifications && payment.paymentModifications.length > 0
  );
  const hasModifications = hasBookingModifications || hasPaymentModifications;

  const handleMessageRenter = async () => {
    if (!listingId || !guestUserId) {
      console.error('Missing listingId or guestUserId for messaging');
      return;
    }

    setMessagingLoading(true);
    try {
      // First check if conversation exists
      const existing = await findConversationBetweenUsers(listingId, guestUserId);
      
      if (existing.conversationId) {
        // Navigate to existing conversation
        router.push(`/app/rent/messages?convoId=${existing.conversationId}`);
      } else {
        // Create new conversation and navigate
        const result = await createListingConversation(listingId, guestUserId);
        if (result.success && result.conversationId) {
          router.push(`/app/rent/messages?convoId=${result.conversationId}`);
        } else {
          console.error('Failed to create conversation:', result.error);
        }
      }
    } catch (error) {
      console.error('Error handling message renter:', error);
    } finally {
      setMessagingLoading(false);
    }
  };
  return (
    <Card className={`w-full p-4 rounded-xl ${className} ${isLoading ? 'opacity-75' : ''}`}>
      <CardContent className="p-0">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#3c8787]" />
          </div>
        )}
        
        {/* Mobile Layout - Column with organized rows */}
        <div className="flex flex-col gap-4">
          {/* Row 1: Image | Menu Button */}
          <div className="flex flex-row items-start justify-between gap-4">
            {status.toLowerCase() === 'approved' ? (
              <div 
                className="relative w-[105px] h-[70px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
                style={{ backgroundImage: `url(${profileImage})` }}
              />
            ) : (
              <div 
                className="relative w-[105px] h-[70px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
                style={{ backgroundImage: `url(https://placehold.co/600x400/0B6E6E/FFF?text=${name.split(' ').map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')})` }}
              />
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="p-2 rounded-lg border-[#3c8787] text-[#3c8787]"
                  disabled={isLoading}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                {bookingId && bookingStartDate && bookingEndDate && guestUserId && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                    onClick={() => setIsDateModificationModalOpen(true)}
                  >
                    <Calendar className="w-4 h-4" />
                    Modify Dates
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                  onClick={onManageListing}
                >
                  <Home className="w-4 h-4" />
                  Manage Listing
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 2: Title | Badge */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="font-medium text-[#484a54] text-base flex-1 min-w-0 truncate">
              {name}
            </div>
            <Badge className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
              status.toLowerCase() === 'approved' 
                ? 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]'
                : status.toLowerCase() === 'pending'
                ? 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]'
                : status.toLowerCase() === 'declined'
                ? 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]'
                : 'bg-gray-100 text-gray-600 border-gray-400'
            }`}>
              {status}
            </Badge>
          </div>

          {/* Row 3: Address | Dates */}
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="flex items-start gap-1 flex-1 min-w-0">
              <MapPinIcon className="w-4 h-4 text-[#777b8b] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#777b8b] truncate">
                {address}
              </div>
            </div>
            <div className="text-xs text-[#777b8b] flex-shrink-0">
              {dates}
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
              {price}
            </div>
          </div>

          {/* Row 5: Action Buttons */}
          <div className="flex flex-col gap-2 w-full">
            <BrandButton
              variant="outline"
              onClick={onBookingDetails}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Booking Details'
              )}
            </BrandButton>
            {hasModifications && (
              <BrandModal
                isOpen={isModificationsModalOpen}
                onOpenChange={setIsModificationsModalOpen}
                className="!max-w-[1050px] w-full max-h-[85vh] overflow-y-auto"
                triggerButton={
                  <BrandButton
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                  >
                    View Changes
                  </BrandButton>
                }
              >
                <div className="min-w-full sm:min-w-[600px] md:min-w-[700px] lg:min-w-[800px] w-full">
                  <BookingModificationsView
                    bookingId={bookingId!}
                    bookingTitle={description}
                  />
                </div>
              </BrandModal>
            )}
            <BrandButton 
              variant="default"
              onClick={listingId && guestUserId ? handleMessageRenter : onMessageGuest}
              disabled={isLoading || messagingLoading}
              className="w-full"
            >
              {messagingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Message Renter'
              )}
            </BrandButton>
          </div>
        </div>
      </CardContent>

      {/* Date Modification Modal */}
      {bookingId && bookingStartDate && bookingEndDate && guestUserId && (
        <BookingDateModificationModal
          isOpen={isDateModificationModalOpen}
          onOpenChange={setIsDateModificationModalOpen}
          booking={{
            id: bookingId,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            listing: { title: address || 'Property' }
          }}
          recipientId={guestUserId}
        />
      )}

    </Card>
  );
};

export const HostBookingCard: React.FC<HostBookingCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onBookingDetails,
  onMessageGuest,
  onManageListing,
  className = "",
  isLoading = false,
  listingId,
  guestUserId,
  bookingId,
  bookingStartDate,
  bookingEndDate,
  bookingModifications,
  rentPayments,
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [messagingLoading, setMessagingLoading] = React.useState(false);
  const [isDateModificationModalOpen, setIsDateModificationModalOpen] = React.useState(false);
  const [isModificationsModalOpen, setIsModificationsModalOpen] = React.useState(false);

  // Check if there are booking modifications or payment modifications
  const hasBookingModifications = bookingModifications && bookingModifications.length > 0;
  const hasPaymentModifications = rentPayments && rentPayments.some(payment => 
    payment.paymentModifications && payment.paymentModifications.length > 0
  );
  const hasModifications = hasBookingModifications || hasPaymentModifications;

  const handleMessageRenter = async () => {
    if (!listingId || !guestUserId) {
      console.error('Missing listingId or guestUserId for messaging');
      return;
    }

    setMessagingLoading(true);
    try {
      // First check if conversation exists
      const existing = await findConversationBetweenUsers(listingId, guestUserId);
      
      if (existing.conversationId) {
        // Navigate to existing conversation
        router.push(`/app/rent/messages?convoId=${existing.conversationId}`);
      } else {
        // Create new conversation and navigate
        const result = await createListingConversation(listingId, guestUserId);
        if (result.success && result.conversationId) {
          router.push(`/app/rent/messages?convoId=${result.conversationId}`);
        } else {
          console.error('Failed to create conversation:', result.error);
        }
      }
    } catch (error) {
      console.error('Error handling message renter:', error);
    } finally {
      setMessagingLoading(false);
    }
  };
  // Check if screen is mobile (you can adjust this breakpoint as needed)
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 800); // sm breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Render mobile version on small screens
  if (isMobile) {
    return (
      <HostBookingCardMobile
        name={name}
        status={status}
        dates={dates}
        address={address}
        description={description}
        price={price}
        occupants={occupants}
        profileImage={profileImage}
        onBookingDetails={onBookingDetails}
        onMessageGuest={onMessageGuest}
        onManageListing={onManageListing}
        className={className}
        isLoading={isLoading}
        listingId={listingId}
        guestUserId={guestUserId}
        bookingId={bookingId}
        bookingStartDate={bookingStartDate}
        bookingEndDate={bookingEndDate}
      />
    );
  }

  // Helper function to get truncated address for medium screens
  const getTruncatedAddress = (fullAddress: string) => {
    // Split by common delimiters and take first 1-2 parts
    const parts = fullAddress.split(/[,\n]/);
    return parts.slice(0, 2).join(', ').trim();
  };

  return (
    <Card className={`w-full p-6 rounded-xl ${className} ${isLoading ? 'opacity-75' : ''}`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 w-full relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-[#3c8787]" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 flex-1 w-full min-w-0">
            {/* Profile Image */}
            {status.toLowerCase() === 'approved' ? (
              <div 
                className="relative w-16 h-16 sm:w-[81px] sm:h-[85px] lg:w-[81px] lg:h-[85px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
                style={{ backgroundImage: `url(${profileImage})` }}
              />
            ) : (
              <div 
                className="relative w-16 h-16 sm:w-[81px] sm:h-[85px] lg:w-[81px] lg:h-[85px] rounded-xl bg-cover bg-[50%_50%] flex-shrink-0" 
                style={{ backgroundImage: `url(https://placehold.co/600x400/0B6E6E/FFF?text=${name.split(' ').map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')})` }}
              />
            )}

            {/* Applicant Details */}
            <div className="flex flex-col items-start gap-2.5 flex-1 min-w-0">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start items-start gap-2 w-full">
                  <div className="font-text-label-large-medium text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] flex-shrink-0">
                    {name}
                  </div>

                  <Badge className={`px-2.5 py-1 font-medium rounded-full flex-shrink-0 ${
                    status.toLowerCase() === 'approved' 
                      ? 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]'
                      : status.toLowerCase() === 'pending'
                      ? 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]'
                      : status.toLowerCase() === 'declined'
                      ? 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]'
                      : 'bg-gray-100 text-gray-600 border-gray-400'
                  }`}>
                    {status}
                  </Badge>
                </div>

                <div className="font-text-label-small-regular text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)]">
                  {dates}
                </div>
              </div>

              <div className="flex items-start gap-2 w-full">
                <MapPinIcon className="w-5 h-5 text-[#777b8b] flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] min-w-0">
                  {/* Show full address on small and large+ screens, truncated on medium */}
                  <span className="block sm:hidden lg:block break-words">
                    {address}
                  </span>
                  <span className="hidden sm:block lg:hidden break-words">
                    {getTruncatedAddress(address)}
                  </span>
                </div>
              </div>

              <div className="w-full font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] break-words">
                {description}
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full">
                {occupants.map((occupant, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full"
                  >
                    <img
                      className="w-5 h-5"
                      alt={occupant.type}
                      src={occupant.icon}
                    />
                    <div className="font-medium text-[#344054] text-sm leading-5 whitespace-nowrap">
                      {occupant.count} {occupant.type}
                    </div>
                  </div>
                ))}
              </div>
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
                    disabled={isLoading}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="end">
                  {bookingId && bookingStartDate && bookingEndDate && guestUserId && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                      onClick={() => setIsDateModificationModalOpen(true)}
                    >
                      <Calendar className="w-4 h-4" />
                      Modify Dates
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-[#484a54] hover:text-[#484a54] hover:bg-gray-50"
                    onClick={onManageListing}
                  >
                    <Home className="w-4 h-4" />
                    Manage Listing
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col md:items-end items-start justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl md:text-right text-left">
                {price}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 w-full">
                {hasModifications && (
                  <BrandModal
                    isOpen={isModificationsModalOpen}
                    onOpenChange={setIsModificationsModalOpen}
                    className="!max-w-[1050px] w-full max-h-[85vh] overflow-y-auto"
                    triggerButton={
                      <BrandButton
                        variant="outline"
                        disabled={isLoading}
                        className="w-full md:w-auto whitespace-nowrap"
                      >
                        View Changes
                      </BrandButton>
                    }
                  >
                    <div className="min-w-full sm:min-w-[600px] md:min-w-[700px] lg:min-w-[800px] w-full">
                      <BookingModificationsView
                        bookingId={bookingId!}
                        bookingTitle={description}
                      />
                    </div>
                  </BrandModal>
                )}
                
                <BrandButton
                  variant="outline"
                  onClick={onBookingDetails}
                  disabled={isLoading}
                  className="w-full md:w-auto whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Booking Details'
                  )}
                </BrandButton>

                <BrandButton 
                  variant="default"
                  onClick={listingId && guestUserId ? handleMessageRenter : onMessageGuest}
                  disabled={isLoading || messagingLoading}
                  className="w-full md:w-auto whitespace-nowrap"
                >
                  {messagingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Message Renter'
                  )}
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Date Modification Modal */}
      {bookingId && bookingStartDate && bookingEndDate && guestUserId && (
        <BookingDateModificationModal
          isOpen={isDateModificationModalOpen}
          onOpenChange={setIsDateModificationModalOpen}
          booking={{
            id: bookingId,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            listing: { title: address || 'Property' }
          }}
          recipientId={guestUserId}
        />
      )}

    </Card>
  );
};
