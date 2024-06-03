// components/Summary.tsx
import React from 'react';
import { CheckboxDemo } from '../../preferences/custom-checkbox';

interface PropertyDetails {
    [key: string]: string | number | null | undefined | boolean;  // Allowing for null or undefined to handle them explicitly
}

interface SummaryProps {
    propertyDetails: PropertyDetails;
    setPropertyDetails: (propertyDetails: PropertyDetails) => void;
    handleListingCreation: (propertyDetails: PropertyDetails) => void; // Typing the argument
    goToPrevious: () => void;
}

const Summary: React.FC<SummaryProps> = ({ propertyDetails, setPropertyDetails, handleListingCreation, goToPrevious }) => {
    // Check if propertyDetails is empty
    const isEmpty = Object.keys(propertyDetails).length === 0;

    // Function to handle outputting values with checks
    const renderValue = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-500">Not specified</span>;
        }
        return value.toString();
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-5 my-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Property Details</h2>
            <h3 className='text-lg text-center'>Property Type</h3>
            <div className="flex scale-75  w-full">
                <CheckboxDemo label="Single Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'single_family' })} isChecked={propertyDetails.category === 'single_family'} details={{ id: 'singleFamily' }} />
                <CheckboxDemo label="Multi Family" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'multi_family' })} isChecked={propertyDetails.category === 'multi_family'} details={{ id: 'multiFamily' }} />
                <CheckboxDemo label="Townhouse" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'townhouse' })} isChecked={propertyDetails.category === 'townhouse'} details={{ id: 'townhouse' }} />
                <CheckboxDemo label="Apartment" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'apartment' })} isChecked={propertyDetails.category === 'apartment'} details={{ id: 'apartment' }} />
                <CheckboxDemo label="Single Room" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, category: 'single_room' })} isChecked={propertyDetails.category === 'single_room'} details={{ id: 'singleRoom' }} />
            </div>
            <h3 className='text-lg text-center'>Furnished?</h3>
            <div className="flex scale-75 justify-center  w-full">
                <CheckboxDemo label="Furnished" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, furnished: !propertyDetails.furnished })} isChecked={propertyDetails.furnished} details={{ id: 'apartment' }} />
                <CheckboxDemo label="Unfurnished" checkOnLeft handleChange={() => setPropertyDetails({ ...propertyDetails, furnished: !propertyDetails.furnished })} isChecked={!propertyDetails.furnished} details={{ id: 'singleRoom' }} />
            </div>
            {isEmpty ? (
                <p className="text-gray-500">No property details available.</p>
            ) : (
                <ul>
                    {Object.entries(propertyDetails).map(([key, value], index) => (
                        <li key={index} className="mb-2">
                            <strong className="font-medium">{key}:</strong> {renderValue(value)}
                        </li>
                    ))}
                </ul>
            )}
            <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={goToPrevious}>Previous</button>
            <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={() => handleListingCreation(propertyDetails)}>NEXT</button>
        </div>
    );
};

export default Summary;
