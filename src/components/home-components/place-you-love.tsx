import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { BrandHeart, BrandHeartOutline } from "../icons";

export const PlaceYouLove = (): JSX.Element => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div
            // Responsive layout: column on small screens, row on medium and up
            className="w-full flex flex-col md:flex-row bg-gradient-to-b from-white to-primaryBrand/60"
          >
            {/* Left half with text */}
            {/* Responsive width and padding */}
            <div className="w-full md:w-1/2 px-4 py-8 md:px-12 md:py-12 flex items-center justify-center order-1">
              <div className="text-center">
                {/* Responsive text size, leading, and tracking */}
                <h2 className="text-4xl sm:text-6xl lg:text-[80px] font-jakarta md:pr-6 leading-tight sm:leading-normal lg:leading-[120px] tracking-tight lg:tracking-[-1.6px] font-medium">
                  Find a place you love
                  <BrandHeartOutline fill="black" className="inline ml-2" /> {/* Added margin for spacing */}
                </h2>
                <h3 className="text-base md:text-lg mt-4"> {/* Added top margin */}
                  Explore our rental marketplace, reimagined with you in mind
                </h3>
              </div>
            </div>
            {/* Right half with image */}
            {/* Responsive width and padding */}
            <div className="w-full md:w-1/2 px-[20%] py-8 md:px-12 md:py-12 flex items-center justify-center order-2">
              <img
                alt="Find a place you love banner photo"
                src="/marketing-images/place-you-love-banner.png"
                className="w-full h-auto max-h-[400px] object-contain" // Adjusted height constraints
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
