import React from "react";

// Props interface defining the required properties for the MarketingItem component
interface MarketingItemProps {
  number: number;      // The number to display in the circle
  title: string;       // The title of the marketing item
  description: string; // The description text
  brandColor: "primary" | "secondary"; // Color theme selection
}

export default function MarketingItem({
  number,
  title,
  description,
  brandColor,
}: MarketingItemProps) {
  // Determine background color class based on brandColor prop
  const bgColorClass =
    brandColor === "primary" ? "bg-primaryBrand" : "bg-blueBrand";

  return (
    <div className="">
      <h2 className="text-2xl xs:text-3xl sm:text-4xl mb-4 mt-12 font-semibold">{title}</h2>
      <p className="sm:text-lg md:text-xl ">{description}</p>
    </div>
  );
}
