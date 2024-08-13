import React from 'react';
import FilterGrouping from './FilterGrouping';

interface FurnitureFilterProps {
  furnished: boolean;
  unfurnished: boolean;
  onFilterChange: (key: 'furnished' | 'unfurnished', value: boolean) => void;
}

const FurnitureFilter: React.FC<FurnitureFilterProps> = ({ furnished, unfurnished, onFilterChange }) => {
  const options = [
    {
      label: "Furnished",
      imageSrc: "/icon_png/furnished.png",
      checked: furnished,
      height: 144,
      width: 144,
    },
    {
      label: "Unfurnished",
      imageSrc: "/icon_png/unfurnished.png",
      checked: unfurnished,
      height: 96,
      width: 96,
    },
  ];

  const handleFilterChange = (label: string, value: boolean) => {
    onFilterChange(label.toLowerCase() as 'furnished' | 'unfurnished', value);
  };

  return (
    <FilterGrouping
      title="Furniture"
      options={options}
      onFilterChange={handleFilterChange}
    />
  );
};

export default FurnitureFilter;