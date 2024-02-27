
'use client';
import React, { useState, Dispatch, SetStateAction } from 'react'
import { CheckboxDemo } from './custom-checkbox';
import { Check } from 'lucide-react';

interface AmenitiesSelectProps {
  handleFinish: () => void;
  goToPrev: () => void;
  setUserPreferences: Dispatch<SetStateAction<any>>; // Replace 'any' with the actual preference type you expect
}

const AmenitiesSelect: React.FC<AmenitiesSelectProps> = ({ handleFinish, goToPrev, setUserPreferences }) => {

  const initAmenities = [
    { id: 'airConditioning', label: 'Air Conditioning', isRequired: true },
    { id: 'laundryFacilities', label: 'Laundry Facilities', isRequired: false },
    { id: 'inUnitWasherAndDryer', label: 'In Unit Washer and Dryer', isRequired: false },
    { id: 'fitnessCenter', label: 'Fitness Center', isRequired: false },
    { id: 'washerAndDryerHookups', label: 'Washer and Dryer Hookups', isRequired: true },
    { id: 'pool', label: 'Pool', isRequired: false },
    { id: 'dishwasher', label: 'Dishwasher', isRequired: false },
    { id: 'elevator', label: 'Elevator', isRequired: false },
    { id: 'wheelchairAccess', label: 'Wheelchair Access', isRequired: false },
    { id: 'doorman', label: 'Doorman', isRequired: false },
    { id: 'parking', label: 'Parking', isRequired: false },
    { id: 'fireplace', label: 'Fireplace', isRequired: false },
    { id: 'wifi', label: 'Wifi', isRequired: false },
    { id: 'kitchen', label: 'Kitchen', isRequired: false },
    { id: 'washer', label: 'Washer', isRequired: false },
    { id: 'dryer', label: 'Dryer', isRequired: false },
    { id: 'dedicatedWorkspace', label: 'Dedicated Workspace', isRequired: false },
    { id: 'tv', label: 'TV', isRequired: false },
    { id: 'hairDryer', label: 'Hair Dryer', isRequired: false },
    { id: 'iron', label: 'Iron', isRequired: false },
  ];


  const [amenities, setAmenities] = useState(initAmenities);




  const handleSubmit = () => {
    console.log(amenities)
    setUserPreferences(prev => {
      return { ...prev, amenities }
    })
    handleFinish();
  }

  const handleCheck = (id: string) => {
    setAmenities(prev => {
      let tempArray = prev.map(item => {
        if (item.id !== id) return item;
        item = {...item, isRequired: !item.isRequired}
        return item
      })
      return tempArray;
    })
  }

  return (
    <>
      <h2 className=' text-center text-2xl my-10 font-semibold'>Which amenities are you interested in?</h2>
      <div className='card  grid grid-cols-2 w-full mx-auto mt-5 rounded-2xl py-5 pl-5'>
        {amenities.map((item, idx) => (
          <CheckboxDemo justifyDirection='left' label={item.label} key={item.id} isChecked={item.isRequired} details={item} handleChange={handleCheck} checkOnLeft />

        ))}
      </div>
      <div className="flex gap-2  justify-center mt-5 p-1">
        <button className='bg-primaryBrand px-5 py-2 text-2xl shadow-md shadow-slate-500 hover:shadow-none text-white  rounded-lg' onClick={goToPrev}>BACK</button>
        <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg shadow-sm hover:shadow-none shadow-black ' onClick={handleSubmit}>SUBMIT</button>
      </div>
    </>
  )
}


export default AmenitiesSelect;