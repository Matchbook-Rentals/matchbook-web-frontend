import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';

interface FurnitureFilterProps {
  furnished: boolean;
  unfurnished: boolean;
  onFilterChange: (key: 'furnished' | 'unfurnished', value: boolean) => void;
}

const FurnitureFilter: React.FC<FurnitureFilterProps> = ({ furnished, unfurnished, onFilterChange }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-4">Furniture</h3>
      <div className="flex justify-center space-x-8">
        <FurnitureOption
          label="Furnished"
          checked={furnished}
          onChange={() => onFilterChange('furnished', !furnished)}
          imageSrc="/icon_png/furnished.png"
          large={true}
        />
        <FurnitureOption
          label="Unfurnished"
          checked={unfurnished}
          onChange={() => onFilterChange('unfurnished', !unfurnished)}
          imageSrc="/icon_png/unfurnished.png"
          large={false}
        />
      </div>
    </div>
  );
};

interface FurnitureOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  imageSrc: string;
  large?: boolean;
}

const FurnitureOption: React.FC<FurnitureOptionProps> = ({ label, checked, onChange, imageSrc, large = false }) => {
  const imageSize = large ? 144 : 96;
  const containerSize = large ? 'w-36 h-24' : 'w-24 h-24';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${containerSize} mb-2 cursor-pointer`}
        onClick={onChange}
      >
        <Image src={imageSrc} alt={label} width={imageSize} height={imageSize} />
      </div>
      <span className="mb-1">{label}</span>
      <Checkbox checked={checked} onCheckedChange={onChange} />
    </div>
  );
};

export default FurnitureFilter;