import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSearchContext } from '@/contexts/search-context-provider';
import LocationSuggest from './search-location-suggest';
import DateRangeSelector from '@/components/ui/custom-calendar/date-range-selector/date-range-selector';
import { updateTrip } from '@/app/actions/trips';
import { Plus, Minus } from 'lucide-react';

const SearchControlBar: React.FC = () => {
  const { state, actions } = useSearchContext();
  const [localGuests, setLocalGuests] = useState({
    numAdults: state.currentSearch?.numAdults || 1,
    numChildren: state.currentSearch?.numChildren || 0,
    numPets: state.currentSearch?.numPets || 0,
  });

  const handleSave = (newStartDate: Date, newEndDate: Date) => {
    let newSearch = state.currentSearch;
    if (newSearch) {
      newSearch.startDate = newStartDate;
      newSearch.endDate = newEndDate;
    }
    actions.setCurrentSearch(prev => ({ ...prev, ...newSearch }));
    updateTrip(newSearch);
  }

  const handleSaveGuests = () => {
    let newSearch = state.currentSearch;
    if (newSearch) {
      newSearch.numAdults = localGuests.numAdults;
      newSearch.numChildren = localGuests.numChildren;
      newSearch.numPets = localGuests.numPets;
    }
    actions.setCurrentSearch(prev => ({ ...prev, ...newSearch }));
    updateTrip(newSearch);
  };

  const handleGuestChange = (type: 'numAdults' | 'numChildren' | 'numPets', increment: boolean) => {
    setLocalGuests(prev => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1)
    }));
  };

  return (
    <div className="flex justify-between items-center border-2 shadow-lg rounded-md">
      {/* Destination trigger */}
      <LocationSuggest />
      <Separator orientation="vertical" className="h-10" />
      {/* Date triggers */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex gap-x-1 px-2">
            <Button variant="ghost" className="h-10 px-2">
              <div className="text-left">
                <div className="text-md text-muted-foreground">{state.currentSearch?.startDate ? state.currentSearch.startDate.toLocaleDateString() : 'Add date'}</div>
              </div>
            </Button>
            <Separator orientation="vertical" className="h-10" />
            <Button variant="ghost" className="h-10 px-2">
              <div className="text-left">
                <div className="text-md text-muted-foreground">{state.currentSearch?.endDate ? state.currentSearch.endDate.toLocaleDateString() : 'Add date'}</div>
              </div>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <DateRangeSelector start={state.currentSearch?.startDate} end={state.currentSearch?.endDate} handleSave={handleSave} />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="h-10" />

      {/* Guests trigger */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-10 px-4">
            <div className="text-left">
              <div className="text-md text-muted-foreground">
                {localGuests.numAdults} adults, {localGuests.numChildren} children, {localGuests.numPets} pets
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