import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SearchControlBar: React.FC = () => {
  return (
    <div className="flex items-center border rounded-md">
      <SearchPopover label="Destination" placeholder="Where to?" />
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
      <SearchPopover label="Guests" placeholder="2 adults" />
    </div>
  );
};

interface SearchPopoverProps {
  label: string;
  placeholder: string;
}

const SearchPopover: React.FC<SearchPopoverProps> = ({ label, placeholder }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-10 px-4">
          <div className="text-left">
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground">{placeholder}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{label}</h4>
            <p className="text-sm text-muted-foreground">
              This is a placeholder for the {label.toLowerCase()} selection content.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchControlBar;