import { Star } from "lucide-react";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import { Card, CardContent } from "../ui/card";

export const ReviewsSection = (): JSX.Element => {
  // Review data for mapping
  const reviews = [
    {
      name: "Alina",
      avatar: "/image-2.png",
      rating: 5,
      position: "top-[234px] left-[11px] w-[324px]",
      vectorSrc: "/vector.svg",
      vectorPosition: "w-[229px] h-[220px] top-[-163px] left-[244px]",
    },
    {
      name: "Aliyana",
      avatar: "/avatar-3.png",
      rating: 5,
      position: "top-[228px] left-[632px] w-[482px]",
      vectorSrc: "/vector-3.svg",
      vectorPosition: "w-[198px] h-[183px] top-[-134px] left-[351px]",
    },
    {
      name: "Ahmed",
      avatar: "/image.png",
      rating: 4,
      position: "top-[626px] left-[632px] w-[482px]",
      vectorSrc: "/vector-1.svg",
      vectorPosition: "w-[177px] h-[194px] top-[-158px] left-[346px]",
    },
    {
      name: "John Wick",
      avatar: "/image-1.png",
      rating: 4,
      position: "top-[644px] left-0 w-[482px]",
      vectorSrc: "/vector-2.svg",
      vectorPosition: "w-56 h-[232px] top-[-171px] left-[362px]",
    },
  ];

  // Generate stars based on rating
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={`star-${index}`}
          className={`w-3.5 h-3.5 ${
            index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ));
  };

  return (
    <section className="relative w-full xl:h-[853px] bg-[#0B6969]">
      {/* Mobile/Tablet view - just the image */}
      <div className="block xl:hidden w-full">
        <img
          className="w-full max-w-[1000px] h-auto object-contain mx-auto"
          alt="Reviews section mobile"
          src="/marketing-images/reviews-section/2.png"
        />
      </div>

      {/* Desktop view - original complex layout */}
      <div className="hidden xl:block relative w-[1114px] h-[679px] top-[87px] left-[226px] overflow-visible">
        <div className="relative h-[955px] top-[-104px]">
          <img
            className="absolute h-[80%] top-10 left-[37px] scale-[]"
            alt="Background shape"
            src="/marketing-images/reviews-section/Vector.png"
          />


          {/* Main content */}
          <div className="flex flex-col w-[565px] items-center gap-4 absolute top-[370px] left-[189px]">
            <h1 className="relative self-stretch mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-[40px] text-center tracking-[-2.00px] leading-[normal]">
              Real Reviews, Reliable Renters, Worry-Free Renting
            </h1>

            <p className="relative self-stretch font-text-heading-xsmall-regular font-[number:var(--text-heading-xsmall-regular-font-weight)] text-gray-neutral600 text-[length:var(--text-heading-xsmall-regular-font-size)] text-center tracking-[var(--text-heading-xsmall-regular-letter-spacing)] leading-[var(--text-heading-xsmall-regular-line-height)] [font-style:var(--text-heading-xsmall-regular-font-style)]">
              Choose renters you can trust. Our review system gives you insight
              into their past rentals, making worry-free renting a reality.
            </p>
          </div>

          {/* Review cards */}
          {reviews.map((review, index) => (
            <Card
              key={`review-${index}`}
              className={`flex items-center gap-3 p-3 absolute ${review.position} bg-white rounded-lg overflow-hidden shadow-[0px_4px_12px_#00000026]`}
            >
              <CardContent className="flex items-center gap-3 p-0">
                <Avatar className="relative w-12 h-12 rounded-full overflow-hidden">
                  <AvatarImage
                    src={review.avatar}
                    alt={`${review.name}'s avatar`}
                    className="relative h-12 -top-px -left-px rounded-full border-[0.75px] border-solid border-[#00000014] bg-cover bg-[50%_50%]"
                  />
                  <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start">
                  <div className="inline-flex items-center gap-3">
                    <div className="relative w-fit mt-[-1.00px] font-['Poppins',Helvetica] font-medium text-gray-neutral900 text-base tracking-[0] leading-[normal]">
                      {review.name}
                    </div>

                    <div className="inline-flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>

                <img
                  className={`absolute ${review.vectorPosition}`}
                  alt="Vector"
                  src={review.vectorSrc}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};