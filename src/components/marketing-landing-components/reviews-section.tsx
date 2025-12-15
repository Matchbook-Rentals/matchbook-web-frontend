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
    <section className="relative w-full bg-[#0B6969]">
      <h2 className="sr-only">Real Reviews, Reliable Renters, Worry-Free Renting</h2>
      {/* Mobile/Tablet view - just the image */}
      <div className="block lg:hidden w-full">
        <img
          className="w-full max-w-[1000px] h-auto object-contain mx-auto"
          alt="Reviews section mobile"
          src="/marketing-images/reviews-section/2.png"
        />
      </div>

      {/* Desktop view - just the image */}
      <div className="hidden lg:block w-full">
        <img
          className="w-full h-auto object-contain"
          alt="Reviews section desktop"
          src="/marketing-images/reviews-section/3.png"
        />
      </div>
    </section>
  );
};