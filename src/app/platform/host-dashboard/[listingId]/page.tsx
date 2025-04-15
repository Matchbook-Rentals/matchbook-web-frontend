import { HelpCircleIcon } from "lucide-react";
import { ApplicationsIcon, BookingsIcon, ListingsIcon } from "@/components/icons/dashboard";
import { StarIcon } from "@/components/icons/marketing";
import React from "react";
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

import { APP_PAGE_MARGIN } from "@/constants/styles";

import PropertyDashboardClient from "./property-dashboard-client";

const PropertyDashboardPage = () => {
  return <PropertyDashboardClient />;

  // Navigation menu items
  const navItems = [
    { name: "Applications", icon: "/group-4.png", iconExtra: "/group-5.png" },
    { name: "Bookings", icon: "/group-1.png", vector: "/vector-2.svg" },
    { name: "Listing", icon: "/vector-6.svg" },
    { name: "Reviews", icon: "/group-76-4.png" },
  ];

  // Review data
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
    {
      name: "Daniel Resner",
      rating: "2.0",
      responsiveness: "Very Satisfied",
      condition: "Unsatisfied",
      accuracy: "Very Satisfied",
    },
    {
      name: "Daniel Resner",
      rating: "1.0",
      responsiveness: "Unsatisfied",
      condition: "Very Satisfied",
      accuracy: "Very Satisfied",
    },
  ];

  // Star rating data
  const starRatings = [
    { stars: "5 Star", percentage: 36 },
    { stars: "4 Star", percentage: 36 },
    { stars: "3 Star", percentage: 36 },
    { stars: "2 Star", percentage: 36 },
    { stars: "1 Star", percentage: 36 },
  ];

  return (
    <div className={`bg-white min-h-screen w-full flex flex-col items-center ${APP_PAGE_MARGIN}`}>
      <div className="bg-white w-full max-w-7xl mx-auto rounded-lg shadow-sm relative py-6 px-4 sm:px-8 md:px-10 overflow-hidden">
        {/* Property Dashboard Title */}
        <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-medium text-[#3f3f3f] mb-8">
          Property Dashboard
        </h1>

        {/* Navigation Menu */}
        <div className="flex flex-wrap items-end gap-6 sm:gap-10 md:gap-12 px-2 sm:px-6 md:px-10 mb-4 w-full justify-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-16 sm:w-[50px] sm:h-[74px] mb-4">
  <ApplicationsIcon  />
</div>
            <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99]">
              Applications
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 sm:w-[85px] sm:h-[85px] mb-4">
  <BookingsIcon className="w-16 h-16 sm:w-[83px] sm:h-[78px]" />
</div>
            <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99]">
              Bookings
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 sm:w-[72px] sm:h-[82px] mb-4">
              <ListingsIcon className="w-16 h-16 sm:w-[72px] sm:h-[82px]" />
            </div>
            <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99]">
              Listing
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 sm:w-[73px] sm:h-[69px] mb-4">
  <StarIcon className="w-11 h-8"  />
</div>
            <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99]">
              Reviews
            </span>
          </div>
        </div>

        <Separator className="w-full h-0.5 my-6" />

        {/* Property Info */}
        <div className="flex flex-col md:flex-row justify-between gap-4 px-2 sm:px-6 md:px-10 w-full">
          <div className="flex-1">{/* Left side content */}</div>
          <div className="flex flex-col items-end">
            <h2 className="font-normal text-2xl sm:text-3xl md:text-4xl text-[#3f3f3f]">
              Ogden Mountain Home
            </h2>
            <p className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99] mt-2 md:mt-4">
              2155 Quincy Ave, Ogden UT 84401
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-2 sm:px-6 md:px-10 mt-8 w-full">
          <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
            <h2 className="font-light text-[46px] text-[#3f3f3f]">Reviews</h2>
            <h2 className="font-light text-[46px] text-[#3f3f3f]">
              Overall Rating
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full">
            {/* Reviews Table */}
            <div className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Guest Name
                    </TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Rating
                    </TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Responsiveness
                    </TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Condition
                    </TableHead>
                    <TableHead className="font-medium text-base sm:text-lg md:text-xl text-[#2d2f2e99]">
                      Listing Accuracy
                      <HelpCircleIcon
                        className="inline-block ml-2 w-5 h-5 bg-black rounded-full text-white"
                        size={16}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-medium text-lg sm:text-xl md:text-2xl">
                          <span className="text-black">Daniel </span>
                          <span className="text-[#3f3f3f]">Resner</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-lg sm:text-xl md:text-2xl text-[#3f3f3f]">
                        {review.rating}
                      </TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">
                        {review.responsiveness}
                      </TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">
                        {review.condition}
                      </TableCell>
                      <TableCell className="font-medium text-base sm:text-lg md:text-xl text-[#3f3f3f] text-center">
                        {review.accuracy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Overall Rating */}
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-[350px]">
              <div className="flex items-center mb-4">
                <span className="font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[55px] text-black">2.5</span>
                <span className="font-medium text-lg sm:text-xl md:text-2xl text-[#2d2f2e99] ml-2">
                  5 reviews
                </span>
              </div>

              {/* Star Rating Display */}
              <div className="flex mb-4 flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 sm:w-[58px] sm:h-[55px] bg-[url(/group-76.png)] bg-[100%_100%]"
                  />
                ))}
              </div>

              {/* Star Rating Breakdown */}
              <div className="space-y-2">
                {starRatings.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium text-base sm:text-lg text-[#2d2f2e99] w-20 sm:w-[104px]">
                      {item.stars}
                    </span>
                    <div className="relative w-full max-w-[220px] h-4">
                      <div className="absolute w-full h-full bg-[#dfdedeab] rounded-[30px]"></div>
                      <div
                        className="absolute h-full bg-[#ffd700] rounded-[30px]"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Listing Status */}
        <div className="mt-8 flex flex-col items-end w-full pr-0 sm:pr-10">
          <span className="font-medium text-xl text-[#2d2f2e99] mb-1">
            Listing Status
          </span>
          <Switch className="bg-[#a3b899] data-[state=checked]:bg-[#a3b899]" />
          <span className="font-medium text-xl text-[#2d2f2e99] mt-1">
            Active
          </span>
        </div>

        {/* Save Button (positioned according to design) */}
        <Button className="w-full sm:w-[246px] h-16 sm:h-[79px] mt-8 bg-rgb134-154-125 rounded-lg border border-solid border-[#707070] shadow font-normal text-white text-xl sm:text-3xl">
          Save
        </Button>
      </div>
    </div>
  );
};

export default PropertyDashboardPage;
