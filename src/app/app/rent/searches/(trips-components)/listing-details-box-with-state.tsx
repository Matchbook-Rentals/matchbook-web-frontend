import React, { useState, useEffect, useRef } from 'react';
import { ListingAndImages } from '@/types';
import { StarIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import SearchMessageHostDialog from '@/components/ui/search-message-host-dialog';
import { X, Heart } from 'lucide-react';
import { BrandButton } from '@/components/ui/brandButton';
import Image from 'next/image';
import { useTripContext } from '@/contexts/trip-context-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface ListingDetailsBoxWithStateProps {
  listing: ListingAndImages;
  onReject: () => void;
  onReturn: () => void;
  onLike: () => void;
  setIsDetailsVisible: (isVisible: boolean) => void;
}

const ListingDetailsBoxWithState: React.FC<ListingDetailsBoxWithStateProps> = ({ 
  listing, 
  onReject, 
  onReturn, 
  onLike, 
  setIsDetailsVisible 
}) => {
  const { state } = useTripContext();
  const host = listing.user;
  const detailsBoxRef = useRef<HTMLDivElement>(null);
  
  // Check current like/dislike state
  const isLiked = state.lookup.favIds.has(listing.id);
  const isDisliked = state.lookup.dislikedIds.has(listing.id);

  useEffect(() => {
    const handleScroll = () => {
      if (detailsBoxRef.current) {
        const detailsBoxRect = detailsBoxRef.current.getBoundingClientRect();
        const isVisible = detailsBoxRect.top >= -90;
        setIsDetailsVisible(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsDetailsVisible]);

  // Action buttons component with state-aware UI
  const ActionButtons = () => {
    return (
      <div className="flex gap-2 h-[45px]">
        <AnimatePresence mode="wait">
          {isDisliked ? (
            // Expanded dislike button
            <motion.div
              key="dislike-expanded"
              initial={{ width: 80 }}
              animate={{ width: 168 }}
              exit={{ width: 80 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-[45px]"
            >
              <Button
                variant="outline"
                className="rounded-lg w-full h-full flex items-center justify-center border-none hover:opacity-90"
                style={{ backgroundColor: '#F65C6D' }}
                onClick={onReject}
              >
                <X className="h-4 w-4 text-white mr-2" />
                <span className="text-white text-sm font-medium">Disliked</span>
              </Button>
            </motion.div>
          ) : isLiked ? (
            // Expanded like button
            <motion.div
              key="like-expanded"
              initial={{ width: 80 }}
              animate={{ width: 168 }}
              exit={{ width: 80 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-[45px]"
            >
              <BrandButton
                variant="default"
                className="rounded-lg w-full h-full min-w-0 flex items-center justify-center hover:opacity-90"
                onClick={onLike}
              >
                <Heart className="h-4 w-4 text-white mr-2" />
                <span className="text-white text-sm font-medium">Liked</span>
              </BrandButton>
            </motion.div>
          ) : (
            // Default state - both buttons
            <motion.div
              key="both-buttons"
              initial={{ width: 168 }}
              animate={{ width: 168 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex gap-2 h-[45px]"
            >
              <motion.div
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-[45px]"
              >
                <Button
                  variant="outline"
                  className="rounded-lg w-[80px] h-full flex items-center justify-center border-none hover:opacity-90"
                  style={{ backgroundColor: '#F65C6D' }}
                  onClick={onReject}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </motion.div>

              <motion.div
                layout
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-[45px]"
              >
                <BrandButton
                  variant="default"
                  className="rounded-lg w-[80px] h-full min-w-0 flex items-center justify-center hover:opacity-90"
                  onClick={onLike}
                >
                  <Heart className="h-4 w-4 text-white" />
                </BrandButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <Card className="w-full border border-[#0000001a] rounded-xl" ref={detailsBoxRef}>
      <CardContent className="flex flex-col items-start gap-5 p-4">
        {/* Header with buttons */}
        <div className="flex justify-between w-full mb-2">
          <Button 
            variant="ghost" 
            className="h-9 px-3.5 py-2.5 rounded-lg"
            onClick={onReturn}
          >
            <span className="font-semibold text-sm text-[#5d606d] underline">
              Undo
            </span>
          </Button>

          <ActionButtons />
        </div>

        {/* Host information */}
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-[59px] h-[59px] rounded-xl">
            <AvatarImage 
              src={host?.imageUrl || ''} 
              alt={`${host?.firstName || 'Host'} profile`}
            />
            <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
              {(host?.firstName?.charAt(0) + host?.lastName?.charAt(0)) || 'H'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5">
            <div className="font-medium text-[#373940] text-sm">
              Hosted by {host?.firstName || 'Host'}
            </div>

            <div className="flex items-center gap-1 h-8">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="font-normal text-[#717680] text-sm">
                {listing?.averageRating || listing.uScore 
                  ? (listing?.averageRating || listing.uScore?.toFixed(1)) 
                  : 'N/A'} ({listing?.numberOfStays || 0})
              </span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-0 py-1 bg-transparent border-0"
        >
          <Image 
            src="/svg/verified-badge.svg" 
            alt="Verified" 
            width={16} 
            height={16} 
          />
          <span className="font-normal text-xs text-greygrey-500 font-['Poppins',Helvetica]">
            Verified
          </span>
        </Badge>

        <Separator className="w-full" />

        {/* Pricing information */}
        <div className="flex justify-between w-full">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-[#373940] text-sm">
              ${listing.price?.toLocaleString()}
            </div>
            <div className="font-normal text-[#5d606d] text-base">Month</div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="font-semibold text-[#373940] text-sm">
              ${listing.depositSize?.toLocaleString()}
            </div>
            <div className="font-normal text-[#5d606d] text-base">Deposit</div>
          </div>
        </div>

        {/* Message button - Custom styled for the new design */}
        <div className="w-full">
          <SearchMessageHostDialog 
            listingId={listing.id} 
            hostName={host?.firstName || 'Host'} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingDetailsBoxWithState;