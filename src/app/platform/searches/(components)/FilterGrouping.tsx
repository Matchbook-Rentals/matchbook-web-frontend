import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';

interface FilterOption {
  label: string;
  imageSrc: string;
  checked: boolean;
  height?: number;
  width?: number;
}

interface FilterGroupingProps {
  title: string;
  options: FilterOption[];
  onFilterChange: (label: string, value: boolean) => void;
}

const FilterGrouping: React.FC<FilterGroupingProps> = ({ title, options, onFilterChange }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex justify-center w-full space-x-8">
        {options.map((option) => (
          <FilterOption
            key={option.label}
            {...option}
            onChange={() => onFilterChange(option.label, !option.checked)}
          />
        ))}
      </div>
    </div>
  );
};

interface FilterOptionProps extends FilterOption {
  onChange: () => void;
}

const FilterOption: React.FC<FilterOptionProps> = ({ label, checked, onChange, imageSrc, height, width }) => {
  const imageSize = { width: width || 96, height: height || 96 };
  const containerSize = `w-${imageSize.width / 4} h-${imageSize.height / 4}`;

  return (
    <div className="flex flex-col items-center justify-end">
      <div
        className={`${containerSize} mb-2 cursor-pointer`}
        onClick={onChange}
      >
        <Image src={imageSrc} alt={label} width={imageSize.width} height={imageSize.height} />
      </div>
      <span className="mb-1">{label}</span>
      <Checkbox checked={checked} onCheckedChange={onChange} />
    </div>
  );
};

export default FilterGrouping;