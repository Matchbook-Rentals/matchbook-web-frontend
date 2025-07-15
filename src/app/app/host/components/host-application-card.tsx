import { MapPinIcon, MoreVertical, MoreVerticalIcon, Home, Loader2 } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Occupant {
  type: string;
  count: number;
  icon: string;
}

interface HostApplicationCardProps {
  name: string;
  status: string;
  dates: string;
  address: string;
  description: string;
  price: string;
  occupants: Occupant[];
  profileImage?: string;
  onApplicationDetails?: () => void;
  onMessageGuest?: () => void;
  onManageListing?: () => void;
  className?: string;
  isLoading?: boolean;
}

const HostApplicationCardMobile: React.FC<HostApplicationCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onApplicationDetails,
  onMessageGuest,
  onManageListing,
  className = "",
  isLoading = false,
}) => {
  return (
    <Card className={`w-full rounded-xl overflow-hidden p-4 ${className} ${isLoading ? 'opacity-75' : ''}`}>
      <CardContent className="p-0 space-y-6 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#3c8787]" />
          </div>
        )}
        
        <div className="flex items-start gap-6">
          {/* Property Image */}
          <div 
            className="relative w-[114.71px] h-[98px] rounded-[9.12px] bg-cover bg-[50%_50%]" 
            style={{ backgroundImage: `url(${profileImage})` }}
          />

          <div className="flex flex-col items-start justify-center gap-2 flex-1">
            <div className="flex flex-col items-start gap-2 w-full">
              {/* Status Badge */}
              <Badge className={`${
                status.toLowerCase() === 'approved' 
                  ? 'bg-[#e9f7ee] text-[#1ca34e] border-[#1ca34e] hover:bg-[#e9f7ee] hover:text-[#1ca34e]'
                  : status.toLowerCase() === 'pending'
                  ? 'bg-[#fff3cd] text-[#e67e22] border-[#e67e22] hover:bg-[#fff3cd] hover:text-[#e67e22]'
                  : status.toLowerCase() === 'declined'
                  ? 'bg-[#f8d7da] text-[#dc3545] border-[#dc3545] hover:bg-[#f8d7da] hover:text-[#dc3545]'
                  : 'bg-gray-100 text-gray-600 border-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}>
                {status}
              </Badge>

              {/* Guest Name */}
              <div className="font-text-label-large-medium text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)]">
                {name}
              </div>
            </div>

            {/* Rental Period */}
            <div className="font-text-label-small-regular text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)]">
              {dates}
            </div>
          </div>

          {/* Menu Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-6 h-6 p-0 border-[#d9dadf] shadow-[0px_0px_4px_#ffffff7d]"
                disabled={isLoading}
              >
                <MoreVerticalIcon className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
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

        <div className="flex flex-col items-start gap-2.5">
          {/* Address */}
          <div className="flex items-center gap-2 w-full">
            <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
            <div className="flex-1 font-text-label-medium-regular text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
              {address}
            </div>
          </div>

          {/* Property Description */}
          <div className="font-text-label-medium-regular hidden lg:inline text-[#777b8b] text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)]">
            {description}
          </div>

          {/* Occupancy Details */}
          <div className="flex items-center gap-6 w-full">
            {occupants.map((occupant, index) => (
              <div
                key={index}
                className="inline-flex items-center justify-center gap-1.5 py-1.5"
              >
                <img className="w-5 h-5" alt={occupant.type} src={occupant.icon} />
                <div className="font-medium text-[#344054] text-sm leading-5 whitespace-nowrap">
                  {occupant.count} {occupant.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start p-0 mt-6 gap-3">
        {/* Price */}
        <div className="self-stretch font-semibold text-[#484a54] text-xl">
          {price}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 border-[#3c8787] text-[#3c8787] font-semibold hover:text-[#3c8787] hover:bg-transparent"
            onClick={onApplicationDetails}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Application Details'
            )}
          </Button>
          <Button 
            className="flex-1 bg-[#3c8787] hover:bg-[#3c8787]/90 text-white"
            onClick={onMessageGuest}
            disabled={isLoading}
          >
            Message Guest
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export const HostApplicationCard: React.FC<HostApplicationCardProps> = ({
  name,
  status,
  dates,
  address,
  description,
  price,
  occupants,
  profileImage = "/image-35.png",
  onApplicationDetails,
  onMessageGuest,
  onManageListing,
  className = "",
  isLoading = false,
}) => {
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
      <HostApplicationCardMobile
        name={name}
        status={status}
        dates={dates}
        address={address}
        description={description}
        price={price}
        occupants={occupants}
        profileImage={profileImage}
        onApplicationDetails={onApplicationDetails}
        onMessageGuest={onMessageGuest}
        onManageListing={onManageListing}
        className={className}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Card className={`w-full p-6 rounded-xl ${className} ${isLoading ? 'opacity-75' : ''}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 w-full relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="w-8 h-8 animate-spin text-[#3c8787]" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 flex-1 w-full">
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

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full">
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
          <div className="flex flex-col sm:items-end items-start justify-center gap-2 w-fit self-stretch">
            <div className="flex flex-col items-start gap-2.5 flex-1">
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

            <div className="flex flex-col sm:items-end items-start justify-center gap-3 w-full">
              <div className="w-full font-semibold text-[#484a54] text-xl sm:text-right text-left">
                {price}
              </div>

              <div className="flex flex-col lg:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <BrandButton
                  variant="outline"
                  onClick={onApplicationDetails}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Application Details'
                  )}
                </BrandButton>

                <BrandButton 
                  variant="default"
                  onClick={onMessageGuest}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
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
