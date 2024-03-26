'use client';
import React from 'react';
import PropertyCard from './property-card';
// Assume you have an array of properties, each with imageSrc, title, address, and status

const PropertyList = ({ properties }) => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <PropertyCard
            key={index}
            imageSrc={`https://source.unsplash.com/random/${index}`}
            title={property.title}
            address={property.address}
            status={property.status}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
