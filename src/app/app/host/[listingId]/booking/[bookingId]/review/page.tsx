"use client";

import { StarIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BrandButton } from "@/components/ui/brandButton";
import { createHostReview, getExistingHostReview } from "./_actions";
import { useRouter } from "next/navigation";

interface ReviewPageProps {
  params: {
    listingId: string;
    bookingId: string;
  };
}

export default function HostReviewPage({ params }: ReviewPageProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const stars = Array.from({ length: 5 }, (_, index) => index + 1);

  useEffect(() => {
    const loadExistingReview = async () => {
      const result = await getExistingHostReview(params.bookingId, params.listingId);
      if (result.success && result.review) {
        setExistingReview(result.review);
        setRating(result.review.rating);
        setComment(result.review.comment || "");
      }
      setLoading(false);
    };

    loadExistingReview();
  }, [params.bookingId, params.listingId]);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoveredRating(starValue);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await createHostReview({
      bookingId: params.bookingId,
      listingId: params.listingId,
      rating,
      comment: comment.trim() || undefined
    });

    if (result.success) {
      router.push(`/app/host/${params.listingId}/bookings/${params.bookingId}`);
    } else {
      setError(result.error || "Failed to submit review");
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl p-6 w-full">
        <Card className="flex flex-col items-start gap-2.5 p-10 relative bg-white rounded-lg overflow-hidden border-0 shadow-none">
          <CardContent className="w-full gap-8 flex-[0_0_auto] flex flex-col items-start relative p-0">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="max-w-2xl p-6 w-full">
        <Card className="flex flex-col items-start gap-2.5 p-10 relative bg-white rounded-lg overflow-hidden border-0 shadow-none">
          <CardContent className="w-full gap-8 flex-[0_0_auto] flex flex-col items-start relative p-0">
            <div className="w-full h-[42px] gap-2 flex flex-col items-start relative">
              <h1 className="relative self-stretch h-[42px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-[28px] tracking-[0] leading-[33.6px]">
                YOUR REVIEW
              </h1>
            </div>

          <div className="flex flex-col items-start justify-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative flex items-center justify-start self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
              Your Rating
            </div>

            <div className="flex gap-1">
              {stars.map((starValue) => (
                <StarIcon
                  key={starValue}
                  className={`w-6 h-6 ${starValue <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {comment && (
            <div className="flex flex-col items-start justify-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative flex items-center justify-start self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
                Your Review
              </div>

              <div className="p-4 bg-gray-50 rounded-md text-gray-700">
                {comment}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-6 w-full">
      <Card className="flex flex-col items-start gap-2.5 p-10 relative bg-white rounded-lg overflow-hidden border-0 shadow-none">
        <CardContent className="w-full gap-8 flex-[0_0_auto] flex flex-col items-start relative p-0">
          <div className="w-full h-[42px] gap-2 flex flex-col items-start relative">
            <h1 className="relative self-stretch h-[42px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-bold text-blackblack-500 text-[28px] tracking-[0] leading-[33.6px]">
              LEAVE A REVIEW
            </h1>
          </div>

        <div className="flex flex-col items-start justify-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative flex items-center justify-start self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
            Please Rate Your Renter
          </div>

          <div className="flex gap-1">
            {stars.map((starValue) => (
              <StarIcon
                key={starValue}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                  starValue <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-300 text-gray-300 hover:fill-yellow-200 hover:text-yellow-200'
                }`}
                onClick={() => handleStarClick(starValue)}
                onMouseEnter={() => handleStarHover(starValue)}
                onMouseLeave={handleStarLeave}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative flex items-center justify-start self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#373940] text-base tracking-[0.15px] leading-[normal]">
            Write your review
          </div>

          <Textarea
            placeholder="Write here.."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-[120px] resize-none bg-white border-[#e6e6e6] [font-family:'Poppins',Helvetica] font-normal text-[#7e7e7e] text-base tracking-[0.50px] leading-[normal] placeholder:text-[#7e7e7e]"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <BrandButton
          onClick={handleSubmit}
          disabled={rating === 0}
          isLoading={isSubmitting}
          className="w-full mt-4"
        >
          Submit Review
        </BrandButton>
      </CardContent>
    </Card>
    </div>
  );
}