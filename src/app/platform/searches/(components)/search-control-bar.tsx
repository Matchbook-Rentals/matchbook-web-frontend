//Imports
import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTripContext } from '@/contexts/trip-context-provider';
import LocationSuggest from './search-location-suggest';
import DateRangeSelector from '@/components/ui/custom-calendar/date-range-selector/date-range-selector';
import { updateTrip } from '@/app/actions/trips';
import { Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";

const SearchControlBar: React.FC = () => {
  const { state, actions } = useTripContext();
  const router = useRouter();
  const { toast } = useToast();
  const [localGuests, setLocalGuests] = useState({
    numAdults: state.trip?.numAdults || 1,
    numChildren: state.trip?.numChildren || 0,
    numPets: state.trip?.numPets || 0,
  });
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);

  const handleSave = async (newStartDate: Date, newEndDate: Date) => {
    let newSearch = state.trip;
    if (newSearch) {
      newSearch.startDate = newStartDate;
      newSearch.endDate = newEndDate;
    }
    actions.setTrip(prev => ({ ...prev, ...newSearch }));
    await updateTrip(newSearch);
    toast({
      title: "Dates changed successfully",
      description: "Shown listings may change",
      duration: 3000,
      style: { backgroundColor: '#f5f5f5', border: 'black solid 1px' } // Equivalent to grey-100 in most CSS color systems
    });
    router.refresh();
    setDatePopoverOpen(false);
  }

  const handleSaveGuests = async () => {
    let newSearch = state.trip;
    if (newSearch) {
      newSearch.numAdults = localGuests.numAdults;
      newSearch.numChildren = localGuests.numChildren;
      newSearch.numPets = localGuests.numPets;
    }
    actions.setTrip(prev => ({ ...prev, ...newSearch }));
    await updateTrip(newSearch);
    toast({
      title: "Guests changed successfully",
      description: "Shown listings may change",
      duration: 3000,
      style: { backgroundColor: '#f5f5f5' } // Equivalent to grey-100 in most CSS color systems
    });
    router.refresh();
    setGuestPopoverOpen(false);
  };

  const handleGuestChange = (type: 'numAdults' | 'numChildren' | 'numPets', increment: boolean) => {
    setLocalGuests(prev => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1)
    }));
  };

  return (
    <div className="flex justify-between px-1 items-center border-2 shadow-lg rounded-full">
      {/* Destination trigger */}
      <LocationSuggest />
      <Separator orientation="vertical" className="h-10" />
      {/* Date triggers */}
      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex gap-x-1 ">
            <Button variant="ghost" className="h-10 ">
              <div className="text-left">
                <div className="text-[15px] ">{state.trip?.startDate ? state.trip.startDate.toLocaleDateString() : 'Add date'}</div>
              </div>
            </Button>
            <Separator orientation="vertical" className="h-10" />
            <Button variant="ghost" className="h-10 ">
              <div className="text-left">
                <div className="text-[15px] ">{state.trip?.endDate ? state.trip.endDate.toLocaleDateString() : 'Add date'}</div>
              </div>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <DateRangeSelector start={state.trip?.startDate} end={state.trip?.endDate} handleSave={handleSave} />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="h-10" />

      {/* Guests trigger */}
      <Popover open={guestPopoverOpen} onOpenChange={setGuestPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="rounded-r-full">
            <div className="text-left">
              <div className="text-md">
                {localGuests.numAdults + localGuests.numChildren} Guests
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            {['numAdults', 'numChildren', 'numPets'].map((type) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize">{type.replace('num', '')}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGuestChange(type as keyof typeof localGuests, false)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span>{localGuests[type as keyof typeof localGuests]}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGuestChange(type as keyof typeof localGuests, true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={handleSaveGuests} className="w-full mt-2">
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default SearchControlBar;
