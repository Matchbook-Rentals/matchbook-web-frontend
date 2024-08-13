import React from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { FilterIcon } from 'lucide-react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PriceFilter from '../(components)/PriceFilter';
import CategoryFilter from '../(components)/CategoryFilter';
import FurnitureFilter from '../(components)/FurnitureFilter';

interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
  flexibleMoveIn: boolean;
  flexibleMoveOut: boolean;
}

interface FilterOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: string | number | boolean) => void;
}

const FilterOptionsDialog: React.FC<FilterOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  filters,
  onFilterChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center rounded-lg p-2">
          <FilterIcon size={24} className="mr-2" />
          <span>Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[100vw] sm:h-[100vh] sm:m-0 p-0">
        <div className="p-6 h-full overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="flex justify-center items-center mb-6">
              <h2 className="text-3xl font-semibold">Filters</h2>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between w-2/3 mx-auto items-center">
                <div className="flex flex-col items-center">
                  <Label htmlFor="flexible-move-in" className="mb-2">Flexible move in</Label>
                  <Switch
                    id="flexible-move-in"
                    checked={filters.flexibleMoveIn}
                    onCheckedChange={(checked) => onFilterChange('flexibleMoveIn', checked)}
                    className="data-[state=checked]:bg-primaryBrand"
                  />
                  <span className="text-sm text-gray-500 mt-1">
                    {filters.flexibleMoveIn ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Label htmlFor="flexible-move-out" className="mb-2">Flexible move out</Label>
                  <Switch
                    id="flexible-move-out"
                    checked={filters.flexibleMoveOut}
                    onCheckedChange={(checked) => onFilterChange('flexibleMoveOut', checked)}
                    className="data-[state=checked]:bg-primaryBrand"
                  />
                  <span className="text-sm text-gray-500 mt-1">
                    {filters.flexibleMoveOut ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              <PriceFilter
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onFilterChange={onFilterChange}
              />

              {['bedrooms', 'beds', 'baths'].map((category) => (
                <CategoryFilter
                  key={category}
                  category={category}
                  value={filters[category as keyof FilterOptions] as string}
                  onFilterChange={onFilterChange}
                />
              ))}

              <FurnitureFilter
                furnished={filters.furnished}
                unfurnished={filters.unfurnished}
                onFilterChange={onFilterChange}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterOptionsDialog;