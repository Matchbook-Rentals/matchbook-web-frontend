import React, { useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSearchContext } from '@/contexts/search-context-provider';
import LocationSuggest from './search-location-suggest';


const SearchControlBar: React.FC = () => {
  const { state, actions } = useSearchContext();

  return (
    <div className="flex items-center border rounded-md">
      {/* Destination trigger */}
      <LocationSuggest />
      {/* <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-10 px-4">
            <div className="text-left">
              <div className="text-sm font-semibold">Destination</div>
              <div className="text-xs text-muted-foreground">Where to?</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Destination</h4>
              <p className="text-sm text-muted-foreground">
                This is a placeholder for the destination selection content.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover> */}
      <Separator orientation="vertical" className="h-10" />

      {/* Date triggers */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex">
            <Button variant="ghost" className="h-10 px-2">
              <div className="text-left">
                <div className="text-sm font-semibold">Check in</div>
                <div className="text-xs text-muted-foreground">Add date</div>
              </div>
            </Button>
            <Separator orientation="vertical" className="h-10" />
            <Button variant="ghost" className="h-10 px-2">
              <div className="text-left">
                <div className="text-sm font-semibold">Check out</div>
                <div className="text-xs text-muted-foreground">Add date</div>
              </div>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Dates</h4>
              <p className="text-sm text-muted-foreground">
                This is a placeholder for the date selection content.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="h-10" />

      {/* Guests trigger */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-10 px-4">
            <div className="text-left">
              <div className="text-sm font-semibold">Guests</div>
              <div className="text-xs text-muted-foreground">2 adults</div>
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