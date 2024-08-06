import React, { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSearchContext } from '@/contexts/search-context-provider';
import LocationSuggest from './search-location-suggest';
import DateRangeSelector from '@/components/ui/custom-calendar/date-range-selector/date-range-selector';

const SearchControlBar: React.FC = () => {
  const { state, actions } = useSearchContext();

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
          <DateRangeSelector start={state.currentSearch?.startDate} end={state.currentSearch?.endDate} handleSave={actions.setSearch} />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="h-10" />

      {/* Guests trigger */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-10 px-4">
            <div className="text-left">
              <div className="text-md text-muted-foreground">2 adults</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Guests</h4>
              <p className="text-sm text-muted-foreground">
                This is a placeholder for the guests selection content.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchControlBar;