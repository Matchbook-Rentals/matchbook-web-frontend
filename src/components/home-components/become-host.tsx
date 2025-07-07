import React from "react";
import { BrandButton } from "../../components/ui/brandButton";
import { Card, CardContent } from "../../components/ui/card";
import Link from "next/link";

export const BecomeHostCopy = (): JSX.Element => {

  // Image data for mapping
  const images = [
    {
      id: "main",
      src: "/marketing-images/become-host/1.png",
      alt: "People viewing a property",
      className: "w-full h-full object-cover object-[50%_25%]",
      containerClass: "relative w-full h-[189px] overflow-hidden rounded-2xl",
    },
    {
      id: "left",
      src: "/marketing-images/become-host/3.png",
      alt: "House exterior",
      className: "w-full h-full object-cover object-center",
      containerClass: "relative md:flex-1 h-[189px] overflow-hidden rounded-2xl",
    },
    {
      id: "right",
      src: "/marketing-images/become-host/2.png",
      alt: "House exterior",
      className: "w-full h-full object-cover object-center",
      containerClass: "relative md:flex-1 h-[189px] overflow-hidden rounded-2xl",
    },
  ];

  return (
    <Card className="flex items-center gap-8 px-6 md:px-[73px] py-6 bg-[#e7f0f0] rounded-none overflow-hidden border-none w-full">
      <CardContent className="flex flex-col md:flex-row items-center gap-8 p-0 w-full">
        <div className="flex flex-col items-start gap-6 flex-1 w-full">
          <div className={images[0].containerClass}>
            <img
              className={images[0].className}
              alt={images[0].alt}
              src={images[0].src}
            />
          </div>

          <div className="flex flex-col md:flex-row lg:flex-row items-center gap-6 w-full">
            {/* Show all three images on mobile, two on medium screens, two on large screens */}
            <div className="flex flex-col sm:flex-row gap-6 w-full md:hidden">
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="flex-1 relative h-[189px] overflow-hidden rounded-2xl"
                >
                  <img
                    className={image.className}
                    alt={image.alt}
                    src={image.src}
                  />
                </div>
              ))}
            </div>
            
            {/* Show only second image between md and lg */}
            <div className="w-full md:w-full lg:flex-1 relative h-[189px] overflow-hidden rounded-2xl hidden md:block lg:hidden">
              <img
                className="w-full h-full object-cover object-center"
                alt={images[2].alt}
                src={images[2].src}
              />
            </div>
            
            {/* Show both images at lg and above */}
            <div className="hidden lg:flex lg:flex-row lg:gap-6 lg:w-full">
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="flex-1 relative h-[189px] overflow-hidden rounded-2xl"
                >
                  <img
                    className={image.className}
                    alt={image.alt}
                    src={image.src}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full md:w-[460px] items-start gap-8">
          <div className="flex flex-col items-start gap-2 w-full">
            <h2 className="w-full mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-900 text-2xl md:text-[40px] leading-normal text-center md:text-left">
              Interested in Becoming a Host?
            </h2>
            <p className="w-full font-text-label-large-medium font-[500] text-gray-600 text-base md:text-[18px] leading-normal text-center md:text-left">
              Check out what we have to offer
            </p>
          </div>

          <div className="w-full flex justify-center md:justify-start">
            <Link href="/hosts">
              <BrandButton 
                size="xl"
                className="w-auto"
              >
                Learn More
              </BrandButton>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
