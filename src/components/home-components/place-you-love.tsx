import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { BrandHeart, BrandHeartOutline } from "../icons";

export const PlaceYouLove = (): JSX.Element => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className="w-full h-[450px] flex bg-gradient-to-b from-white to-primaryBrand/60"
          >
            {/* Left half with text */}
            <div className="w-1/2 px-12 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-[80px] font-jakarta pr-6 leading-[120px] tracking-[-1.6px] font-medium">
                  Find a place you love
                  <BrandHeartOutline fill="black" className="inline" />
                </h2>
                <h3 className="text-lg">
                  Explore our rental marketplace, reimagined with you in mind
                </h3>
              </div>
            </div>
            {/* Right half with image */}
            <div className="w-1/2 px-12 text-[32px]  flex items-center justify-center">
              <img
                alt="Find a place you love banner photo"
                src="/marketing-images/place-you-love-banner.png"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
