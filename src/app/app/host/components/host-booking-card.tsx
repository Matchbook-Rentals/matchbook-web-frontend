import { MapPinIcon, MoreVertical, Home } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}

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
}) => {

  return (
    <Card className={`w-full p-6 rounded-xl ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-start gap-2 w-full">
          <div className="flex items-start gap-6 flex-1">
            {/* Profile Image */}
            {status.toLowerCase() === 'approved' ? (
              <div 
                className="relative w-[81px] h-[85px] rounded-xl bg-cover bg-[50%_50%]" 
                style={{ backgroundImage: `url(${profileImage})` }}
              />
            ) : (
              <div 
                className="relative w-[81px] h-[85px] rounded-xl bg-cover bg-[50%_50%]" 
                style={{ backgroundImage: `url(https://placehold.co/600x400/0B6E6E/FFF?text=${name.split(' ').map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')})` }}
              />
            )}

            {/* Applicant Details */}
            <div className="flex flex-col items-start gap-2.5 flex-1">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="flex items-start gap-2">
                  <div className="font-text-label-large-medium text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)]">
                    {name}
                  </div>

                  <Badge className={`px-2.5 py-1 font-medium rounded-full ${
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

              <div className="flex items-center gap-2 w-full">
                <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
                <div className="flex-1 font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
                  {address}
                </div>
              </div>

              <div className="w-full font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
                {description}
              </div>

              <div className="flex items-center gap-6 w-full">
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
          <div className="flex flex-col items-end justify-center gap-2 self-stretch">
            <div className="flex flex-col items-start gap-2.5 flex-1">
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
                <PopoverContent className="w-48 p-0 " align="end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={onManageListing}
                  >
                    <Home className="w-4 h-4" />
                    Manage Listing
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col items-end justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl text-right">
                {price}
              </div>

              <div className="flex items-center gap-3">
                <BrandButton
                  variant="outline"
                  onClick={onBookingDetails}
                >
                  Booking Details
                </BrandButton>

                <BrandButton 
                  variant="default"
                  onClick={onMessageGuest}
                >
                  Message Guest
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};