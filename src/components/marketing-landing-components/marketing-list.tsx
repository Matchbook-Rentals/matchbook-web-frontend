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
  brandColor: "primary" | "secondary";
}

export default function MarketingList({
  title,
  Icon,
  marketingItems,
  brandColor,
}: MarketingListProps) {

  const bgColorClass =
    brandColor === "primary" ? "bg-primaryBrand" : "bg-blueBrand";

  return (
    <div className="w-full mx-auto ">
      <div>
        <div className="flex items-end mb-1">
          <Icon className="w-[80px] h-[80px] sm:w-[80px] sm:h-[80px] md:w-[115px] md:h-[115px] mr-3" />
          <h1
            className="text-[6.2vw] xs:text-[6.6vw] md:text-[59px] leading-none  font-medium"
          >
            {title}
          </h1>
        </div>
        <div className={`${bgColorClass} mb-[-5px] sm:mb-[-10px] md:mb-[-20px]  h-[30px]`} />
      </div>
      <div className="">
        {marketingItems.map((item, index) => (
          <MarketingItem key={index} {...item} brandColor={brandColor} />
        ))}
      </div>
    </div>
  );
}
