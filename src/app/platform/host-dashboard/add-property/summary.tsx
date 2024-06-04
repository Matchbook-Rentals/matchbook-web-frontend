// components/Summary.tsx
import React, { useEffect } from 'react';
import PropertyTypeCheckboxes from './(summary-components)/property-type-checkboxes';
import FurnishedCheckboxes from './(summary-components)/furnished-checkboxes';
import AddressInput from './(summary-components)/address-input';
import InputFields from './(summary-components)/input-fields';
import ImageDragDrop from './(image-components)/image-drag-drop';
import { ListingImage } from '@prisma/client';

interface PropertyDetails {
    locationString: string | null;
    listingImages?: ListingImage[];
    [key: string]: string | number | null | undefined | boolean | ListingImage[];  // Allowing for null or undefined to handle them explicitly
}

interface SummaryProps {
    propertyDetails: PropertyDetails;
    setPropertyDetails: (propertyDetails: PropertyDetails) => void;
    handleListingCreation: (propertyDetails: PropertyDetails) => void; // Typing the argument
    goToPrevious: () => void;
}

const Summary: React.FC<SummaryProps> = ({ propertyDetails, setPropertyDetails, handleListingCreation, goToPrevious }) => {
    const [groupingCategories, setGroupingCategories] = React.useState<string[]>([]); // Initialize state
    const [listingImages, setListingImages] = React.useState<ListingImage[]>([]);

    useEffect(() => {
        setListingImages(propertyDetails.listingImages || []);
        const initialCategories: string[] = [];
        propertyDetails.listingImages?.forEach(image => {
            if (image.category && !initialCategories.includes(image.category)) {
                initialCategories.push(image.category);
            }
        });
        setGroupingCategories(initialCategories);
    }, [propertyDetails.listingImages]);

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
            <h3 className='text-lg text-center'>Address</h3>
            <AddressInput propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <InputFields propertyDetails={propertyDetails} setPropertyDetails={setPropertyDetails} />
            <h3 className='text-lg text-center'>Photos</h3>
            {propertyDetails.listingImages && propertyDetails.listingImages.length > 0 && (
                <ImageDragDrop
                    listingImages={listingImages}
                    setListingImages={setListingImages}
                    groupingCategories={groupingCategories} // Pass state
                    setGroupingCategories={setGroupingCategories}
                />
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
