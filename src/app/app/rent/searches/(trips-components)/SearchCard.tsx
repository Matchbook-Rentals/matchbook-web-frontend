import React from "react";
import { Badge } from "@/components/ui/badge";
import { BrandButton } from "@/components/ui/brandButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trip } from "@prisma/client";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import EditSearchModal from "./EditSearchModal";

interface SearchCardProps {
  trip: Trip;
  onContinueSearch?: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onMenu?: (trip: Trip) => void;
  onTripUpdate?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => void;
}

export const SearchCard = ({ 
  trip, 
  onContinueSearch, 
  onEdit, 
  onMenu,
  onTripUpdate,
  onDelete
}: SearchCardProps): JSX.Element => {
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const formatPriceRange = (priceMin: number | null, priceMax: number | null) => {
    if (!priceMin && !priceMax) return "Not specified";
    if (priceMin && priceMax) return `$${priceMin} - $${priceMax}`;
    if (priceMin) return `$${priceMin}+`;
    if (priceMax) return `Up to $${priceMax}`;
    return "Not specified";
  };

  return (
    <Card className="w-full bg-white rounded-xl shadow-[0px_0px_5px_#00000029] border-0">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full">
          <div className="flex items-start gap-6 flex-1 w-full lg:w-auto">
            <div className="flex flex-col items-start gap-2.5 flex-1 w-full">
              <div className="flex flex-col items-start justify-center gap-2 w-full">
                <div className="inline-flex items-start gap-2">
                  <div className="font-medium text-gray-700 text-lg">
                    {trip.locationString}
                  </div>
                </div>

                <div className="inline-flex items-start gap-2">
                  <div className="text-gray-500 text-sm">
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </div>

                  <Badge className="h-[25px] bg-teal-50 text-teal-700 rounded-full px-2 py-1 hover:bg-teal-50">
                    <div className="text-sm">
                      {calculateDuration(trip.startDate, trip.endDate)}
                    </div>
                  </Badge>
                </div>
              </div>

              <div className="inline-flex items-center gap-2.5">
                <div className="font-medium text-gray-600 text-sm">
                  Price Range:
                </div>

                <div className="font-medium text-teal-700 text-base">
                  {formatPriceRange(trip.minPrice, trip.maxPrice)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full">
                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                  <Image className="w-5 h-5" alt="Adult" src="/adultl.svg" width={20} height={20} />

                  <div className="font-medium text-gray-600 text-sm whitespace-nowrap">
                    {trip.numAdults} Adult{trip.numAdults !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                  <Image className="w-5 h-5" alt="Kid" src="/kid.svg" width={20} height={20} />

                  <div className="font-medium text-gray-600 text-sm whitespace-nowrap">
                    {trip.numChildren} Child{trip.numChildren !== 1 ? 'ren' : ''}
                  </div>
                </div>

                <div className="inline-flex items-center justify-center gap-1.5 px-0 py-1.5 rounded-full">
                  <Image className="w-5 h-5" alt="Pet" src="/pet.svg" width={20} height={20} />

                  <div className="font-medium text-gray-600 text-sm whitespace-nowrap">
                    {trip.numPets} pet{trip.numPets !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full lg:w-auto items-end justify-center gap-3">
            <div className="inline-flex items-center gap-3 w-full lg:w-auto max-w-[300px] justify-between sm:justify-end">
              <BrandButton
                variant="default"
                className="min-w-0 px-4 py-2"
                href={`/app/rent/searches/${trip.id}`}
                onClick={() => onContinueSearch?.(trip)}
              >
                Continue Search
              </BrandButton>

              <EditSearchModal 
                trip={trip}
                onTripUpdate={onTripUpdate}
                triggerButton={
                  <BrandButton
                    variant="outline"
                    className="min-w-0 px-4 py-2"
                    onClick={() => onEdit?.(trip)}
                  >
                    Edit
                  </BrandButton>
                }
              />

              <Popover>
                <PopoverTrigger asChild>
                  <BrandButton
                    variant="outline"
                    className="min-w-0 px-3 py-2"
                  >
                    <Image className="w-5 h-5" alt="Menu" src="/frame.svg" width={20} height={20} />
                  </BrandButton>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onDelete?.(trip);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Search
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};