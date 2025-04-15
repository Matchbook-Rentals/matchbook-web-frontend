import { HelpCircleIcon } from "lucide-react";
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

const PropertyDashboardPage = () => {
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
    <div className={`bg-white flex flex-row justify-center ${APP_PAGE_MARGIN}`}>
      <div className="bg-white overflow-hidden w-full max-w-[1920px] relative py-6">
        {/* Property Dashboard Title */}
        <h1 className="text-center text-[50px] font-medium text-[#3f3f3f]  mb-8">
          Property Dashboard
        </h1>

        {/* Navigation Menu */}
        <div className="flex items-end gap-12 px-10 mb-4">
          <div className="flex flex-col items-center">
            <div className="relative w-[50px] h-[74px] mb-4">
              <img
                className="w-[38px] h-[74px]"
                alt="Applications icon"
                src="/group-4.png"
              />
              <img
                className="absolute w-[17px] h-[18px] top-14 left-[33px]"
                alt="Applications icon extra"
                src="/group-5.png"
              />
            </div>
            <span className="font-medium text-3xl text-[#2d2f2e99]">
              Applications
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-[85px] h-[85px] mb-4">
              <img
                className="w-[83px] h-3.5 top-[9px] left-px absolute"
                alt="Bookings icon"
                src="/group-1.png"
              />
              <img
                className="absolute w-[85px] h-[78px] top-[7px]"
                alt="Bookings vector"
                src="/vector-2.svg"
              />
              <img
                className="absolute w-[63px] h-3.5 top-9 left-[11px]"
                alt="Bookings detail"
                src="/group-2.png"
              />
              <img
                className="absolute w-[63px] h-3.5 top-[58px] left-[11px]"
                alt="Bookings detail"
                src="/group-3.png"
              />
            </div>
            <span className="font-medium text-3xl text-[#2d2f2e99]">
              Bookings
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-[72px] h-[82px] mb-4">
              <img
                className="absolute w-11 h-8 top-[21px] left-[21px]"
                alt="Listing icon"
                src="/vector-6.svg"
              />
            </div>
            <span className="font-medium text-3xl text-[#2d2f2e99]">
              Listing
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-[73px] h-[69px] mb-4 bg-[url(/group-76-4.png)] bg-[100%_100%]" />
            <span className="font-medium text-3xl text-[#2d2f2e99]">
              Reviews
            </span>
          </div>
        </div>

        <Separator className="w-full h-0.5 my-6" />

        {/* Property Info */}
        <div className="flex justify-between px-10">
          <div className="flex-1">{/* Left side content */}</div>
          <div className="flex flex-col items-end">
            <h2 className="font-normal text-4xl text-[#3f3f3f]">
              Ogden Mountain Home
            </h2>
            <p className="font-medium text-[26px] text-[#2d2f2e99] mt-4">
              2155 Quincy Ave, Ogden UT 84401
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-10 mt-8">
          <div className="flex justify-between mb-8">
            <h2 className="font-light text-[46px] text-[#3f3f3f]">Reviews</h2>
            <h2 className="font-light text-[46px] text-[#3f3f3f]">
              Overall Rating
            </h2>
          </div>

          <div className="flex gap-16">
            {/* Reviews Table */}
            <div className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-[22px] text-[#2d2f2e99]">
                      Guest Name
                    </TableHead>
                    <TableHead className="font-medium text-[22px] text-[#2d2f2e99]">
                      Rating
                    </TableHead>
                    <TableHead className="font-medium text-[22px] text-[#2d2f2e99]">
                      Responsiveness
                    </TableHead>
                    <TableHead className="font-medium text-[22px] text-[#2d2f2e99]">
                      Condition
                    </TableHead>
                    <TableHead className="font-medium text-[22px] text-[#2d2f2e99]">
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
                        <span className="font-medium text-[28px]">
                          <span className="text-black">Daniel </span>
                          <span className="text-[#3f3f3f]">Resner</span>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-3xl text-[#3f3f3f]">
                        {review.rating}
                      </TableCell>
                      <TableCell className="font-medium text-[22px] text-[#3f3f3f] text-center">
                        {review.responsiveness}
                      </TableCell>
                      <TableCell className="font-medium text-[22px] text-[#3f3f3f] text-center">
                        {review.condition}
                      </TableCell>
                      <TableCell className="font-medium text-[22px] text-[#3f3f3f] text-center">
                        {review.accuracy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Overall Rating */}
            <div className="w-[350px]">
              <div className="flex items-center mb-4">
                <span className="font-normal text-[55px] text-black">2.5</span>
                <span className="font-medium text-4xl text-[#2d2f2e99] ml-2">
                  5 reviews
                </span>
              </div>

              {/* Star Rating Display */}
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((star, index) => (
                  <div
                    key={index}
                    className="w-[58px] h-[55px] bg-[url(/group-76.png)] bg-[100%_100%]"
                  />
                ))}
              </div>

              {/* Star Rating Breakdown */}
              <div className="space-y-2">
                {starRatings.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium text-xl text-[#2d2f2e99] w-[104px]">
                      {item.stars}
                    </span>
                    <div className="relative w-[220px] h-[18px]">
                      <div className="absolute w-full h-full bg-[#dfdedeab] rounded-[30px]"></div>
                      <div
                        className="absolute h-full bg-[#ffd700] rounded-[30px]"
                        style={{ width: `${item.percentage}px` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Listing Status */}
        <div className="absolute bottom-16 right-10 flex flex-col items-end">
          <span className="font-medium text-xl text-[#2d2f2e99] mb-1">
            Listing Status
          </span>
          <Switch className="bg-[#a3b899] data-[state=checked]:bg-[#a3b899]" />
          <span className="font-medium text-xl text-[#2d2f2e99] mt-1">
            Active
          </span>
        </div>

        {/* Save Button (positioned according to design) */}
        <Button className="absolute w-[246px] h-[79px] top-[5549px] left-[824px] bg-rgb134-154-125 rounded-[16.85px] border-[1.12px] border-solid border-[#707070] shadow-[0px_3.37px_3.37px_#00000029] font-normal text-white text-[39.3px]">
          Save
        </Button>
      </div>
    </div>
  );
};

export default PropertyDashboardPage;
