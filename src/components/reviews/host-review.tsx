'use client'
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import RatingStar from "../../components/ui/rating-star";

interface Review {
  name: string;
  memberSince: string;
  overallRating: number;
  categoryRatings: {
    category: string;
    rating: number;
  }[];
  avatarImgUrl?: string;
}

interface ReviewData {
  overallRating: number;
  totalReviews: number;
  ratingDistribution: {
    stars: number;
    percentage: number;
  }[];
  reviews: Review[];
}

interface UserRatingProps {
  data: ReviewData;
}

export const UserRating = ({ data }: UserRatingProps): JSX.Element => {
  const { overallRating, totalReviews, ratingDistribution, reviews } = data;
  const [selectedRating, setSelectedRating] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // Filter reviews based on selected rating and search term
  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating ? Math.round(review.overallRating) === selectedRating : true;
    const matchesSearch = searchTerm ? review.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesRating && matchesSearch;
  });

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
                className={`flex items-center gap-[9px] relative self-stretch w-full cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors ${
                  selectedRating === item.stars ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                }`}
                onClick={() => setSelectedRating(selectedRating === item.stars ? null : item.stars)}
              >
                <div className="w-fit mt-[-1.00px] [font-family:'Outfit',Helvetica] font-medium text-[#3f3f3f] text-[13px] leading-4 whitespace-nowrap">
                  {item.stars}
                </div>

                <div className="relative flex-1 grow h-3 bg-[#f8c69533] rounded-[28px] overflow-hidden border border-solid border-[#b5a39033]">
                  <div
                    className={`h-3 rounded-[28px] transition-colors ${
                      selectedRating === item.stars ? 'bg-blue-500' : 'bg-[#f2c628]'
                    }`}
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

        <Separator className="mb-6" />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search reviews by guest name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>


        {/* Individual Reviews Section */}
        <div className="flex flex-col items-start relative self-stretch w-full space-y-8">
          {filteredReviews.length === 0 ? (
            <div className="text-gray-500 text-center w-full py-8">
              {selectedRating && searchTerm 
                ? `No reviews found for "${searchTerm}" with ${selectedRating}-star rating.`
                : selectedRating 
                ? `No reviews found for ${selectedRating}-star rating.`
                : searchTerm
                ? `No reviews found for "${searchTerm}".`
                : "No reviews found."
              }
            </div>
          ) : (
            filteredReviews.map((review, reviewIndex) => (
            <div key={reviewIndex} className="flex flex-col items-start relative self-stretch w-full">
              {/* Review Header */}
              <div className="flex items-center gap-3 relative self-stretch w-full mb-4">
                <Avatar className="w-9 h-9">
                  <AvatarImage
                    src={review.avatarImgUrl || "/placeholderImages/image_1.jpg"}
                    alt={review.name}
                  />
                  <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start">
                  <div className="[font-family:'Outfit',Helvetica] font-semibold text-[#3f3f3f] text-[13px] leading-4">
                    {review.name}
                  </div>
                  <div className="[font-family:'Outfit',Helvetica] font-normal text-[#3f3f3f] text-[13px] leading-4">
                    {review.memberSince}
                  </div>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="mb-4">
                <div className="[font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] text-[15px] leading-5 mb-2">
                  Overall
                </div>
                <div className="inline-flex items-center gap-2">
                  {renderStars(review.overallRating)}
                </div>
              </div>

              {/* Category Ratings */}
              <div className="space-y-2 w-full">
                {review.categoryRatings.map((category, index) => (
                  <div
                    key={index}
                    className="flex justify-between [font-family:'Poppins',Helvetica] font-medium text-[#3f3f3f] text-[15px] leading-5"
                  >
                    <div>{category.category}</div>
                    <div>{category.rating} / 5.0</div>
                  </div>
                ))}
              </div>

              {/* Add separator between reviews except for the last one */}
              {reviewIndex < filteredReviews.length - 1 && <Separator className="mt-6" />}
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
