// components/Summary.tsx
import React from 'react';

interface PropertyDetails {
    [key: string]: string | number | null | undefined;  // Allowing for null or undefined to handle them explicitly
}

interface SummaryProps {
    propertyDetails: PropertyDetails;
    handleListingCreation: (propertyDetails: PropertyDetails) => void; // Typing the argument
    goToPrevious: () => void;
}

const Summary: React.FC<SummaryProps> = ({ propertyDetails, handleListingCreation, goToPrevious }) => {
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
