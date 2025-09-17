"use client";

import { MapPinIcon, MoreVertical, Home, Loader2, MoreVerticalIcon, Calendar } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { findConversationBetweenUsers, createListingConversation } from "@/app/actions/conversations";
import BookingDateModificationModal from '@/components/BookingDateModificationModal';

interface Occupant {
  type: string;
  count: number;
  icon: string;
}

interface RentBookingDetailsCardProps {
  name: string;
  status: string;
  dates: string;
  address: string;
  description: string;
  price: string;
  occupants: Occupant[];
  profileImage?: string;
  onViewListing?: () => void;
  className?: string;
  isLoading?: boolean;
  roomCount?: number;
  bathroomCount?: number;
  petsAllowed?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  tertiaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onTertiaryAction?: () => void;
  listingId?: string;
  hostUserId?: string;
  // Props for date modification
  bookingId?: string;
  bookingStartDate?: Date;
  bookingEndDate?: Date;
}

const getStatusBadgeStyle = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'active':
    case 'approved':
      return 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e]';
    case 'upcoming':
    case 'pending':
      return 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22]';
    case 'completed':
      return 'bg-gray-100 text-gray-600 border-gray-400';
    case 'cancelled':
    case 'declined':
      return 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545]';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-400';
  }
};

export const RentBookingDetailsCard: React.FC<RentBookingDetailsCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onViewListing,
  className = "",
  isLoading = false,
  roomCount = 0,
  bathroomCount = 0,
  petsAllowed = false,
  primaryButtonText,
  secondaryButtonText,
  tertiaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
  onTertiaryAction,
  listingId,
  hostUserId,
  bookingId,
  bookingStartDate,
  bookingEndDate,
}) => {
  const router = useRouter();
  const [messagingLoading, setMessagingLoading] = React.useState(false);
  const [isDateModificationModalOpen, setIsDateModificationModalOpen] = useState(false);

  const handleMessageHost = async () => {
    if (!listingId || !hostUserId) {
      console.error('Missing listingId or hostUserId for messaging');
      if (onSecondaryAction) onSecondaryAction();
      return;
    }

    setMessagingLoading(true);
    try {
      // First check if conversation exists
      const existing = await findConversationBetweenUsers(listingId, hostUserId);
      
      if (existing.conversationId) {
        // Navigate to existing conversation
        router.push(`/app/rent/messages?convoId=${existing.conversationId}`);
      } else {
        // Create new conversation and navigate
        const result = await createListingConversation(listingId, hostUserId);
        if (result.success && result.conversationId) {
          router.push(`/app/rent/messages?convoId=${result.conversationId}`);
        } else {
          console.error('Failed to create conversation:', result.error);
        }
      }
    } catch (error) {
      console.error('Error handling message host:', error);
    } finally {
      setMessagingLoading(false);
    }
  };

  const filteredOccupants = occupants.filter(o => o.count > 0);

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
            {/* Host Profile Image */}
            {status.toLowerCase() === 'active' ? (
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

            {/* Booking Details */}
            <div className="flex flex-col items-start gap-2.5 flex-1 min-w-0">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="flex flex-col sm:flex-row sm:items-start items-start gap-2 w-full">
                  <div className="font-text-label-large-medium text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] flex-shrink-0">
                    Host: {name}
                  </div>

                  <Badge className={`px-2.5 py-1 font-medium rounded-full flex-shrink-0 ${getStatusBadgeStyle(status)}`}>
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
                {filteredOccupants.map((occupant, index) => (
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
              {onViewListing && (
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
                    {bookingId && bookingStartDate && bookingEndDate && hostUserId && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => setIsDateModificationModalOpen(true)}
                      >
                        <Calendar className="w-4 h-4" />
                        Modify Dates
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={onViewListing}
                    >
                      <Home className="w-4 h-4" />
                      View Listing
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex flex-col md:items-end items-start justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl md:text-right text-left">
                {price}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
                {primaryButtonText && (
                  <BrandButton
                    variant="outline"
                    onClick={onPrimaryAction}
                    disabled={isLoading}
                    className="w-full md:w-auto whitespace-nowrap"
                  >
                    {primaryButtonText}
                  </BrandButton>
                )}

                {secondaryButtonText && (
                  <BrandButton 
                    variant="outline"
                    onClick={handleMessageHost}
                    disabled={isLoading || messagingLoading}
                    className="w-full md:w-auto whitespace-nowrap"
                  >
                    {messagingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      secondaryButtonText
                    )}
                  </BrandButton>
                )}

                {tertiaryButtonText && (
                  <BrandButton 
                    variant="default"
                    onClick={onTertiaryAction}
                    disabled={isLoading}
                    className="w-full md:w-auto whitespace-nowrap"
                  >
                    {tertiaryButtonText}
                  </BrandButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Date Modification Modal */}
      {bookingId && bookingStartDate && bookingEndDate && hostUserId && (
        <BookingDateModificationModal
          isOpen={isDateModificationModalOpen}
          onOpenChange={setIsDateModificationModalOpen}
          booking={{
            id: bookingId,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            listing: { title: description }
          }}
          recipientId={hostUserId}
        />
      )}
    </Card>
  );
};