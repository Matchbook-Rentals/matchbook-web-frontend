import React from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  onFilterChange: (key: 'minPrice' | 'maxPrice', value: number) => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({ minPrice, maxPrice, onFilterChange }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">Price</h3>
      <div className="flex items-center space-x-4 justify-center">
        <div>
          <Label htmlFor="minPrice">Minimum</Label>
          <Input
            id="minPrice"
            type="number"
            value={minPrice}
            onChange={(e) => onFilterChange('minPrice', Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="maxPrice">Maximum</Label>
          <Input
            id="maxPrice"
            type="number"
            value={maxPrice}
            onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;