"use client";
import React, { useState } from "react";
import { ApplicationsIcon, BookingsIcon, ListingsIcon } from "@/components/icons/dashboard";
import { StarIcon } from "@/components/icons/marketing";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HelpCircleIcon } from "lucide-react";

const navTabs = [
  { name: "Applications", icon: ApplicationsIcon },
  { name: "Bookings", icon: BookingsIcon },
  { name: "Listing", icon: ListingsIcon },
  { name: "Reviews", icon: StarIcon },
];

const reviews = [
  {
    name: "Daniel Resner",
    rating: "5.0",
    responsiveness: "Very Satisfied",
    condition: "Very Satisfied",
    accuracy: "Very Satisfied",
  },
  {
    name: "Daniel Resner",
    rating: "4.0",
    responsiveness: "Somewhat Satisfied",
    condition: "Very Satisfied",
    accuracy: "Very Satisfied",
  },
  {
    name: "Daniel Resner",
    rating: "3.0",
    responsiveness: "Somewhat Satisfied",
    condition: "Neutral",
    accuracy: "Very Satisfied",
  },
];

const starRatings = [
  { stars: "5 Star", percentage: 36 },
  { stars: "4 Star", percentage: 36 },
  { stars: "3 Star", percentage: 36 },
  { stars: "2 Star", percentage: 36 },
  { stars: "1 Star", percentage: 36 },
];

import { ListingAddress } from "./listing-address";

interface PropertyDashboardClientProps {
  listing: any; // Replace 'any' with 'ListingAndImages' if available
}

export default function PropertyDashboardClient({ listing }: PropertyDashboardClientProps) {
  const [selectedTab, setSelectedTab] = useState("Reviews");

  return (
    <div className="w-full max-w-7xl mx-auto rounded-lg shadow-sm relative py-6 px-4 sm:px-8 md:px-10 bg-white min-h-screen flex flex-col items-center">
      {/* Tab Navigation and Property Info */}
      <div className="flex flex-row justify-between items-center w-full flex-wrap">
        <div className="flex flex-row items-center gap-2 sm:gap-4 md:gap-6">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab.name)}
                className={`flex flex-col items-center min-w-[48px] focus:outline-none transition-all duration-150 ${isActive ? "text-black" : "text-[#2d2f2e99]"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mb-1 ${isActive ? "scale-110" : "opacity-60"}`}>
                  <Icon className="w-full h-full" />
                </div>
                <span className="font-medium text-xs sm:text-sm md:text-base">
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-shrink-0">
          <ListingAddress propertyName={listing.title} street={listing.streetAddress1} city={listing.city} state={listing.state} zip={listing.zipCode} />
        </div>
      </div>
      <Separator className="w-full h-0.5 my-6" />

      {/* Tab Content */}
      {selectedTab === "Reviews" && (
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
            <h2 className="font-light text-2xl sm:text-3xl md:text-4xl lg:text-[46px] text-[#3f3f3f]">Reviews</h2>
            <h2 className="font-light text-2xl sm:text-3xl md:text-4xl lg:text-[46px] text-[#3f3f3f]">Overall Rating</h2>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full">
            {/* Reviews Table */}
            <div className="flex-1 min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">Guest Name</TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">Rating</TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">Responsiveness</TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">Condition</TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Listing Accuracy
                      <HelpCircleIcon className="inline-block ml-2 w-5 h-5 bg-black rounded-full text-white" size={16} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-medium text-lg sm:text-xl md:text-2xl">
                          <span className="text-black">{review.name.split(" ")[0]} </span>
                          <span className="text-[#3f3f3f]">{review.name.split(" ")[1]}</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-lg sm:text-xl md:text-2xl text-[#3f3f3f]">{review.rating}</TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">{review.responsiveness}</TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">{review.condition}</TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">{review.accuracy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Overall Rating */}
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-[350px]">
              <div className="flex items-center mb-4">
                <span className="font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[55px] text-black">2.5</span>
                <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99] ml-2">5 reviews</span>
              </div>
              {/* Star Rating Display */}
              <div className="flex mb-4 flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star, index) => (
                  <div key={index} className="w-10 h-10 sm:w-[58px] sm:h-[55px] bg-[url(/group-76.png)] bg-[100%_100%]" />
                ))}
              </div>
              {/* Star Rating Breakdown */}
              <div className="space-y-2">
                {starRatings.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium text-base sm:text-lg text-[#2d2f2e99] w-20 sm:w-[104px]">{item.stars}</span>
                    <div className="relative w-full max-w-[220px] h-4">
                      <div className="absolute w-full h-full bg-[#dfdedeab] rounded-[30px]"></div>
                      <div className="absolute h-full bg-[#ffd700] rounded-[30px]" style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedTab === "Applications" && (
        <div className="w-full py-12 flex items-center justify-center text-2xl text-gray-500">APPLICATIONS TAB</div>
      )}
      {selectedTab === "Bookings" && (
        <div className="w-full py-12 flex items-center justify-center text-2xl text-gray-500">BOOKINGS TAB</div>
      )}
      {selectedTab === "Listing" && (
        <div className="w-full py-12 flex items-center justify-center text-2xl text-gray-500">LISTING TAB</div>
      )}
      {/* Listing Status */}
      <div className="mt-8 flex flex-col items-end w-full pr-0 sm:pr-10">
        <span className="font-medium text-xl text-[#2d2f2e99] mb-1">Listing Status</span>
        <Switch className="bg-[#a3b899] data-[state=checked]:bg-[#a3b899]" />
        <span className="font-medium text-xl text-[#2d2f2e99] mt-1">Active</span>
      </div>
    </div>
  );
}
