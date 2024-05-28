import React, { Dispatch, SetStateAction } from 'react';
import Image from 'next/image';

interface BrandRadioOption {
  id: string;
  label: string;
  imageUrl?: string; // Made imageUrl optional
}

interface BrandRadioProps {
  options: BrandRadioOption[];
  selectedValue: string;
  setSelectedValue: Dispatch<SetStateAction<string>>;
  name: string;
  vertical?: boolean;
  radioLabel?: string; // Added optional label for the radio group
}

const BrandRadio: React.FC<BrandRadioProps> = ({
  options,
  selectedValue,
  setSelectedValue,
  name,
  vertical = false,
  radioLabel,
}) => {
  const handleSelectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  return (
    <div>
      {radioLabel && (
        <div className="text-xl text-center font-semibold mb-2 border-b border-black pb-1">
          {radioLabel}
        </div>
      )}
      <div className={`flex ${vertical ? 'flex-col' : ''} justify-between`}>
        {options.map((option) => (
          <div
            className={`flex ${vertical ? 'flex-row' : 'flex-col'} m-1 justify-evenly items-center`}
            key={option.id}
            onClick={() => setSelectedValue(option.id)}
          >
            {option.imageUrl && (
              <Image alt={option.label} src={option.imageUrl} width={100} height={100} />
            )}
            <p className='text-xl font-semibold'>{option.label}</p>
            <input
              type="radio"
              className='sr-only'
              name={name}
              value={option.id}
              checked={selectedValue === option.id}
              onChange={handleSelectionChange}
            />
            <div
              className={`w-6 h-6 rounded-full border-2 border-gray-400 ${selectedValue === option.id ? 'bg-primaryBrand' : ''}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandRadio;
