"use client";
import React from "react";

const PropertyCard = ({ imageSrc, title, address, status, type }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white">
      <img
        className="w-full h-[250px]"
        src={imageSrc}
        alt={`Image of ${title}`}
      />
      <div className="flex ">
        <div className="px-4 py-4 flex flex-col ">
          <div className="font-bold text-xl mb-2">{title}</div>
          <p className="text-gray-700 text-base font-semibold">
            {" "}
            0 Privacy Drive
            {type}
          </p>
        </div>
        <span className=" bg-primaryBrand  ml-auto mt-auto px-2 py-1 text-sm font-semibold text-green-800 mr-2 mb-2">
          FOR RENT
        </span>
      </div>
    </div>
  );
};

export default PropertyCard;
