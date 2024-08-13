import React from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilterIcon } from 'lucide-react';
import { X } from "lucide-react"

interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  beds: string;
  baths: string;
  furnished: boolean;
  unfurnished: boolean;
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
          <span >Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[100vw] sm:h-[100vh] sm:m-0 p-0">
        <div className="p-6 h-full overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="flex justify-center items-center mb-6">
              <h2 className="text-3xl font-semibold">Filters</h2>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Price</h3>
                <div className="flex items-center space-x-4 justify-center">
                  <div>
                    <Label htmlFor="minPrice">Minimum</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => onFilterChange('minPrice', Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPrice">Maximum</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {['bedrooms', 'beds', 'baths'].map((category) => (
                <div key={category} className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Any', '1+', '2+', '3+', '4+', '5+', '6+'].map((option) => (
                      <Button
                        key={option}
                        variant={filters[category as keyof FilterOptions] === option ? "default" : "outline"}
                        className={`rounded-full ${filters[category as keyof FilterOptions] === option ? "" : ""}`}
                        onClick={() => onFilterChange(category as keyof FilterOptions, option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Furniture</h3>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant={filters.furnished ? "default" : "outline"}
                    className={filters.furnished ? "bg-primaryBrand text-black" : ""}
                    onClick={() => onFilterChange('furnished', !filters.furnished)}
                  >
                    Furnished
                  </Button>
                  <Button
                    variant={filters.unfurnished ? "default" : "outline"}
                    className={filters.unfurnished ? "bg-primaryBrand text-black" : ""}
                    onClick={() => onFilterChange('unfurnished', !filters.unfurnished)}
                  >
                    Unfurnished
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterOptionsDialog;