"use client";

import { MoreVerticalIcon, MapPinIcon, BedSingleIcon, BathIcon, SquareIcon, TrashIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingAndImages } from "@/types";
import CalendarDialog from "@/components/ui/calendar-dialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/brandDialog";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HostListingCardProps {
  listing: ListingAndImages;
  loadingListingId?: string | null;
  onViewDetails?: (listingId: string) => void;
  isDraft?: boolean;
  deleteFunction?: (listingId: string) => Promise<any>;
}

export default function HostListingCard({ 
  listing, 
  loadingListingId, 
  onViewDetails,
  isDraft = false,
  deleteFunction
}: HostListingCardProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Map listing status to display status and color
  const getStatusInfo = (listing: ListingAndImages) => {
    // Handle drafts first
    if (isDraft || listing.status === 'draft') {
      return { status: "Draft", statusColor: "text-[#8B7355]" };
    }
    
    // Check approval status first
    if (listing.approvalStatus === 'pendingReview') {
      return { status: "Pending Approval", statusColor: "text-[#c68087]" };
    } else if (listing.approvalStatus === 'rejected') {
      return { status: "Rejected", statusColor: "text-[#c68087]" };
    } else if (listing.approvalStatus === 'approved') {
      // For approved listings, check if marked active by user
      if (listing.markedActiveByUser) {
        // Check rental status for active listings
        if (listing.status === "rented") {
          return { status: "Rented", statusColor: "text-[#24742f]" };
        } else {
          return { status: "Active", statusColor: "text-[#5c9ac5]" };
        }
      } else {
        return { status: "Inactive", statusColor: "text-[#c68087]" };
      }
    } else {
      // Fallback to old logic if approval status is undefined
      if (listing.status === "rented") {
        return { status: "Rented", statusColor: "text-[#24742f]" };
      } else if (listing.status === "booked") {
        return { status: "Active", statusColor: "text-[#5c9ac5]" };
      } else if (listing.status === "available") {
        return { status: "Active", statusColor: "text-[#5c9ac5]" };
      } else {
        return { status: "Inactive", statusColor: "text-[#c68087]" };
      }
    }
  };

  // Format price range
  const formatPrice = (listing: ListingAndImages) => {
    // Handle drafts - they might not have pricing data
    if (isDraft || listing.status === 'draft') {
      return 'Pricing not set';
    }
    
    if (listing.monthlyPricing && listing.monthlyPricing.length > 0) {
      const prices = listing.monthlyPricing.map(pricing => pricing.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // If all prices are the same, display only one
      if (minPrice === maxPrice) {
        return `$${minPrice.toLocaleString()} / Month`;
      }
      
      return `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()} / Month`;
    }
    
    // Fallback to deprecated fields if monthlyPricing is not available
    if (listing.longestLeasePrice && listing.shortestLeasePrice) {
      // If both prices are the same, display only one
      if (listing.longestLeasePrice === listing.shortestLeasePrice) {
        return `$${listing.longestLeasePrice.toLocaleString()} / Month`;
      }
      // Ensure lower price is always first (in case they were inverted)
      const lowerPrice = Math.min(listing.longestLeasePrice, listing.shortestLeasePrice);
      const higherPrice = Math.max(listing.longestLeasePrice, listing.shortestLeasePrice);
      return `$${lowerPrice.toLocaleString()} - $${higherPrice.toLocaleString()} / Month`;
    } else if (listing.shortestLeasePrice) {
      return `$${listing.shortestLeasePrice.toLocaleString()} / Month`;
    } else if (listing.longestLeasePrice) {
      return `$${listing.longestLeasePrice.toLocaleString()} / Month`;
    }
    return "Price not set";
  };

  const { status, statusColor } = getStatusInfo(listing);
  
  // Handle address display with better placeholders for drafts
  const getDisplayAddress = () => {
    if (isDraft) {
      // For drafts, be more specific about what's missing
      if (!listing.streetAddress1 && !listing.city && !listing.state) {
        return "No address added";
      }
      if (!listing.streetAddress1 && listing.city && listing.state) {
        return `Property in ${listing.city}, ${listing.state}`;
      }
      if (listing.streetAddress1 && !listing.city) {
        return listing.streetAddress1;
      }
    }
    
    const fullAddress = `${listing.streetAddress1 || ''} ${listing.city || ''}, ${listing.state || ''} ${listing.postalCode || ''}`.trim();
    
    if (isMobile) {
      return listing.streetAddress1 || `Property in ${listing.state || 'Unknown Location'}`;
    }
    
    return fullAddress || "Address not set";
  };
  
  const displayAddress = getDisplayAddress();

  const handleDeleteListing = () => {
    setIsPopoverOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteFunction) {
      toast.error("Delete function not provided");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFunction(listing.id);
      toast.success(isDraft ? "Draft deleted successfully" : "Listing deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmationText("");
      router.refresh(); // Refresh the page to update the listing display
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error(error instanceof Error ? error.message : `Failed to delete ${isDraft ? 'draft' : 'listing'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteConfirmationText("");
  };

  const isDeleteButtonDisabled = deleteConfirmationText.toLowerCase() !== listing.streetAddress1?.toLowerCase();

  // Mobile Layout Component
  const MobileLayout = () => (
      <Card className="flex flex-col w-full items-start gap-6 p-3 bg-background rounded-xl overflow-hidden mb-4">
        <CardContent className="flex flex-col items-end justify-end gap-6 relative self-stretch w-full p-0">
          <div className="flex items-start gap-2 relative self-stretch w-full min-w-0">
            <div className="flex flex-col items-start gap-6 relative flex-1 grow min-w-0">
              {/* Property Image */}
              <div className="relative w-full rounded-xl overflow-hidden bg-cover bg-center"
                   style={{ 
                     backgroundImage: listing.listingImages?.[0]?.url 
                       ? `url(${listing.listingImages[0].url})` 
                       : isDraft 
                         ? undefined 
                         : `url(/image-35.png)`,
                     backgroundColor: isDraft && !listing.listingImages?.[0]?.url ? '#f3f4f6' : undefined,
                     aspectRatio: '366/162' 
                   }}>
                {isDraft && !listing.listingImages?.[0]?.url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">No photo added</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-6 h-6 p-0 bg-background rounded overflow-hidden border border-solid border-[#d9dadf] shadow-[0px_0px_4px_#ffffff7d]"
                      >
                        <MoreVerticalIcon className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={handleDeleteListing}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          {isDraft ? 'Delete Draft' : 'Delete Listing'}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Property Details */}
              <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full min-w-0">
                <div className="flex flex-col items-start gap-2 relative self-stretch w-full min-w-0">
                  {/* Property Name and Status */}
                  <div className="flex items-start gap-2 relative justify-between self-stretch w-full min-w-0">
                    <div className="relative flex-1 truncate min-w-0 mt-[-1.00px] font-text-label-large-medium font-[number:var(--text-label-large-medium-font-weight)] text-[#484a54] text-[length:var(--text-label-large-medium-font-size)] tracking-[var(--text-label-large-medium-letter-spacing)] leading-[var(--text-label-large-medium-line-height)] [font-style:var(--text-label-large-medium-font-style)]">
                      {listing.title || displayAddress}
                    </div>

                    <Badge
                      variant="outline"
                      className={`items-center flex-0 gap-1.5 px-2.5 py-1 rounded-full border border-solid font-medium ${
                        status === 'Active' ? 'bg-[#e9f7ee] border-[#1ca34e] text-[#1ca34e]' :
                        status === 'Rented' ? 'bg-blue-50 border-blue-600 text-blue-600' :
                        status === 'Pending Approval' ? 'bg-yellow-50 border-yellow-700 text-yellow-700' :
                        status === 'Rejected' ? 'bg-red-50 border-red-600 text-red-600' :
                        'bg-gray-50 border-gray-600 text-gray-600'
                      }`}
                    >
                      {status}
                    </Badge>
                  </div>

                  {/* Property Address */}
                  <div className="flex w-full items-start gap-2 relative">
                    <MapPinIcon className="w-5 h-5 text-[#777b8b] flex-shrink-0" />
                    <div className="relative flex-1 truncate mt-[-1.00px] font-text-label-small-regular font-[number:var(--text-label-small-regular-font-weight)] text-[#777b8b] text-[length:var(--text-label-small-regular-font-size)] tracking-[var(--text-label-small-regular-letter-spacing)] leading-[var(--text-label-small-regular-line-height)] [font-style:var(--text-label-small-regular-font-style)] truncate">
                      {listing.locationString}
                    </div>
                  </div>
                </div>

                {/* Property Features */}
                <div className="flex items-center justify-between gap-[5px] relative self-stretch w-full flex-wrap max-w-[100%] flex-wrap-reverse">
                  <div className="items-center justify-center gap-1.5 px-0 py-1.5 rounded-full inline-flex relative">
                    <BedSingleIcon className="w-5 h-5 text-[#344054]" />
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                      {isDraft && !listing.roomCount ? 'Bedrooms not set' : `${listing.roomCount || 0} Bedroom${(listing.roomCount || 0) !== 1 ? 's' : ''}`}
                    </div>
                  </div>

                  <div className="items-center justify-center gap-1.5 px-0 py-1.5 rounded-full inline-flex relative">
                    <BathIcon className="w-5 h-5 text-[#344054]" />
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                      {isDraft && !listing.bathroomCount ? 'Bathrooms not set' : `${listing.bathroomCount || 0} Bathroom${(listing.bathroomCount || 0) !== 1 ? 's' : ''}`}
                    </div>
                  </div>

                  <div className="items-center justify-center gap-1.5 px-0 py-1.5 rounded-full inline-flex relative">
                    <SquareIcon className="w-5 h-5 text-[#344054]" />
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#344054] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
                      {isDraft && !listing.squareFootage ? 'Size not set' : `${listing.squareFootage || 'N/A'} Sqft`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start justify-end gap-3 relative self-stretch w-full p-0">
          {/* Price */}
          <div className="relative self-stretch mt-[-1.00px] font-text-heading-small-semi-bold font-[number:var(--text-heading-small-semi-bold-font-weight)] text-[#484a54] text-[length:var(--text-heading-small-semi-bold-font-size)] tracking-[var(--text-heading-small-semi-bold-letter-spacing)] leading-[var(--text-heading-small-semi-bold-line-height)] [font-style:var(--text-heading-small-semi-bold-font-style)]">
            {formatPrice(listing)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 relative self-stretch w-full">
            <CalendarDialog
              bookings={listing.bookings || []}
              unavailablePeriods={listing.unavailablePeriods || []}
              triggerText="View Calendar"
              listingId={listing.id}
              showIcon={false}
              triggerClassName="flex-1 border-[#3c8787] text-[#3c8787] font-semibold bg-background hover:bg-[#3c8787] hover:text-white transition-all duration-300"
              variant="outline"
            />
            <BrandButton
              variant="default"
              className="flex-1 bg-[#3c8787] text-white font-semibold"
              href={`/app/host/${listing.id}/summary`}
              spinOnClick={true}
            >
              Manage Listing
            </BrandButton>
          </div>
        </CardFooter>
      </Card>
  );

  // Desktop Layout Component
  const DesktopLayout = () => (
    <Card className="w-full p-6 rounded-xl mb-8">
      <CardContent className="p-0">
        <div className="flex gap-6">
          {/* Property Image */}
          <div className="w-[209px] h-[140px] rounded-xl overflow-hidden flex-shrink-0 relative">
            {listing.listingImages?.[0]?.url ? (
              <img
                className="w-full h-full object-cover"
                alt="Property image"
                src={listing.listingImages[0].url}
              />
            ) : isDraft ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">No photo added</span>
              </div>
            ) : (
              <img
                className="w-full h-full object-cover"
                alt="Property image"
                src="/image-35.png"
              />
            )}
          </div>

          {/* Property Details */}
          <div className="flex flex-col gap-4 flex-grow">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                {/* Status Badge */}
                <Badge className={`w-fit ${
                  status === 'Active' ? 'bg-[#e9f7ee] text-[#1ca34e] border border-[#1ca34e] hover:bg-[#e9f7ee] hover:text-[#1ca34e]' : 
                  status === 'Rented' ? 'bg-blue-50 text-blue-600 border border-blue-600 hover:bg-blue-50 hover:text-blue-600' : 
                  status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-700 border border-yellow-700 hover:bg-yellow-50 hover:text-yellow-700' :
                  status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-600 hover:bg-red-50 hover:text-red-600' :
                  'bg-gray-50 text-gray-600 border border-gray-600 hover:bg-gray-50 hover:text-gray-600'
                }`}>
                  {status}
                </Badge>

                {/* Property Name */}
                <h3 className="font-text-label-large-medium text-[#484a54] text-[18px]">
                  {listing.title || displayAddress}
                </h3>
              </div>

              {/* Property Address */}
              <div className="flex items-center gap-2 w-full">
                <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
                <span className="font-text-label-small-regular text-[#777b8b] text-[14px]">
                  {displayAddress}
                </span>
              </div>
            </div>

            {/* Property Features */}
            <div className="flex items-center gap-10">
              {/* Bedroom */}
              <div className="flex items-center gap-1.5 py-1.5">
                <BedSingleIcon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-sm text-[#344054]">
                  {isDraft && !listing.roomCount ? 'Bedrooms not set' : `${listing.roomCount || 0} Bedroom${(listing.roomCount || 0) !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Bathroom */}
              <div className="flex items-center gap-1.5 py-1.5">
                <BathIcon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-sm text-[#344054]">
                  {isDraft && !listing.bathroomCount ? 'Bathrooms not set' : `${listing.bathroomCount || 0} Bathroom${(listing.bathroomCount || 0) !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Square Footage */}
              <div className="flex items-center gap-1.5 py-1.5">
                <SquareIcon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-sm text-[#344054]">
                  {isDraft && !listing.squareFootage ? 'Size not set' : `${listing.squareFootage || 'N/A'} Sqft`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Price and Actions */}
          <div className="flex flex-col justify-between items-end">
            {/* More Options Button */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg border-[#3c8787] h-10 w-10"
                >
                  <MoreVerticalIcon className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteListing}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {isDraft ? 'Delete Draft' : 'Delete Listing'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex flex-col items-end gap-3">
              {/* Price */}
              <p className="font-semibold text-xl text-[#484a54]">
                {formatPrice(listing)}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isDraft && (
                  <CalendarDialog 
                    bookings={listing.bookings || []}
                    unavailablePeriods={listing.unavailablePeriods || []}
                    triggerText="View Calendar"
                    listingId={listing.id}
                    showIcon={false}
                    triggerClassName="!border-primaryBrand !text-primaryBrand hover:!bg-primaryBrand hover:!text-white !transition-all !duration-300 !h-[36px] !min-w-[156px] !rounded-lg !px-4 !py-3 !gap-1 !font-['Poppins'] !font-semibold !text-sm !leading-5 !tracking-normal"
                  />
                )}
                <BrandButton 
                  variant="default"
                  size="sm"
                  href={isDraft ? undefined : `/app/host/${listing.id}/summary`}
                  onClick={isDraft ? () => onViewDetails?.(listing.id) : undefined}
                  spinOnClick={true}
                >
                  {isDraft ? 'Finish Listing' : 'Manage Listing'}
                </BrandButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[calc(100%-2rem)] !top-[15vh] md:!top-[25vh] sm:max-w-md md:max-w-lg">
          <div className="flex flex-col gap-4 w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this listing?
              </h3>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. This will permanently delete the listing and remove all associated data.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmation-input" className="block text-sm font-medium text-gray-700">
                To confirm, type <strong>{listing.streetAddress1}</strong> below:
              </label>
              <Input
                id="confirmation-input"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={listing.streetAddress1}
                className="w-full"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full pt-6 border-t border-gray-200">
            <BrandButton
              variant="outline"
              onClick={handleCancelDelete}
              className="flex-1"
            >
              Cancel
            </BrandButton>
            <BrandButton
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleteButtonDisabled || isDeleting}
              className="flex-1"
              spinOnClick={false}
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {isDraft ? 'Delete Draft' : 'Delete Listing'}
                </>
              )}
            </BrandButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
