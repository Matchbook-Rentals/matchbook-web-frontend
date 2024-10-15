import React from "react";
import MarketingItem from "./marketing-item";

interface MarketingItem {
  number: number;
  title: string;
  description: string;
}

interface MarketingListProps {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  marketingItems: MarketingItem[];
  brandColor: 'primary' | 'secondary';
}

export default function MarketingList({ title, Icon, marketingItems, brandColor }: MarketingListProps) {
  const bgColorClass = brandColor === 'primary' ? 'bg-primaryBrand' : 'bg-blueBrand';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-2 ">
      <div className="flex items-center justify-start space-x-4 ">
        <Icon className="h-20 w-20" />
        <div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl z-10 font-semibold" style={{ position: 'relative', top: '-50%', left: '' }}>{title}</h1>
          <div className={`${bgColorClass} transform -translate-y-2/3 -translate-x-[2%] w-[110%] h-[30px]`}>
          </div>
        </div>
      </div>
      <div className="" >
        {marketingItems.map((item, index) => (
          <MarketingItem key={index} {...item} brandColor={brandColor} />
        ))}
      </div>
    </div>
  )
}
