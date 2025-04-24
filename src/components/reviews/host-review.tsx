
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import RatingStar from "../../components/ui/rating-star";

interface UserRatingProps {
  avatarImgUrl?: string;
}

export const UserRating = ({ avatarImgUrl }: UserRatingProps): JSX.Element => {
  // Rating data
  const overallRating = 4.5;
  const totalReviews = 434;
  const ratingDistribution = [
    { stars: 5, percentage: 82 },
    { stars: 4, percentage: 10 },
    { stars: 3, percentage: 4 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 3 },
  ];

  // User review data
  const userReview = {
    name: "Alaric Voss",
    memberSince: "On Matchbook since 2021",
    overallRating: 5,
    categoryRatings: [
      { category: "Listing Accuracy and Value", rating: 4.0 },
      { category: "Responsiveness and Maintenance", rating: 4.0 },
      { category: "Privacy and Safety", rating: 4.0 },
    ],
  };

  // Helper function to render stars using RatingStar component
  const renderStars = (rating: number, size = 24) => {
    return (
      <div className="flex items-center gap-1">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <RatingStar 
              key={index} 
              rating={index < rating ? 5 : (index === Math.floor(rating) && rating % 1 !== 0 ? 3 : 1)} 
              size={size}
            />
          ))}
      </div>
    );
  };

  return (
    <Card className="flex flex-col w-full max-w-[1347px] items-start border-none">
      <CardContent className="p-0 w-full">
        {/* Rating Summary Section */}
        <div className="flex items-start gap-7 px-0 py-9 relative self-stretch w-full">
          {/* Left Column - Overall Rating */}
          <div className="flex flex-col items-start gap-2 relative flex-1 grow">
            <div className="inline-flex items-baseline gap-1 relative">
              <div className="mt-[-1.00px] text-[34px] tracking-[-0.68px] leading-10 [font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] whitespace-nowrap">
                {overallRating}
              </div>

              <div className="text-[28px] tracking-[-0.56px] leading-8 [font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] whitespace-nowrap">
                / 5.0
              </div>
            </div>

            <div className="inline-flex items-center gap-2 relative">
              {renderStars(overallRating)}
            </div>

            <div className="[font-family:'Poppins',Helvetica] font-normal text-[#3f3f3f] text-[13px] leading-4 whitespace-nowrap">
              {totalReviews} reviews
            </div>
          </div>

          {/* Right Column - Rating Distribution */}
          <div className="flex flex-col items-start gap-2 relative flex-1 grow">
            {ratingDistribution.map((item) => (
              <div
                key={item.stars}
                className="flex items-center gap-[9px] relative self-stretch w-full"
              >
                <div className="w-fit mt-[-1.00px] [font-family:'Outfit',Helvetica] font-medium text-[#3f3f3f] text-[13px] leading-4 whitespace-nowrap">
                  {item.stars}
                </div>

                <div className="relative flex-1 grow h-3 bg-[#f8c69533] rounded-[28px] overflow-hidden border border-solid border-[#b5a39033]">
                  <div
                    className="h-3 bg-[#f2c628]"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="w-fit mt-[-1.00px] [font-family:'Outfit',Helvetica] font-medium text-[#3f3f3f] text-[13px] leading-4 whitespace-nowrap">
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Review Section */}
        <div className="flex flex-col items-start relative self-stretch w-full">
          {/* User Review Header */}
          <div className="flex flex-col h-[252px] items-start gap-3 px-0 py-[18px] relative self-stretch w-full">
            <div className="flex items-center gap-3 relative self-stretch w-full">
              <Avatar className="w-9 h-9">
                <AvatarImage
                  src={avatarImgUrl || "/placeholderImages/image_1.jpg"}
                  alt={userReview.name}
                />
                <AvatarFallback>{userReview.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col w-[248px] items-start">
                <div className="self-stretch mt-[-1.00px] [font-family:'Outfit',Helvetica] font-semibold text-[#3f3f3f] text-[13px] leading-4">
                  {userReview.name}
                </div>

                <div className="self-stretch [font-family:'Outfit',Helvetica] font-normal text-[#3f3f3f] text-[13px] leading-4">
                  {userReview.memberSince}
                </div>
              </div>
            </div>

            <div className="self-stretch [font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] text-[15px] leading-5">
              Overall
            </div>

            <div className="inline-flex items-center gap-2 relative">
              {renderStars(userReview.overallRating)}
            </div>

            {userReview.categoryRatings.map((category, index) => (
              <div
                key={index}
                className="self-stretch flex justify-between [font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] text-[15px] leading-5"
              >
                <div>
                {category.category}
                </div>
                {Array(40 - category.category.length)
                  .fill("\u00A0")
                  .join("")}
                <div>
                {category.rating} / 5.0
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
