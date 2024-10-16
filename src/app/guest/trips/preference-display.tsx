"use client";
import React from "react";

export default function PrefereceDisplay() {
  let userPreferences = JSON.parse(
    localStorage.getItem("matchbookUserPreferences") as string,
  );

  return (
    <div className="p-2 text-lg">
      {Object.entries(userPreferences)?.map(([key, value], index) => {
        if (key === "amenities") return null;
        return (
          <p
            key={index}
          >{`${key}: ${Array.isArray(value) ? value.join(", ") : value}`}</p>
        );
      })}
      {userPreferences?.amenities.map((amenity) => (
        <p key={amenity.id}>
          {amenity.label}: {amenity.isRequired.toString()}
        </p>
      ))}
    </div>
  );
}
