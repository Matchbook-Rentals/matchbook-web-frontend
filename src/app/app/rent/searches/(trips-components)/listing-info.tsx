import React, { useState } from 'react'; // Import useState
import { MatchbookVerified } from '@/components/icons';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ListingAndImages } from '@/types';
import AmenityListItem from '../../old-search/(components)/amenity-list-item';
import { iconAmenities } from '@/lib/amenities-list';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,   // Import DialogHeader
  DialogTitle,    // Import DialogTitle
  DialogFooter,   // Import DialogFooter
  DialogClose,    // Import DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label';       // Import Label
import {
  TallDialogContent, // Keep this if used for the amenities dialog
  TallDialogTitle,
  TallDialogTrigger,
  TallDialogTriggerText,
} from '@/constants/styles';
import { Star as StarIcon, MapPin, Bed, Bath, Square, Share2, Heart, CheckCircle } from 'lucide-react'; // Added new icons
import ShareButton from '@/components/ui/share-button';
import { usePathname, useParams } from 'next/navigation';
import { VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge } from '@/components/icons'; // Assuming these icons exist
import { sendInitialMessage } from '@/app/actions/messages'; // Import the server action
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import SearchMessageHostDialog from '@/components/ui/search-message-host-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Define the desired order for amenity categories
const categoryOrder = ['basics', 'accessibility', 'location', 'parking', 'kitchen', 'luxury', 'laundry', 'other'];

// Define your base URL; for example, using an environment variable.
const baseUrl = process.env.NEXT_PUBLIC_URL || "";

const sectionStyles = 'border-b pb-5 mt-5';
const sectionHeaderStyles = 'text-[#404040] text-[24px] mb-3 font-medium';
const amenityTextStyle = 'text-[16px] md:text-[18px] lg:text-[20px] font-medium';
const bodyTextStyle = 'text-[14px] md:text-[16px] lg:text-[20px] font-normal';

