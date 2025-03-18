'use client';
import { Trip } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash, MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DeniedIcon, DeclinedApplicationIcon, ApplicationIcon } from '@/components/icons';
import { MatchbookVerified } from '@/components/icons/views';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getState = (stateInput: string): string => {
  // Normalize input by removing spaces and converting to uppercase
  const normalized = stateInput.trim().toUpperCase();

  // Map of state abbreviations and variations to full names
  const stateMap: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };

  // Return the mapped state name or the original input if not found
  return stateMap[normalized] || stateInput;
};

interface TripCardProps {
  trip: Trip;
  onDelete: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const locationElements = trip.locationString.split(',');
  const stateName = getState(locationElements[locationElements.length - 1]);
  const statePhotoPath = `/State Photos/${stateName}.jpg`;
  const router = useRouter();
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Format date range for display
  const dateRangeText = trip.startDate && trip.endDate ?
    `${trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
     ${trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},
     ${Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))} days` :
    'No dates selected';

  // Format price range for display
  const getPriceDisplay = () => {
    if (!trip.minPrice && !trip.maxPrice) return 'No price range';
    if (trip.minPrice && trip.maxPrice) return `$${trip.minPrice.toLocaleString()}-$${trip.maxPrice.toLocaleString()}/ Month`;
    if (trip.minPrice) return `$${trip.minPrice.toLocaleString()} or more/ Month`;
    if (trip.maxPrice) return `$${trip.maxPrice.toLocaleString()} or less/ Month`;
  };

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete search</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this search for {trip.locationString}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => onDelete(trip.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="border border-blueBrand rounded-md p-2 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
        <div className="flex justify-between items-start w-full md:w-auto">
          <div className="space-y-1">
            <h2 className="font-medium text-gray-900">{trip.locationString}</h2>
            <p className="text-base text-gray-600">{dateRangeText}</p>
            <p className="text-base text-gray-600">{trip.numAdults} adults, {trip.numChildren} children, {trip.numPets} pets</p>
          </div>
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-md h-9 w-9 border border-gray-200 bg-background"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-1">
                <div className="flex flex-col w-full gap-1 text-left">
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center justify-start gap-2"
                    onClick={() => router.push(`/platform/trips/${trip.id}/dislikes`)}
                  >
                    <DeniedIcon className="h-4 w-4" /> Disliked Properties
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center justify-start gap-2"
                    onClick={() => router.push(`/platform/trips/${trip.id}/declined`)}
                  >
                    <DeclinedApplicationIcon className="h-4 w-4" /> Declined Applications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center justify-start gap-2"
                    onClick={() => router.push(`/platform/trips/${trip.id}/verification`)}
                  >
                    <MatchbookVerified className="h-4 w-4" /> Verification
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center justify-start gap-2"
                    onClick={() => router.push(`/platform/application`)}
                  >
                    <ApplicationIcon className="h-4 w-4" /> Application
                  </Button>
                  <hr className="my-1" />
                  <Button
                    variant="ghost"
                    className="w-full text-left flex items-center justify-start gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                   <Trash className="h-4 w-4" /> Delete search
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-center gap-3 w-full md:w-auto">
          <div className="text-right font-medium">{getPriceDisplay()}</div>
          <div className="flex justify-center gap-2 w-full md:w-auto">
            <Button
              className="bg-blueBrand/50 hover:bg-blueBrand/80 text-[#404040] rounded-md px-4 py-2 text-sm font-medium flex-1 md:w-auto h-9"
              variant="ghost"
              onClick={() => router.push(`trips/${trip.id}`)}
            >
              Continue Search
            </Button>
            <Button
              className="bg-background border border-gray-200 hover:bg-gray-100 text-[#404040] rounded-md px-4 py-2 text-sm font-medium h-9"
              variant="ghost"
              onClick={() => router.push(`trips/${trip.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <div className="hidden md:block">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md h-9 w-9 border border-gray-200 bg-background"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-1">
                  <div className="flex flex-col w-full gap-1 text-left">
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center justify-start gap-2"
                      onClick={() => router.push(`/platform/trips/${trip.id}/dislikes`)}
                    >
                      <DeniedIcon className="h-4 w-4" /> Disliked Properties
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center justify-start gap-2"
                      onClick={() => router.push(`/platform/trips/${trip.id}/declined`)}
                    >
                      <DeclinedApplicationIcon className="h-4 w-4" /> Declined Applications
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center justify-start gap-2"
                      onClick={() => router.push(`/platform/trips/${trip.id}/verification`)}
                    >
                      <MatchbookVerified className="h-4 w-4" /> Verification
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center justify-start gap-2"
                      onClick={() => router.push(`/platform/application`)}
                    >
                      <ApplicationIcon className="h-4 w-4" /> Application
                    </Button>
                    <hr className="my-1" />
                    <Button
                      variant="ghost"
                      className="w-full text-left flex items-center justify-start gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                     <Trash className="h-4 w-4" /> Delete search
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TripCard;
