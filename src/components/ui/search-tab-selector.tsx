import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchTabSelectorProps {
  activeValue?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const SearchTabSelector = ({
  activeValue,
  defaultValue = "all-listings",
  onValueChange,
  className = ""
}: SearchTabSelectorProps): JSX.Element => {
  const tabOptions = [
    { id: "allListings", label: "All Listings" },
    { id: "recommended", label: "Recommended" },
    { id: "favorites", label: "Favorites" },
    { id: "matchbook", label: "Matches" },
  ];

  return (
    <Tabs 
      value={activeValue} 
      defaultValue={defaultValue} 
      className={`w-full sm:w-fit mt-4 ${className}`}
      onValueChange={onValueChange}
    >
      <TabsList className="bg-background p-1 rounded-md flex gap-1 w-full sm:w-auto">
        {tabOptions.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="h-[38px] px-2 sm:px-4 py-2 rounded-md flex-1 sm:flex-none data-[state=active]:bg-[#f1f8f8] data-[state=active]:border data-[state=active]:border-solid data-[state=active]:border-[#0b6969] data-[state=active]:text-[#0b6969] data-[state=active]:font-medium data-[state=inactive]:text-[#717680] data-[state=inactive]:font-normal text-[clamp(10px,2.5vw,14px)] sm:text-[14px]"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
