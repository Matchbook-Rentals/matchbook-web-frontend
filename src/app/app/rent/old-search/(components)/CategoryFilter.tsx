import React from 'react';
import { Button } from "@/components/ui/button"

interface CategoryFilterProps {
  category: string;
  value: string;
  onFilterChange: (key: string, value: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ category, value, onFilterChange }) => {
  const options = ['Any', '1+', '2+', '3+', '4+', '5+', '6+'];

  return (
    <div className="text-center">
      <h3 className="text-lg text-left font-montserrat-medium mb-2">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={value === option ? "default" : "outline"}
            className={`rounded-full ${value === option ? "" : ""}`}
            onClick={() => onFilterChange(category, option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
