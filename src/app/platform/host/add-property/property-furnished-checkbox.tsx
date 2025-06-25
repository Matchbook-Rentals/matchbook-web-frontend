'use client';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { CheckboxDemo } from '../../preferences/custom-checkbox';

interface PropertyFurnishedCheckboxProps {
  setPropertyDetails: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual property details type you expect
  setFurnishedValidationError: Dispatch<SetStateAction<any>>;
}

const PropertyFurnishedCheckbox: React.FC<PropertyFurnishedCheckboxProps> = ({ setPropertyDetails, setFurnishedValidationError }) => {

  const [isFurnished, setIsFurnished] = useState<boolean | null>(null);

  const handleChange = (value: boolean) => {
    setIsFurnished(value);
    setFurnishedValidationError(false);
    setPropertyDetails(prev => ({
      ...prev,
      furnished: value
    }));
  }

  return (
    <>
      <h2 className='text-center text-2xl my-10 font-semibold'></h2>
      <div className='card border border-black flex flex-col w-1/2 mx-auto mt-5 rounded-2xl p-5'>
        <CheckboxDemo justifyDirection='between' label='Furnished' isChecked={isFurnished === true} details={{ id: 'Furnished' }} handleChange={() => handleChange(true)} hasBorder />
        <CheckboxDemo justifyDirection='between' label='Unfurnished' isChecked={isFurnished === false} details={{ id: 'Unfurnished' }} handleChange={() => handleChange(false)} />
      </div>
    </>
  )
}

export default PropertyFurnishedCheckbox;
