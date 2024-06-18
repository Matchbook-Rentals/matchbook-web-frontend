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
  circleOnLeft?: boolean; // Added optional prop to flip input and label
}

const BrandRadio: React.FC<BrandRadioProps> = ({
  options,
  selectedValue,
  setSelectedValue,
  name,
  vertical = false,
  radioLabel,
  circleOnLeft = false,
}) => {
  const handleSelectionChange = (id: string) => {
    setSelectedValue(id);
  };

  return (
    <div className='cursor-pointer'>
      {radioLabel && (
        <div className="text-xl text-center font-semibold mb-2 border-b pb-1">
          {radioLabel}
        </div>
      )}
      <div className={`flex ${vertical ? 'flex-col' : ''} justify-between`}>
        {options.map((option) => (
          <div
            className={`flex ${vertical ? `flex-row items-center ${circleOnLeft ? 'justify-start' : 'justify-end'}` : 'flex-col items-start'} m-1 `}
            key={option.id}
            onClick={() => handleSelectionChange(option.id)}
          >
            {option.imageUrl && (
              <Image alt={option.label} src={option.imageUrl} width={100} height={100} />
            )}
            <div className={`flex ${vertical ? 'flex-row items-center justify-end' : 'flex-col items-start mt-2'}`}>
              {circleOnLeft ? (
                <>
                  <div className='flex items-center mr-2'>
                    <input
                      type="radio"
                      className='sr-only'
                      name={name}
                      value={option.id}
                      checked={selectedValue === option.id}
                      onChange={() => handleSelectionChange(option.id)}
                    />
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-gray-400 ml-2 ${selectedValue === option.id ? 'bg-primaryBrand' : ''}`}
                    ></div>
                  </div>
                  <p className='text-xl font-semibold'>{option.label}</p>
                </>
              ) : (
                <>
                  <p className='text-xl font-semibold'>{option.label}</p>
                  <div className='flex items-center ml-2'>
                    <input
                      type="radio"
                      className='sr-only'
                      name={name}
                      value={option.id}
                      checked={selectedValue === option.id}
                      onChange={() => handleSelectionChange(option.id)}
                    />
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-gray-400 ml-2 ${selectedValue === option.id ? 'bg-primaryBrand' : ''}`}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandRadio;
