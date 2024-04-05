"use client";
import React from "react";
import PropertyCard from "./property-card";
// Assume you have an array of properties, each with imageSrc, title, address, and status

const PropertyList = ({ properties }) => {
  return (
    <div className="flex justify-center mx-auto px-6 py-8 border">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-2 lg:gap-5 border">
        {properties.map((property, index) => (
          <PropertyCard
            key={index}
            imageSrc={`https://source.unsplash.com/random/${index}`}
            title={property.title}
            address={property.address}
            status={property.status}
            type={property.type}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
