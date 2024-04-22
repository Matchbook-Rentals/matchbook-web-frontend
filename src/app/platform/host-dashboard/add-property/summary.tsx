// components/Summary.tsx
import React from 'react';

interface PropertyDetails {
    [key: string]: string | number;  // This interface can be extended based on the property details structure
}

interface SummaryProps {
    propertyDetails: PropertyDetails;
    handleListingCreation: (Listing) => void;
}

const Summary: React.FC<SummaryProps> = ({ propertyDetails, handleListingCreation }) => {
    return (
        <div className="bg-white shadow-md rounded-lg p-5 my-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Property Details</h2>
            <ul>
                {Object.entries(propertyDetails).map(([key, value], index) => (
                    <li key={index} className="mb-2">
                        <strong className="font-medium">{key}:</strong> {value.toString()}
                    </li>
                ))}
            </ul>
        <button className='bg-primaryBrand px-5 py-2 text-2xl text-white rounded-lg' onClick={() => handleListingCreation(propertyDetails)}>NEXT</button>
        </div>
    );
};

export default Summary;