interface ListingDescriptionProps {
  listing: ListingAndImages;
  showFullAmenities?: boolean;
  isFlexible?: boolean;
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({ listing, showFullAmenities = false, isFlexible = false }) => {
  const [message, setMessage] = useState(''); // State for the message textarea
  const [isSending, setIsSending] = useState(false); // State for loading indicator
  const { toast } = useToast(); // Initialize toast
  const pathname = usePathname();
  const { tripId } = useParams();

  const calculateDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if ((listing as any)[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  const displayAmenities = calculateDisplayAmenities();
  const initialDisplayCount = 6;

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Cannot send empty message",
      });
      return;
    }
    setIsSending(true);
    try {
      const result = await sendInitialMessage(listing.id, message);
      if (result.success) {
        toast({
          title: "Message Sent!",
          description: "Your message has been sent to the host.",
        });
        setMessage(''); // Clear message input on success
        // Optionally close the dialog here if needed, though DialogClose on Cancel works
        // Consider adding state to control Dialog open prop if programmatic close is desired
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send message",
          description: result.error || "An unknown error occurred.",
        });
      }
    } catch (error) {
      logger.error("Error sending message", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while sending the message.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='w-full'>
      {/* Desktop Title and Details Section */}
      <Card className="border-0 shadow-none mt-6 hidden lg:block">
        <CardContent className="flex flex-col items-start gap-3 p-0">
          <div className="items-center justify-between self-stretch w-full flex relative">
            <div className="flex-col items-start gap-4 flex-1 grow flex relative">
              <div className="items-center justify-between self-stretch w-full flex relative">
                <h1 className="relative w-fit mt-[-1.00px] font-medium text-[#404040] text-[32px] tracking-[-2.00px] font-['Poppins',Helvetica]">
                  {listing.title || "Your Home Away From Home"}
                </h1>
              </div>
            </div>

            <ShareButton
              title={`${listing.title} on Matchbook`}
              text={`Check out this listing on Matchbook: ${pathname}`}
              url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
            />
          </div>

          <div className="flex flex-wrap w-full max-w-[424px] items-center justify-between gap-[24px_24px] relative">
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <MapPin className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
                {listing.city || listing.address || "Location"}
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <Bed className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
                {listing.roomCount || 0} Bed
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <Bath className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
                {listing.bathroomCount || 0} Bath
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <Square className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[0]">
                {listing.squareFootage?.toLocaleString() || 0} sqft
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Title and Details Section */}
      <Card className="border-0 shadow-none mt-6 lg:hidden">
        <CardContent className="flex flex-col items-start gap-3 p-0">
          {/* Header section with title and buttons */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between w-full">
              <h2 className="flex-1 font-medium text-[#404040] text-xl md:text-2xl tracking-[-2.00px] font-['Poppins',Helvetica]">
                {listing.title || "Your Home Away From Home"}
              </h2>

              <ShareButton
                title={`${listing.title} on Matchbook`}
                text={`Check out this listing on Matchbook: ${pathname}`}
                url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
              />
            </div>

            {/* Price information */}
            <div className="flex items-start justify-between w-full">
              {/* Monthly price */}
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
                  ${listing.price?.toLocaleString()}
                </span>
                <span className="font-normal text-[#5d606d] text-base tracking-[0] font-['Poppins',Helvetica]">
                  Month
                </span>
              </div>

              {/* Deposit price */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-[#373940] text-sm tracking-[0] font-['Poppins',Helvetica]">
                  ${listing.depositSize ? listing.depositSize.toLocaleString() : 'N/A'}
                </span>
                <span className="font-normal text-[#5d606d] text-base tracking-[0] font-['Poppins',Helvetica]">
                  Deposit
                </span>
              </div>
            </div>
          </div>

          {/* Property details section */}
          <div className="flex flex-wrap items-center justify-between gap-[24px_24px] relative self-stretch w-full">
            <div className="inline-flex items-center gap-2 relative">
              <MapPin className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
                {listing.city || listing.address || "Location"}
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative">
              <Bed className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
                {listing.roomCount || 0} Bed
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative">
              <Bath className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
                {listing.bathroomCount || 0} Bath
              </span>
            </div>
            
            <div className="inline-flex items-center gap-2 relative">
              <Square className="w-5 h-5 text-[#5d606d]" />
              <span className="relative w-fit mt-[-1.00px] font-normal text-[#5d606d] text-sm text-center tracking-[0] font-['Poppins',Helvetica]">
                {listing.squareFootage?.toLocaleString() || 0} sqft
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isFlexible && (
          <p className={`flex justify-between ${sectionStyles} text-[#404040] text-[16px] sm:text-[24px] font-normal`}>
            Available {' '}
            {listing.availableStart?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            }) || state.trip.startDate?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            })} - {listing.availableEnd?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            }) || state.trip.endDate?.toLocaleDateString('en-gb', {
              day: '2-digit',
              month: 'short'
            })}
          </p>
        )}

      {/* Highlights Section */}
      <Card className="bg-neutral-50 rounded-xl mt-5">
        <CardContent className="flex flex-col items-start gap-[18px] p-5">
          <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
            Highlights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {/* Matchbook Verified - Commented out */}
            {/* <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                <MatchbookVerified className="absolute w-4 h-4 top-0.5 left-0.5" />
              </div>
              <span className="font-['Poppins'] text-[14px] font-medium text-[#484A54]">
                Matchbook Verified Guests Preferred
              </span>
            </div> */}

            {/* Category-dependent icons */}
            {listing.category === "singleFamily" && (
              <div className="flex items-start gap-1.5">
                <div className="relative w-5 h-5">
                  <AmenitiesIcons.UpdatedSingleFamilyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                </div>
                <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                  Single Family
                </span>
              </div>
            )}
            {listing.category === "townhouse" && (
              <div className="flex items-start gap-1.5">
                <div className="relative w-5 h-5">
                  <AmenitiesIcons.UpdatedTownhouseIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                </div>
                <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                  Townhouse
                </span>
              </div>
            )}
            {listing.category === "privateRoom" && (
              <div className="flex items-start gap-1.5">
                <div className="relative w-5 h-5">
                  <AmenitiesIcons.UpdatedSingleRoomIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                </div>
                <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                  Private Room
                </span>
              </div>
            )}
            {(listing.category === "apartment" || listing.category === "condo") && (
              <div className="flex items-start gap-1.5">
                <div className="relative w-5 h-5">
                  <AmenitiesIcons.UpdatedApartmentIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                </div>
                <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                  Apartment
                </span>
              </div>
            )}

            {/* Furnished Status */}
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                {listing.furnished ? (
                  <AmenitiesIcons.UpdatedFurnishedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                ) : (
                  <AmenitiesIcons.UpdatedUnfurnishedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                )}
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                {listing.furnished ? "Furnished" : "Unfurnished"}
              </span>
            </div>

            {/* Utilities */}
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                {listing.utilitiesIncluded ? (
                  <AmenitiesIcons.UpdatedUtilitiesIncludedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                ) : (
                  <AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                )}
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                {listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
              </span>
            </div>

            {/* Pets */}
            <div className="flex items-start gap-1.5">
              <div className="relative w-5 h-5">
                {listing.petsAllowed ? (
                  <AmenitiesIcons.UpdatedPetFriendlyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                ) : (
                  <AmenitiesIcons.UpdatedPetUnfriendlyIcon className="absolute w-4 h-4 top-0.5 left-0.5" />
                )}
              </div>
              <span className="font-['Poppins'] text-[16px] font-medium text-[#484A54]">
                {listing.petsAllowed ? "Pets Allowed" : "No Pets"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenity section */}
      <Card className="bg-neutral-50 rounded-xl mt-5">
        <CardContent className="flex flex-col items-start gap-[18px] p-5">
          <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
            Amenities
          </h3>
          
          {showFullAmenities ? (
            /* Full amenities list */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {displayAmenities.map((amenity) => (
                <div key={amenity.code} className="flex items-start gap-1.5">
                  <div className="relative w-5 h-5">
                    {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                  </div>
                  <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                    {amenity.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Abbreviated list with modal */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {displayAmenities.slice(0, initialDisplayCount).map((amenity) => (
                  <div key={amenity.code} className="flex items-start gap-1.5">
                    <div className="relative w-5 h-5">
                      {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                    </div>
                    <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                      {amenity.label}
                    </span>
                  </div>
                ))}
              </div>
              {displayAmenities.length > initialDisplayCount && (
                <Dialog>
                  <DialogTrigger className="mt-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className='font-["Poppins"] text-[14px] font-medium text-[#484A54] bg-neutral-50 mx-auto border-[#404040] rounded-[5px] w-full sm:w-auto sm:mx-0 px-3 py-2'
                    >
                      Show all {displayAmenities.length} amenities
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={TallDialogContent}>
                    <h2 className={TallDialogTitle}>All Amenities</h2>
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {displayAmenities.map((amenity) => (
                          <div key={amenity.code} className="flex items-start gap-1.5 py-2">
                            <div className="relative w-5 h-5">
                              {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                            </div>
                            <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                              {amenity.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Host Information Section - Updated to match search-listing-details-box style */}
      <Card className="border border-[#0000001a] rounded-xl mt-5 lg:hidden">
        <CardContent className="flex flex-col items-start gap-5 p-4">
          {/* Host information */}
          <div className="flex items-center gap-3 w-full">
            <Avatar className="w-[59px] h-[59px] rounded-xl">
              <AvatarImage 
                src={listing.user?.imageUrl || ''} 
                alt={`${listing.user?.firstName || 'Host'} profile`}
              />
              <AvatarFallback className="rounded-xl bg-secondaryBrand text-white font-medium text-xl md:text-2xl lg:text-3xl">
                {(listing.user?.firstName?.charAt(0) + listing.user?.lastName?.charAt(0)) || 'H'}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-0.5">
              <div className="font-medium text-[#373940] text-sm">
                Hosted by {listing.user?.firstName || 'Host'}
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
          {listing.user?.verifiedAt && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#717680]" />
              <span className="font-normal text-[#717680] text-xs">
                Verified
              </span>
            </div>
          )}

          {/* Message button */}
          <div className="w-full">
            <SearchMessageHostDialog 
              listingId={listing.id} 
              hostName={listing.user?.firstName || 'Host'} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Description section */}
      <Card className="bg-neutral-50 rounded-xl mt-5">
        <CardContent className="flex flex-col items-start gap-[18px] p-5">
          <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
            Description
          </h3>
          <p className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
            {listing.description + listing.description + listing.description + listing.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingDescription;
