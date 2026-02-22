'use client'
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star as StarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VerifiedIcon } from '@/components/icons-v3';
import { ListingAndImages } from '@/types';
import { BrandButton } from '@/components/ui/brandButton';
import GuestAuthModal from '@/components/guest-auth-modal';
import { useRouter } from 'next/navigation';

interface HostInformationProps {
  listing: ListingAndImages;
  isAuthenticated?: boolean;
}

const HostInformation: React.FC<HostInformationProps> = ({
  listing,
  isAuthenticated = false,
}) => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState<string | undefined>(undefined);

  const host = listing.user;

  const handleMessageHost = () => {
    if (!isAuthenticated) {
      setAuthRedirectUrl(`/app/rent/messages?listingId=${listing.id}`);
      setShowAuthModal(true);
      return;
    }
    router.push(`/app/rent/messages?listingId=${listing.id}`);
  };

  return (
    <Card className="border-none bg-[#FAFAFA] rounded-xl mt-5 lg:hidden">
      <CardContent className="flex flex-col items-start gap-3 py-4 px-0">
        {/* Host information */}
        <div className="flex items-center gap-3 w-full pb-2">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage
              src={host?.imageUrl || ''}
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
              {(host?.firstName?.charAt(0) + host?.lastName?.charAt(0)) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium text-[#373940] text-sm">
                Hosted by {host?.firstName || 'Host'}
              </div>
              {/* Verified badge - right aligned */}
              <Badge
                variant="outline"
                className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
              >
                <VerifiedIcon className="w-[21px] h-[21px]" />
                <span className="font-normal text-xs text-[#0B6E6E] font-['Poppins'] leading-normal">
                  Verified Host
                </span>
              </Badge>
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" />
              <span className="text-[#717680] text-sm">
                Be {host?.firstName || 'Host'}&apos;s first booking
              </span>
            </div>
          </div>
        </div>

        <BrandButton
          variant="outline"
          size="lg"
          className="w-full min-w-0 text-[#3c8787] font-medium"
          onClick={handleMessageHost}
        >
          Message Host
        </BrandButton>

        <GuestAuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} redirectUrl={authRedirectUrl} />
      </CardContent>
    </Card>
  );
};

export default HostInformation;
