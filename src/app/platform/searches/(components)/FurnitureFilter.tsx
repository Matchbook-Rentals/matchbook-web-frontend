import React from 'react';
import { Button } from "@/components/ui/button"

interface FurnitureFilterProps {
  furnished: boolean;
  unfurnished: boolean;
  onFilterChange: (key: 'furnished' | 'unfurnished', value: boolean) => void;
}

const FurnitureFilter: React.FC<FurnitureFilterProps> = ({ furnished, unfurnished, onFilterChange }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">Furniture</h3>
      <div className="flex justify-center space-x-4">
        <Button
          variant={furnished ? "default" : "outline"}
          className={furnished ? "bg-primaryBrand text-black" : ""}
          onClick={() => onFilterChange('furnished', !furnished)}
        >
          Furnished
        </Button>
        <Button
          variant={unfurnished ? "default" : "outline"}
          className={unfurnished ? "bg-primaryBrand text-black" : ""}
          onClick={() => onFilterChange('unfurnished', !unfurnished)}
        >
          Unfurnished
        </Button>
      </div>
    </div>
  );
};

export default FurnitureFilter;