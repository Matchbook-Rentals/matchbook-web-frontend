import React from "react";
import Image from "next/image";
import { BrandButton } from "../../components/ui/brandButton";
import { Card, CardContent } from "../../components/ui/card";

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
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              className="object-cover object-[50%_25%]"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={85}
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
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    quality={85}
                  />
                </div>
              ))}
            </div>
            
            {/* Show only second image between md and lg */}
            <div className="w-full md:w-full lg:flex-1 relative h-[189px] overflow-hidden rounded-2xl hidden md:block lg:hidden">
              <Image
                src={images[2].src}
                alt={images[2].alt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
              />
            </div>
            
            {/* Show both images at lg and above */}
            <div className="hidden lg:flex lg:flex-row lg:gap-6 lg:w-full">
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="flex-1 relative h-[189px] overflow-hidden rounded-2xl"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    quality={85}
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
            <BrandButton 
              size="xl"
              className="w-auto"
              href="/hosts"
            >
              Learn More
            </BrandButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
