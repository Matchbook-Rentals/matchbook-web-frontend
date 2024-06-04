// components/Summary.tsx
import React from 'react';
import PropertyTypeCheckboxes from './(summary-components)/property-type-checkboxes';
import FurnishedCheckboxes from './(summary-components)/furnished-checkboxes';
import AddressInput from './(summary-components)/address-input';
import InputFields from './(summary-components)/input-fields';
import ImageGrouping from './image-grouping';

interface PropertyDetails {
    locationString: string | null;
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
            <PropertyTypeCheckboxes propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <h3 className='text-lg text-center'>Furnished?</h3>
            <FurnishedCheckboxes propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <h3 className='text-lg text-center'>Furnished?</h3>
            <AddressInput propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <InputFields propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <h3 className='text-lg text-center'>Photos</h3>
            {propertyDetails.listingImages && propertyDetails.listingImages.length > 0 && (
                <div>
                    {Array.from(new Set(propertyDetails.listingImages.map(img => img.category))).map((category, idx) => (
                        <ImageGrouping
                            key={idx}
                            listingImages={propertyDetails.listingImages.filter(img => img.category === category)}
                            onDragStart={(id) => console.log(`Drag start: ${id}`)}
                            handleDrop={(category) => console.log(`Dropped in category: ${category}`)}
                            over={{ id: '', activeHalf: '' }}
                            setOver={(over) => console.log(`Set over: ${over}`)}
                            dragging={null}
                            handleChangeCategory={(newCategory) => console.log(`Change category to: ${newCategory}`)}
                            groupingCategory={category}
                        />
                    ))}
                </div>
            )}
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
