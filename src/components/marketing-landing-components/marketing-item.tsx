import React from "react";

interface MarketingItemProps {
  number: number;
  title: string;
  description: string;
  brandColor: 'primary' | 'blue';
}

export default function MarketingItem({ number, title, description, brandColor }: MarketingItemProps) {
  const bgColorClass = brandColor === 'primary' ? 'bg-primaryBrand' : 'bg-blueBrand';

  return (
    <div className="flex items-center space-x-8 ml-2 space-y-4">
      <div className={`flex-shrink-0 ${bgColorClass} rounded-full w-14 h-14 flex items-center justify-center`}>
        <span className="font-semibold text-black text-2xl">{number}</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-700 font-semibold">{description}</p>
      </div>
    </div>
  );
}