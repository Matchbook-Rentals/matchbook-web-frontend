'use client';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { CheckboxDemo } from '../../preferences/custom-checkbox';

interface PropertyFurnishedCheckboxProps {
  setPropertyDetails: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual property details type you expect
}

const PropertyFurnishedCheckbox: React.FC<PropertyFurnishedCheckboxProps> = ({ setPropertyDetails }) => {

  const [isFurnished, setIsFurnished] = useState<string>(); // Assuming string type to match 'Furnished' or 'Unfurnished'

  const handleChange = (value: string) => {
    setIsFurnished(value);
    setPropertyDetails(prev => ({
      ...prev,
      furnished: value === 'Furnished'
    }));
  }

  return (
    <>
      <h2 className='text-center text-2xl my-10 font-semibold'></h2>
      <div className='card border border-black flex flex-col w-1/2 mx-auto mt-5 rounded-2xl p-5'>
        <CheckboxDemo justifyDirection='between' label='Furnished' isChecked={isFurnished === 'Furnished'} details={{ id: 'Furnished' }} handleChange={() => handleChange('Furnished')} hasBorder />
        <CheckboxDemo justifyDirection='between' label='Unfurnished' isChecked={isFurnished === 'Unfurnished'} details={{ id: 'Unfurnished' }} handleChange={() => handleChange('Unfurnished')} />
      </div>
    </>
  )
}

export default PropertyFurnishedCheckbox;
