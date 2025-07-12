"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LightbulbIcon, MapPinIcon, Search } from "lucide-react";
import { BrandCheckbox } from "@/app/brandCheckbox";

interface Review {
  id: number;
  name: string;
  time: string;
  rating: number;
  location: string;
  review: string;
  avatar: string;
}

interface RatingBreakdown {
  stars: number;
  percentage: number;
  count: number;
}

interface ReviewData {
  overallRating: number;
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: RatingBreakdown[];
  reviews: Review[];
}

const IndividualReview: React.FC<{ review: Review; isLast: boolean }> = ({ review, isLast }) => {
  return (
    <React.Fragment>
      <div className="flex flex-col items-end justify-center gap-[22px] w-full">
        <div className="flex items-start justify-center gap-4 w-full">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={review.avatar}
              alt={`${review.name}'s avatar`}
              className="w-full h-full object-cover"
            />
            <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-start gap-3 flex-1">
            <div className="flex-col items-start gap-2 inline-flex">
              <div className="inline-flex items-center gap-2">
                <div className="font-medium text-gray-900">
                  {review.name}
                </div>
                <div className="font-medium text-gray-600">
                  •
                </div>
                <div className="font-medium text-gray-600 whitespace-nowrap">
                  {review.time}
                </div>
              </div>

              <div className="inline-flex items-start gap-2">
                <div className="inline-flex items-center gap-[2.68px]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="font-medium text-[#696969] text-center whitespace-nowrap">
                  ({review.rating})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <MapPinIcon className="w-5 h-5 text-[#777b8b]" />
              <div className="flex-1 font-medium text-[#777b8b]">
                {review.location}
              </div>
            </div>

            <p className="w-full font-medium text-gray-700">
              {review.review}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 px-4 py-2.5 border-[#bae7cb] shadow-sm"
          >
            <LightbulbIcon className="w-6 h-6" />
            <span className="font-medium text-[#696969] whitespace-nowrap">
              Helpful
            </span>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="p-2.5 border-[#daf6ff] shadow-sm"
            >
              <span className="text-blue-500">👍</span>
            </Button>

            <Button
              variant="outline"
              className="p-2.5 border-[#ffe4e4] shadow-sm"
            >
              <span className="text-red-500">👎</span>
            </Button>
          </div>
        </div>
      </div>

      {!isLast && <Separator className="w-full h-px" />}
    </React.Fragment>
  );
};

const UserReviewsSection: React.FC<{ 
  overallRating: number; 
  averageRating: number; 
  totalReviews: number; 
  ratingBreakdown: RatingBreakdown[] 
}> = ({ overallRating, averageRating, totalReviews, ratingBreakdown }) => {

  return (
    <Card className="flex flex-col w-full items-end gap-8 max-w-[1200px] p-6 relative bg-white rounded-xl shadow-[0px_0px_5px_#00000029]">
      <h2 className="relative self-stretch mt-[-1.00px] font-medium text-gray-900 text-xl tracking-[0] leading-[30px]">
        Overall Reviews Breakdown
      </h2>

      <div className="flex items-start justify-end gap-8 relative self-stretch w-full">
        <Card className="flex flex-col w-[223px] h-[161px] items-center justify-center gap-5 px-0 py-[31px] relative bg-[#faffff] rounded-xl border border-solid border-[#e8eaef]">
          <CardContent className="p-0 flex flex-col items-center">
            <span className="relative w-fit mt-[-12.50px] font-bold text-gray-900 text-5xl text-center whitespace-nowrap">
              {overallRating}
            </span>

            <div className="inline-flex flex-col items-center justify-center gap-2 relative flex-[0_0_auto] mb-[-11.50px]">
              <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                <span className="relative w-fit mt-[-1.00px] font-medium text-[#020202] text-sm">
                  {averageRating}
                </span>

                <div className="items-center justify-center gap-[3.52px] inline-flex relative flex-[0_0_auto]">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <div
                      key={`overall-star-${index}`}
                      className="inline-flex items-center gap-[6.1px] relative flex-[0_0_auto]"
                    >
                      <span className="text-yellow-400 text-lg">★</span>
                    </div>
                  ))}
                </div>
              </div>

              <span className="relative w-fit font-medium text-[#020202] text-sm">
                ({totalReviews} reviews)
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-end justify-center gap-2.5 relative flex-1 grow">
          <div className="flex flex-col w-full items-start justify-center gap-2 relative">
            {ratingBreakdown.map((rating, index) => (
              <div
                key={`rating-${rating.stars}`}
                className="flex items-center gap-1 relative self-stretch w-full"
              >
                <div className="flex items-center gap-3 relative flex-1 grow">
                  <div className="inline-flex items-center gap-3 relative flex-[0_0_auto]">
                    <div className="inline-flex items-center justify-center gap-[3px] relative flex-[0_0_auto]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={`star-${rating.stars}-${star}`}
                          className="gap-[5.2px] inline-flex items-center relative flex-[0_0_auto]"
                        >
                          <span className={`text-lg ${star <= rating.stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="relative w-[122px] mt-[-1.00px] font-medium text-gray-600 text-sm">
                      {rating.stars} Star Rating
                    </div>
                  </div>

                  <div className="relative flex-1 self-stretch grow rounded-lg">
                    <div className="relative w-full h-2.5 top-1.5 bg-background rounded-full">
                      <Progress
                        value={rating.percentage}
                        className="h-2.5  rounded-full"
                      />
                    </div>
                  </div>

                  <div className="relative w-fit mt-[-1.00px] font-medium text-gray-700 text-sm">
                    {rating.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const OverallReviewsSection: React.FC<{ 
  reviews: Review[]; 
  isAdmin: boolean;
  useMockData: boolean;
  onMockDataToggle: (checked: boolean) => void;
}> = ({ reviews, isAdmin, useMockData, onMockDataToggle }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReviews = useMemo(() => {
    // If not using mock data, return empty array
    if (!useMockData) return [];
    
    if (!searchTerm.trim()) return reviews;
    
    return reviews.filter(review => 
      review.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reviews, searchTerm, useMockData]);

  return (
    <section className="flex flex-col items-start gap-[18px] w-full">
      <div className="flex items-center gap-6 w-full">
        <div className="w-[434px]">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="h-12 pl-10" 
                  placeholder="Search review by guest name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mock Data Toggle for Admins */}
        {isAdmin && (
          <div className="flex items-center">
            <BrandCheckbox
              checked={useMockData}
              onChange={(e) => onMockDataToggle(e.target.checked)}
              label="Use mock data"
              name="mock-data-toggle"
            />
          </div>
        )}
      </div>

      <Card className="w-full shadow-[0px_0px_5px_#00000029] flex-1 flex flex-col">
        <CardContent className="p-6 flex flex-col gap-8 flex-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-medium text-gray-900 text-xl leading-8">
              Reviews
            </h2>

            <Select defaultValue="most-recent">
              <SelectTrigger className="w-[157px] h-12 bg-white border-[#e8eaef] font-medium text-gray-700">
                <SelectValue placeholder="Most Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most-recent">Most Recent</SelectItem>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
                <SelectItem value="lowest-rated">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-start w-full flex-1">
            {filteredReviews.length === 0 ? (
              <div className="flex flex-col items-center gap-8 justify-center text-gray-500 w-full flex-1 min-h-[400px]">
                <img 
                  src="/host-dashboard/empty/reviews.png" 
                  alt="No reviews" 
                  className="w-full h-auto max-w-[260px] mb-0"
                />
                <div className="text-lg font-medium">
                  No reviews yet.
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-start gap-5 w-full">
                  {filteredReviews.map((review, index) => (
                    <IndividualReview
                      key={review.id}
                      review={review}
                      isLast={index === filteredReviews.length - 1}
                    />
                  ))}
                </div>

                <Button className="mt-5 bg-blue-100 text-blue-500 hover:bg-blue-100 hover:text-blue-500">
                  <span className="font-medium whitespace-nowrap">Load More</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export const HostReviewClient: React.FC<{ mockData: ReviewData; isAdmin: boolean }> = ({ mockData, isAdmin }) => {
  const [useMockData, setUseMockData] = useState(false);

  return (
    <div className="flex flex-col w-full items-start mx-auto gap-6">
      {useMockData && (
        <UserReviewsSection 
          overallRating={mockData.overallRating}
          averageRating={mockData.averageRating}
          totalReviews={mockData.totalReviews}
          ratingBreakdown={mockData.ratingBreakdown}
        />
      )}
      <OverallReviewsSection 
        reviews={mockData.reviews} 
        isAdmin={isAdmin}
        useMockData={useMockData}
        onMockDataToggle={setUseMockData}
      />
    </div>
  );
};